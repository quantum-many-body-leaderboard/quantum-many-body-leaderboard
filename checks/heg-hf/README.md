# Hartree-Fock energies of the electron gas: the convention check of track 2 (RULES.md 12.2)

`hf.mjs` gives the Hartree-Fock energy per electron of a plane-wave determinant in a periodic cell (Ewald sum,
uniform background, Madelung term included). Checks of the code: the Madelung constants of the unit simple-cubic
cell (-2.8372975) and unit square (-3.9002649) to 1e-9, and the large-N limits 3D 1.105/rs² - 0.458/rs and
2D 0.5/rs² - 0.600/rs (Ha).

`convention-check-2026-10-16.json`: for each paper of the 2026-10-16 pass, one printed energy against QMBL's HF
energy for its instance. A correlation energy of the right sign and size (0.004 to 0.05 Ha per electron here) fixes
the unit, the normalisation, the cell and the Madelung convention together: leaving the Madelung term out shifts
the energy by xi/2 (0.37 Ha per electron at N = 14, rs = 1), and arXiv:2202.05183's value against an sc or fcc cell
instead of bcc sits 5.1 or 2.6 Ha above HF. arXiv:2607.08616 prints E and E_corr, whose difference reproduces
QMBL's HF energy to all seven printed digits.
