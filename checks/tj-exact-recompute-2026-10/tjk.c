/* tjk.c -- t-J ground-state energy in one symmetry sector (qmbl-verify 2026-10-23, group tjE).
 *
 * H = - sum_bonds t_ij sum_s P (c+_is c_js + h.c.) P + sum_bonds J_ij (S_i.S_j - n_i n_j / 4)
 *
 * Basis: |u,d> = prod_{a in u, asc} c+_{a up} prod_{b in d, asc} c+_{b dn} |0>, no double occupancy.
 * Symmetry: an abelian group of site permutations g (T_g c+_i T_g^-1 = c+_{g(i)}) with a 1D character
 * chi(g); sector states P|r>, P = (1/|G|) sum_g conj(chi(g)) T_g, representative r = min over g of
 * the key (g(u) << 32 | g(d)).  Lanczos (no reorthogonalisation) for the lowest eigenvalue.
 *
 * Input file:  N NUP NDN / NHOP / (i j t)* / NEX / (i j J)* / G / (perm[0..N-1] re im)*
 * Usage: tjk <input> <label> [maxit] [seed]          prints one JSON line on stdout
 */
#include <complex.h>
#include <math.h>
#include <omp.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/time.h>
#ifdef __BMI2__
#include <immintrin.h>
#endif

typedef uint32_t u32;
typedef uint64_t u64;
typedef double complex cplx;

static int N, NUP, NDN, NHOP, NEX, G;
static int *hi, *hj, *ei, *ej, *perm;
static double *ht, *eJ;
static cplx *chi;
static u32 *tab, *invm, MASK;
static u64 binom[40][40];

static double now(void) { struct timeval t; gettimeofday(&t, 0); return t.tv_sec + 1e-6 * t.tv_usec; }

static inline u32 gapply(int g, u32 x) {
  const u32 *t = tab + (size_t)g * 1024;
  return t[x & 255] | t[256 + ((x >> 8) & 255)] | t[512 + ((x >> 16) & 255)] | t[768 + (x >> 24)];
}
static inline int ginvpar(int g, u32 x) { /* parity of inversions of g restricted to the set x */
  const u32 *m = invm + (size_t)g * N;
  int c = 0;
  u32 y = x;
  while (y) { int a = __builtin_ctz(y); y &= y - 1; c += __builtin_popcount(x & m[a]); }
  return c & 1;
}
static inline u32 pext32(u32 x, u32 m) {
#ifdef __BMI2__
  return _pext_u32(x, m);
#else
  u32 r = 0; int k = 0;
  while (m) { int a = __builtin_ctz(m); m &= m - 1; if (x >> a & 1) r |= 1u << k; k++; }
  return r;
#endif
}
static inline u32 pdep32(u32 x, u32 m) {
#ifdef __BMI2__
  return _pdep_u32(x, m);
#else
  u32 r = 0; int k = 0;
  while (m) { int a = __builtin_ctz(m); m &= m - 1; if (x >> k & 1) r |= 1u << a; k++; }
  return r;
#endif
}
static inline u64 colex(u32 x) { u64 r = 0; int j = 0; while (x) { int p = __builtin_ctz(x); x &= x - 1; j++; r += binom[p][j]; } return r; }
static inline u32 gosper(u32 x) { u32 c = x & -x, r = x + c; return (((r ^ x) >> 2) / c) | r; }
/* fermion sign of applying c or c+ on mode m to the 64-bit occupation word W (ups in bits 0..N-1) */
static inline int fpar(u64 W, int m) { return __builtin_popcountll(W & ((1ULL << m) - 1)) & 1; }

/* basis */
static int32_t *ublock;  /* colex rank of up word -> block id, -1 if not an up representative */
static int16_t *ugmin;   /* colex rank of up word -> the unique g minimising g(u), -1 if not unique */
static u32 *bu;          /* block up word */
static int64_t *boff;    /* block offsets, nblk+1 */
static unsigned char *btriv;
static int64_t nblk, dim;
static u64 *keys;
static unsigned char *nr; /* n_r = |Stab(r)| */
static int NFREE;        /* N - NUP */

