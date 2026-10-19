// Definitions shared by the figures (figures.mjs), the README leaderboard (readme_table.mjs)
// and the site (site.mjs), so that they all count "contested" and the method families the
// same way.

// An instance with at least CONTESTED published rows is "contested".
export const CONTESTED = 5;

// Instances chosen by hand, in the order the site's front page shows them first. The README
// lists every instance instead (readme_table.mjs).
export const FRONTIER = [
  ["J1J2/square_64_P_0.5", "J1-J2 square 8x8, J2 = 0.5"],
  ["J1J2/square_100_P_0.5", "J1-J2 square 10x10, J2 = 0.5"],
  ["J1J2/square_256_P_0.5", "J1-J2 square 16x16, J2 = 0.5"],
  ["J1J2/square_400_P_0.5", "J1-J2 square 20x20, J2 = 0.5"],
  ["Hubbard/square_256_P_112_8", "Hubbard square 16x16, U = 8, n = 0.875"],
  ["Hubbard/rectangular-4x16_64_P_28_8", "Hubbard 4x16, U = 8, n = 0.875"],
  ["Heisenberg/triangular_196_O", "Triangular Heisenberg, 196 sites, open"],
  ["Heisenberg/kagome-8x8_192_P", "Kagome Heisenberg, 192 sites"],
  ["Heisenberg/pyrochlore-4x4x4_256_P", "Pyrochlore Heisenberg, 256 sites"],
];
export const variationalRows = i => i.rows.filter(r => r.bound_type === "variational");

// Families are matched by regular expression against the `method` string, first match
// wins, in this order, so a row naming both an architecture and its optimiser lands in
// the architecture it names first.
export const FAMILIES = [
  ["tensor network", /\bdmrg\b|\bmps\b|\bpeps\b|tensor.?network|\bmera\b/i],
  ["transformer / ViT", /transformer|\bvit\b|attention|\bctwf\b|\bhqt\b|\bpitqs\b|\btqs\b/i],
  ["CNN / ResNet", /\bcnn\b|\bgcnn\b|\bacnn\b|pixelcnn|convnext|resnet|conv layer|\bace\b|\bscale\b/i],
  ["RNN", /\brnn\b|\bprnn\b|\bgru\b|mingru|\blstm\b/i],
  ["RBM", /\brbm\b/i],
  // Hartree-Fock before backflow: "HB K = 0 (HF)" is the single determinant a backflow
  // hierarchy starts from, i.e. mean field, not backflow. Only the name, not the phrase:
  // "soft mean-field constraint" describes a hidden-fermion state and "projected mean
  // field" is a Gutzwiller-projected one.
  ["mean field", /hartree|\bhf\b/i],
  // HB K = n is hierarchical backflow at order K (arXiv:2606.00924); BW1/BW2 are the
  // tensor-represented backflow corrections of arXiv:2308.11823.
  ["backflow / Pfaffian", /backflow|\bnnbf\b|pfaffian|\bhfps\b|hidden.?fermion|\bhb\b|\bbw\d\b/i],
  // Neural ansatze that are none of the architectures above: the autoregressive neural
  // Slater-Jastrow (arSJVMC), NAQS, symmetric feed-forward nets, graph networks.
  ["other NQS", /arsjvmc|\bnaqs\b|\bffn\b|\bmlp\b|graph neural|\bgnn\b|neural|\bnqs\b/i],
  // Bare "VMC" and "VMC + n Lanczos steps" are the Gutzwiller/Jastrow-projected states of
  // Hu, Becca and Sorella; every neural family is matched before this line.
  ["classic VMC", /gutzwiller|jastrow|\bbcs\b|spin liquid|\bmvmc\b|slater|lanczos|\bvmc\b|\brvb\b|pair.?product|projected mean.?field/i],
  // Basis-set many-body methods of track 2: FCIQMC, coupled and distinguishable cluster, MP2.
  ["FCIQMC / CC", /fciqmc|\bccs?d|\bdcd\b|coupled cluster|\bmp2\b/i],
  // Diffusion Monte Carlo (track 2's fixed-node and fixed-phase projector rows), before the lattice
  // projector methods so "fixed-node DMC" is not filed as GFMC.
  ["DMC", /\bdmc\b|diffusion monte carlo|fixed.?phase/i],
  ["AFQMC / GFMC", /afqmc|fixed.?node|\bgfmc\b|\bvafqmc\b|\bfn\b/i],
  ["VQE / circuit", /\bvqe\b|circuit|statevector/i],
];
export const family = m => FAMILIES.find(([, re]) => re.test(m || ""))?.[0] ?? "other";
