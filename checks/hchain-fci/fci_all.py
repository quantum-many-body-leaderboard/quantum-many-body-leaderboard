# FCI of open H_N chains (track 3, RULES.md §13): one line of JSON per job, total energy with nuclear repulsion.
# jobs.json: [{"id", "N", "R", "unit": "Bohr"|"Angstrom", "basis"}]; R is the spacing in the stated unit.
import sys, json, time
from pyscf import gto, scf, fci, lib
lib.num_threads(16)
for job in json.load(open(sys.argv[1])):
    t = time.time()
    N, R = job["N"], job["R"]
    mol = gto.M(atom=[("H", (0, 0, i * R)) for i in range(N)], unit=job["unit"], basis=job["basis"],
                spin=N % 2, verbose=0, max_memory=200000)
    mf = (scf.RHF(mol) if N % 2 == 0 else scf.ROHF(mol)).run(conv_tol=1e-12)
    cis = fci.FCI(mf)
    cis.conv_tol = 1e-10
    cis.max_memory = 200000
    e, civec = cis.kernel()
    ss, mult = cis.spin_square(civec, mol.nao, mol.nelec)
    print(json.dumps({**job, "E": e, "E_per_atom": e / N, "E_nuc": mol.energy_nuc(), "E_RHF": mf.e_tot,
                      "S2": ss, "nao": mol.nao, "seconds": round(time.time() - t, 1)}), flush=True)