static int64_t lookup(u32 u, u32 d, int *gout) {
  u32 xs[1024];
  int g0 = ugmin[colex(u)];
  if (g0 >= 0) { /* fast path: the orbit-minimal up word is reached by one g only */
    u32 bu0 = gapply(g0, u), bd0 = gapply(g0, d);
    *gout = g0;
    int64_t b = ublock[colex(bu0)];
    if (btriv[b]) return boff[b] + (int64_t)colex(pext32(bd0, ~bu0 & MASK));
    fprintf(stderr, "unique argmin but nontrivial stabilizer\n"); exit(6);
  }
  u32 bestu = 0xffffffffu;
  for (int g = 0; g < G; g++) { u32 x = gapply(g, u); xs[g] = x; if (x < bestu) bestu = x; }
  u32 bestd = 0xffffffffu; int bg = -1;
  for (int g = 0; g < G; g++) if (xs[g] == bestu) { u32 y = gapply(g, d); if (y < bestd) { bestd = y; bg = g; } }
  *gout = bg;
  int64_t b = ublock[colex(bestu)];
  if (b < 0) { fprintf(stderr, "lookup: not an up rep\n"); exit(3); }
  if (btriv[b]) return boff[b] + (int64_t)colex(pext32(bestd, ~bestu & MASK));
  u64 key = ((u64)bestu << 32) | bestd;
  int64_t lo = boff[b], hi_ = boff[b + 1] - 1;
  while (lo <= hi_) { int64_t mid = (lo + hi_) >> 1; if (keys[mid] == key) return mid; if (keys[mid] < key) lo = mid + 1; else hi_ = mid - 1; }
  return -1;
}

static void build_basis(void) {
  double t0 = now();
  u64 nup = binom[N][NUP];
  ublock = malloc(nup * sizeof(int32_t));
  ugmin = malloc(nup * sizeof(int16_t));
  u32 *ups = malloc(nup * sizeof(u32));
  u32 x = (NUP == 0) ? 0 : ((1u << NUP) - 1);
  for (u64 i = 0; i < nup; i++) { ups[i] = x; if (i + 1 < nup) x = gosper(x); }
#pragma omp parallel for schedule(dynamic, 4096)
  for (u64 i = 0; i < nup; i++) {
    u32 m = 0xffffffffu; int am = -1, nm = 0;
    for (int g = 0; g < G; g++) { u32 y = gapply(g, ups[i]); if (y < m) { m = y; am = g; nm = 1; } else if (y == m) nm++; }
    ublock[i] = (m == ups[i]) ? 1 : -1;
    ugmin[i] = (nm == 1) ? (int16_t)am : -1;
  }
  nblk = 0;
  for (u64 i = 0; i < nup; i++) if (ublock[i] > 0) ublock[i] = nblk++; else ublock[i] = -1;
  bu = malloc(nblk * sizeof(u32)); boff = malloc((nblk + 1) * sizeof(int64_t)); btriv = malloc(nblk);
  for (u64 i = 0; i < nup; i++) if (ublock[i] >= 0) bu[ublock[i]] = ups[i];
  free(ups);
  NFREE = N - NUP;
  u64 ndc = binom[NFREE][NDN];
  int64_t *cnt = malloc(nblk * sizeof(int64_t));
#pragma omp parallel for schedule(dynamic, 64)
  for (int64_t b = 0; b < nblk; b++) {
    u32 u0 = bu[b];
    int stab[1024], ns = 0;
    for (int g = 0; g < G; g++) if (gapply(g, u0) == u0) stab[ns++] = g;
    if (ns == 1) { btriv[b] = 1; cnt[b] = ndc; continue; }
    btriv[b] = 0;
    u32 fm = ~u0 & MASK, c = (NDN == 0) ? 0 : ((1u << NDN) - 1);
    int64_t k = 0;
    for (u64 i = 0; i < ndc; i++) {
      u32 d = pdep32(c, fm);
      int ok = 1; cplx s = 0;
      for (int q = 0; q < ns; q++) { u32 y = gapply(stab[q], d); if (y < d) { ok = 0; break; }
        if (y == d) s += conj(chi[stab[q]]) * ((ginvpar(stab[q], u0) ^ ginvpar(stab[q], d)) ? -1.0 : 1.0); }
      if (ok && cabs(s) > 0.5) k++;
      if (i + 1 < ndc) c = gosper(c);
    }
    cnt[b] = k;
  }
  boff[0] = 0;
  for (int64_t b = 0; b < nblk; b++) boff[b + 1] = boff[b] + cnt[b];
  dim = boff[nblk];
  keys = malloc(dim * sizeof(u64)); nr = malloc(dim);
#pragma omp parallel for schedule(dynamic, 64)
  for (int64_t b = 0; b < nblk; b++) {
    u32 u0 = bu[b];
    int stab[1024], ns = 0;
    for (int g = 0; g < G; g++) if (gapply(g, u0) == u0) stab[ns++] = g;
    u32 fm = ~u0 & MASK, c = (NDN == 0) ? 0 : ((1u << NDN) - 1);
    int64_t k = boff[b];
    for (u64 i = 0; i < ndc; i++) {
      u32 d = pdep32(c, fm);
      if (ns == 1) { keys[k] = ((u64)u0 << 32) | d; nr[k] = 1; k++; }
      else {
        int ok = 1; cplx s = 0; int nst = 0;
        for (int q = 0; q < ns; q++) { u32 y = gapply(stab[q], d); if (y < d) { ok = 0; break; }
          if (y == d) { nst++; s += conj(chi[stab[q]]) * ((ginvpar(stab[q], u0) ^ ginvpar(stab[q], d)) ? -1.0 : 1.0); } }
        if (ok && cabs(s) > 0.5) {
          if (fabs(creal(s) - nst) > 1e-6 || fabs(cimag(s)) > 1e-6) { fprintf(stderr, "norm not |Stab|\n"); exit(4); }
          keys[k] = ((u64)u0 << 32) | d; nr[k] = (unsigned char)nst; k++; }
      }
      if (i + 1 < ndc) c = gosper(c);
    }
    if (k != boff[b + 1]) { fprintf(stderr, "count mismatch\n"); exit(5); }
  }
  free(cnt);
  fprintf(stderr, "basis: %lld blocks, dim %lld, %.1f s\n", (long long)nblk, (long long)dim, now() - t0);
}

