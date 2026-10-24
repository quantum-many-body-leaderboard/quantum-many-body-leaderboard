// ed.c: Lanczos lowest eigenvalue of a spin-1/2 Hamiltonian written with Pauli matrices,
//   H = sum_b ( Jx_b sx_i sx_j + Jy_b sy_i sy_j + Jz_b sz_i sz_j ).
// Written for the QMBL famE exact recompute (2026-10-23), independent of other QMBL tools.
//
// usage: ed <bondfile> <sz|full> <maxiter> <tol> [dimerfile] [seed]
//   sz   : basis of all states with N/2 up spins (needs Jx == Jy on every bond)
//   full : all 2^N states (any Jx, Jy, Jz; real because sy sy is real in the z basis)
//   dimerfile: deflate the singlet-dimer product state (exact eigenstate of SS models)
// Output: one line per iteration "it E0 E1"; final line "FINAL E0 ...".
#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>
#include <math.h>
#include <string.h>
#include <time.h>
#include <omp.h>

typedef uint64_t u64;
static int N, NB, MODE; // MODE 0 = sz, 1 = full
static u64 *bmask; static double *jz, *apar, *aanti;
static int nlo, nhi, m_up;
static u64 *offhi; static uint32_t *lorank;
static u64 binom[70][70];
static u64 DIM;

static inline u64 rank_sz(u64 s) {
  return offhi[s >> nlo] + lorank[s & ((1ULL << nlo) - 1)];
}
static inline u64 rnk(u64 s) { return MODE ? s : rank_sz(s); }

static u64 unrank_sz(u64 r) {
  u64 s = 0; int need = m_up;
  for (int k = N - 1; k >= 0 && need > 0; k--) {
    u64 c = binom[k][need];
    if (r >= c) { r -= c; s |= 1ULL << k; need--; }
  }
  return s;
}
static inline u64 next_perm(u64 v) {
  u64 t = v | (v - 1);
  return (t + 1) | (((~t & -~t) - 1) >> (__builtin_ctzll(v) + 1));
}

static void matvec(const double *x, double *y, double beta) {
  // y = H x - beta * y   (gather form, y may hold v_prev)
  const u64 CH = 1ULL << 15;
  u64 nch = (DIM + CH - 1) / CH;
#pragma omp parallel for schedule(dynamic, 4)
  for (u64 c = 0; c < nch; c++) {
    u64 r0 = c * CH, r1 = r0 + CH; if (r1 > DIM) r1 = DIM;
    u64 s = MODE ? r0 : unrank_sz(r0);
    for (u64 r = r0; r < r1; r++) {
      double acc = 0.0, d = 0.0;
      for (int b = 0; b < NB; b++) {
        u64 mk = bmask[b];
        int par = (__builtin_popcountll(s & mk) != 1);
        if (par) { d += jz[b]; if (apar[b] != 0.0) acc += apar[b] * x[rnk(s ^ mk)]; }
        else { d -= jz[b]; if (aanti[b] != 0.0) acc += aanti[b] * x[rnk(s ^ mk)]; }
      }
      y[r] = d * x[r] + acc - beta * y[r];
      if (!MODE && r + 1 < r1) s = next_perm(s); else s++;
    }
  }
}

static double dot(const double *a, const double *b) {
  double t = 0.0;
#pragma omp parallel for reduction(+:t) schedule(static)
  for (u64 r = 0; r < DIM; r++) t += a[r] * b[r];
  return t;
}

// deflation vector (sparse)
static u64 nd = 0; static u64 *drank; static double *damp;
static void deflate(double *v) {
  if (!nd) return;
  double t = 0.0;
  for (u64 k = 0; k < nd; k++) t += damp[k] * v[drank[k]];
  for (u64 k = 0; k < nd; k++) v[drank[k]] -= t * damp[k];
}

// lowest eigenvalues of tridiagonal (a[0..k-1], b[0..k-2]) via Sturm bisection
static int sturm(const double *a, const double *b, int k, double x) {
  int cnt = 0; double q = 1.0;
  for (int i = 0; i < k; i++) {
    double bb = i ? b[i - 1] * b[i - 1] : 0.0;
    q = a[i] - x - (i ? bb / q : 0.0);
    if (q == 0.0) q = 1e-300;
    if (q < 0) cnt++;
  }
  return cnt;
}
static double tri_eig(const double *a, const double *b, int k, int idx) {
  double lo = 1e300, hi = -1e300;
  for (int i = 0; i < k; i++) {
    double r = (i ? fabs(b[i - 1]) : 0) + (i < k - 1 ? fabs(b[i]) : 0);
    if (a[i] - r < lo) lo = a[i] - r; if (a[i] + r > hi) hi = a[i] + r;
  }
  for (int it = 0; it < 200; it++) {
    double mid = 0.5 * (lo + hi);
    if (mid == lo || mid == hi) break;
    if (sturm(a, b, k, mid) > idx) hi = mid; else lo = mid;
  }
  return 0.5 * (lo + hi);
}

static inline double hrand(u64 r, u64 seed) {
  u64 z = r * 0x9E3779B97F4A7C15ULL + seed * 0xBF58476D1CE4E5B9ULL + 0x94D049BB133111EBULL;
  z = (z ^ (z >> 30)) * 0xBF58476D1CE4E5B9ULL; z = (z ^ (z >> 27)) * 0x94D049BB133111EBULL; z ^= z >> 31;
  return (double)(z >> 11) / 9007199254740992.0 - 0.5;
}