/* w = H v - beta * w  (pull form) */
static void matvec(const cplx *v, cplx *w, double beta) {
#pragma omp parallel for schedule(dynamic, 1024)
  for (int64_t r = 0; r < dim; r++) {
    u32 u = keys[r] >> 32, d = (u32)keys[r];
    u64 W = (u64)u | ((u64)d << N);
    double sr = sqrt((double)nr[r]);
    double diag = 0;
    cplx acc = 0;
    int g;
    for (int b = 0; b < NHOP; b++) {
      for (int dir = 0; dir < 2; dir++) {
        int i = dir ? hj[b] : hi[b], j = dir ? hi[b] : hj[b]; /* move from j to i */
        u32 occ = u | d;
        if (occ >> i & 1) continue;
        for (int s = 0; s < 2; s++) {
          u32 sw = s ? d : u;
          if (!(sw >> j & 1)) continue;
          int mj = j + s * N, mi = i + s * N;
          int p = fpar(W, mj);
          u64 W2 = W ^ (1ULL << mj);
          p ^= fpar(W2, mi);
          W2 ^= 1ULL << mi;
          double h = -ht[b] * (p ? -1.0 : 1.0);
          u32 u2 = (u32)(W2 & MASK), d2 = (u32)(W2 >> N);
          int64_t t = lookup(u2, d2, &g);
          if (t < 0) continue;
          double sg = (ginvpar(g, u2) ^ ginvpar(g, d2)) ? -1.0 : 1.0;
          acc += h * sg * chi[g] * (sqrt((double)nr[t]) / sr) * v[t];
        }
      }
    }
    for (int b = 0; b < NEX; b++) {
      int i = ei[b], j = ej[b];
      int iu = u >> i & 1, id = d >> i & 1, ju = u >> j & 1, jd = d >> j & 1;
      if (!((iu && jd) || (id && ju))) continue;
      diag += -0.5 * eJ[b];
      /* off-diagonal 1/2 (S+_i S-_j + S-_i S+_j): ops applied right to left */
      int m[4];
      if (iu && jd) { m[0] = j + N; m[1] = j; m[2] = i; m[3] = i + N; }  /* S-_i S+_j = c+_{i dn} c_{i up} c+_{j up} c_{j dn} */
      else          { m[0] = j; m[1] = j + N; m[2] = i + N; m[3] = i; }  /* S+_i S-_j = c+_{i up} c_{i dn} c+_{j dn} c_{j up} */
      u64 W2 = W; int p = 0;
      for (int q = 0; q < 4; q++) { p ^= fpar(W2, m[q]); W2 ^= 1ULL << m[q]; }
      double h = 0.5 * eJ[b] * (p ? -1.0 : 1.0);
      u32 u2 = (u32)(W2 & MASK), d2 = (u32)(W2 >> N);
      int64_t t = lookup(u2, d2, &g);
      if (t < 0) continue;
      double sg = (ginvpar(g, u2) ^ ginvpar(g, d2)) ? -1.0 : 1.0;
      acc += h * sg * chi[g] * (sqrt((double)nr[t]) / sr) * v[t];
    }
    acc += diag * v[r];
    w[r] = acc - beta * w[r];
  }
}

/* lowest eigenvalue of the m x m tridiagonal (a, b) by Sturm bisection */
static double tri_min(const double *a, const double *b, int m) {
  double lo = 1e300, hi_ = -1e300;
  for (int i = 0; i < m; i++) {
    double r = (i > 0 ? fabs(b[i - 1]) : 0) + (i < m - 1 ? fabs(b[i]) : 0);
    if (a[i] - r < lo) lo = a[i] - r;
    if (a[i] + r > hi_) hi_ = a[i] + r;
  }
  for (int it = 0; it < 200; it++) {
    double x = 0.5 * (lo + hi_), q = 1; int c = 0;
    for (int i = 0; i < m; i++) {
      q = a[i] - x - (i > 0 ? b[i - 1] * b[i - 1] / q : 0);
      if (q == 0) q = 1e-300;
      if (q < 0) c++;
    }
    if (c >= 1) hi_ = x; else lo = x;
    if (hi_ - lo < 1e-14 * (1 + fabs(x))) break;
  }
  return 0.5 * (lo + hi_);
}

static u64 smix(u64 x) { x += 0x9E3779B97F4A7C15ULL; x = (x ^ (x >> 30)) * 0xBF58476D1CE4E5B9ULL; x = (x ^ (x >> 27)) * 0x94D049BB133111EBULL; return x ^ (x >> 31); }