int main(int argc, char **argv) {
  if (argc < 5) { fprintf(stderr, "usage\n"); return 1; }
  FILE *f = fopen(argv[1], "r");
  if (fscanf(f, "%d %d", &N, &NB) != 2) return 2;
  MODE = strcmp(argv[2], "full") == 0;
  int maxit = atoi(argv[3]); double tol = atof(argv[4]);
  u64 seed = argc > 6 ? strtoull(argv[6], 0, 10) : 12345;
  bmask = malloc(NB * 8); jz = malloc(NB * 8); apar = malloc(NB * 8); aanti = malloc(NB * 8);
  for (int b = 0; b < NB; b++) {
    int i, j; double Jx, Jy, Jz;
    if (fscanf(f, "%d %d %lf %lf %lf", &i, &j, &Jx, &Jy, &Jz) != 5) return 3;
    bmask[b] = (1ULL << i) | (1ULL << j); jz[b] = Jz;
    apar[b] = Jx - Jy;  // sx sx + sy sy on parallel spins: (Jx - Jy)
    aanti[b] = Jx + Jy; // on antiparallel spins: (Jx + Jy)
    if (!MODE && apar[b] != 0.0) { fprintf(stderr, "sz mode needs Jx == Jy\n"); return 4; }
  }
  fclose(f);
  for (int n = 0; n < 70; n++) { binom[n][0] = 1; for (int k = 1; k <= n; k++) binom[n][k] = binom[n - 1][k - 1] + (k <= n - 1 ? binom[n - 1][k] : 0); }
  if (MODE) DIM = 1ULL << N;
  else {
    m_up = N / 2; nlo = N / 2; nhi = N - nlo; DIM = binom[N][m_up];
    lorank = malloc(sizeof(uint32_t) << nlo); offhi = malloc(sizeof(u64) << nhi);
    uint32_t cnt[64] = {0};
    for (u64 l = 0; l < (1ULL << nlo); l++) lorank[l] = cnt[__builtin_popcountll(l)]++;
    u64 acc = 0;
    for (u64 h = 0; h < (1ULL << nhi); h++) {
      offhi[h] = acc; int p = __builtin_popcountll(h);
      if (m_up - p >= 0 && m_up - p <= nlo) acc += binom[nlo][m_up - p];
    }
    if (acc != DIM) { fprintf(stderr, "rank table mismatch\n"); return 5; }
  }
  fprintf(stderr, "N=%d bonds=%d mode=%s dim=%llu threads=%d\n", N, NB, argv[2], (unsigned long long)DIM, omp_get_max_threads());
  if (argc > 5 && strcmp(argv[5], "-") != 0) {
    FILE *g = fopen(argv[5], "r"); int ndim; if (fscanf(g, "%d", &ndim) != 1) return 6;
    int *da = malloc(ndim * 4), *db = malloc(ndim * 4);
    for (int k = 0; k < ndim; k++) if (fscanf(g, "%d %d", &da[k], &db[k]) != 2) return 7;
    fclose(g);
    nd = 1ULL << ndim; drank = malloc(nd * 8); damp = malloc(nd * 8);
    double amp = pow(2.0, -0.5 * ndim);
    for (u64 c = 0; c < nd; c++) {
      u64 s = 0; double sg = 1.0;
      for (int k = 0; k < ndim; k++) {
        if ((c >> k) & 1) { s |= 1ULL << da[k]; } else { s |= 1ULL << db[k]; sg = -sg; }
      }
      drank[c] = rnk(s); damp[c] = sg * amp;
    }
    fprintf(stderr, "deflating dimer product state (%d dimers)\n", ndim);
  }
  double *v = malloc(DIM * 8), *w = malloc(DIM * 8);
  if (!v || !w) { fprintf(stderr, "alloc failed\n"); return 8; }
#pragma omp parallel for schedule(static)
  for (u64 r = 0; r < DIM; r++) { v[r] = hrand(r, seed); w[r] = 0.0; }
  deflate(v);
  double nrm = sqrt(dot(v, v));
#pragma omp parallel for schedule(static)
  for (u64 r = 0; r < DIM; r++) v[r] /= nrm;
  double *al = malloc(maxit * 8), *be = malloc(maxit * 8);
  double beta = 0.0, last = 0.0; int stable = 0;
  double t0 = omp_get_wtime();
  int it;
  for (it = 0; it < maxit; it++) {
    matvec(v, w, beta);              // w = H v - beta v_prev
    double alpha = dot(v, w);
#pragma omp parallel for schedule(static)
    for (u64 r = 0; r < DIM; r++) w[r] -= alpha * v[r];
    deflate(w);
    beta = sqrt(dot(w, w));
    al[it] = alpha; be[it] = beta;
    double e0 = tri_eig(al, be, it + 1, 0);
    double e1 = it > 0 ? tri_eig(al, be, it + 1, 1) : NAN;
    printf("%d %.15f %.15f %.1f\n", it + 1, e0, e1, omp_get_wtime() - t0); fflush(stdout);
    if (it > 20 && fabs(e0 - last) < tol) { if (++stable >= 5) { last = e0; it++; break; } } else stable = 0;
    last = e0;
    if (beta < 1e-13) { it++; break; }
#pragma omp parallel for schedule(static)
    for (u64 r = 0; r < DIM; r++) { double t = w[r] / beta; w[r] = v[r]; v[r] = t; }
  }
  printf("FINAL %.15f iterations %d seconds %.1f dim %llu\n", last, it, omp_get_wtime() - t0, (unsigned long long)DIM);
  return 0;
}