int main(int argc, char **argv) {
  if (argc < 3) { fprintf(stderr, "usage: tjk input label [maxit] [seed]\n"); return 1; }
  int maxit = argc > 3 ? atoi(argv[3]) : 600;
  u64 seed = argc > 4 ? strtoull(argv[4], 0, 10) : 12345;
  FILE *f = fopen(argv[1], "r");
  if (!f) { perror("input"); return 1; }
  for (int i = 0; i < 40; i++) for (int j = 0; j < 40; j++) binom[i][j] = (j == 0) ? 1 : (i == 0 ? 0 : binom[i - 1][j - 1] + binom[i - 1][j]);
  if (fscanf(f, "%d %d %d", &N, &NUP, &NDN) != 3) return 2;
  if (N > 32) return 2;
  MASK = (N == 32) ? 0xffffffffu : ((1u << N) - 1);
  if (fscanf(f, "%d", &NHOP) != 1) return 2;
  hi = malloc(NHOP * sizeof(int)); hj = malloc(NHOP * sizeof(int)); ht = malloc(NHOP * sizeof(double));
  for (int b = 0; b < NHOP; b++) if (fscanf(f, "%d %d %lf", &hi[b], &hj[b], &ht[b]) != 3) return 2;
  if (fscanf(f, "%d", &NEX) != 1) return 2;
  ei = malloc(NEX * sizeof(int)); ej = malloc(NEX * sizeof(int)); eJ = malloc(NEX * sizeof(double));
  for (int b = 0; b < NEX; b++) if (fscanf(f, "%d %d %lf", &ei[b], &ej[b], &eJ[b]) != 3) return 2;
  if (fscanf(f, "%d", &G) != 1 || G > 1024) return 2;
  perm = malloc((size_t)G * N * sizeof(int)); chi = malloc(G * sizeof(cplx));
  for (int g = 0; g < G; g++) {
    for (int i = 0; i < N; i++) if (fscanf(f, "%d", &perm[g * N + i]) != 1) return 2;
    double re, im; if (fscanf(f, "%lf %lf", &re, &im) != 2) return 2;
    chi[g] = re + I * im;
  }
  fclose(f);
  tab = calloc((size_t)G * 1024, sizeof(u32)); invm = calloc((size_t)G * N, sizeof(u32));
  for (int g = 0; g < G; g++) {
    const int *p = perm + g * N;
    for (int byte = 0; byte < 4; byte++) for (int x = 0; x < 256; x++) {
      u32 y = 0;
      for (int k = 0; k < 8; k++) if (x >> k & 1) { int s = 8 * byte + k; if (s < N) y |= 1u << p[s]; }
      tab[(size_t)g * 1024 + byte * 256 + x] = y;
    }
    for (int a = 0; a < N; a++) { u32 m = 0; for (int b = a + 1; b < N; b++) if (p[b] < p[a]) m |= 1u << b; invm[g * N + a] = m; }
  }
  double t0 = now();
  build_basis();
  if (dim == 0) { printf("{\"label\":\"%s\",\"dim\":0}\n", argv[2]); return 0; }
  cplx *v1 = malloc(dim * sizeof(cplx)), *v0 = malloc(dim * sizeof(cplx));
  double nrm = 0;
#pragma omp parallel for reduction(+ : nrm)
  for (int64_t r = 0; r < dim; r++) {
    u64 a = smix(seed ^ (2 * (u64)r)), b = smix(seed ^ (2 * (u64)r + 1));
    v1[r] = ((double)(a >> 11) / 9007199254740992.0 - 0.5) + I * ((double)(b >> 11) / 9007199254740992.0 - 0.5);
    v0[r] = 0; nrm += creal(v1[r] * conj(v1[r]));
  }
  nrm = sqrt(nrm);
#pragma omp parallel for
  for (int64_t r = 0; r < dim; r++) v1[r] /= nrm;
  double *al = malloc(maxit * sizeof(double)), *be = malloc(maxit * sizeof(double));
  double beta = 0, E = 0, Eold = 1e300; int it, conv = 0;
  double tm = 0;
  for (it = 0; it < maxit; it++) {
    double ta = now();
    matvec(v1, v0, beta);
    tm += now() - ta;
    double alpha = 0;
#pragma omp parallel for reduction(+ : alpha)
    for (int64_t r = 0; r < dim; r++) alpha += creal(conj(v1[r]) * v0[r]);
    double nb = 0;
#pragma omp parallel for reduction(+ : nb)
    for (int64_t r = 0; r < dim; r++) { v0[r] -= alpha * v1[r]; nb += creal(v0[r] * conj(v0[r])); }
    nb = sqrt(nb);
    al[it] = alpha; be[it] = nb;
    E = tri_min(al, be, it + 1);
    if (it % 10 == 0) fprintf(stderr, "it %d E %.12f beta %.3e (%.2f s/matvec)\n", it, E, nb, tm / (it + 1));
    if (fabs(E - Eold) < 1e-13 * (1 + fabs(E))) { conv++; if (conv >= 5) { it++; break; } } else conv = 0;
    Eold = E;
    if (nb < 1e-10 * (1 + fabs(alpha))) { it++; conv = 99; break; }
#pragma omp parallel for
    for (int64_t r = 0; r < dim; r++) v0[r] /= nb;
    cplx *tmp = v0; v0 = v1; v1 = tmp;
    beta = nb;
  }
  printf("{\"label\":\"%s\",\"N\":%d,\"N_up\":%d,\"N_dn\":%d,\"G\":%d,\"dim\":%lld,\"E\":%.12f,\"iters\":%d,\"converged\":%s,\"seconds\":%.1f,\"threads\":%d}\n",
         argv[2], N, NUP, NDN, G, (long long)dim, E, it, conv >= 5 ? "true" : "false", now() - t0, omp_get_max_threads());
  return 0;
}
