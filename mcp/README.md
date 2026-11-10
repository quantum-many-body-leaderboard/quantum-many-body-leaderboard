# QMBL MCP server

Read-only access for AI systems to QMBL: the Quantum Many-Body Leaderboard, over the
[Model Context Protocol](https://modelcontextprotocol.io). One file, `server.mjs`, with no
dependencies; it needs Node 22 or later. It reads the files the site publishes under
[qmbl.org/api/](../DATA.md#the-sites-machine-api-api) and computes no value of its own.

| tool | what it returns |
|---|---|
| `list_models` | per model: counts, lattices, boundaries, size range, parameter names |
| `search_instances` | instances filtered by model, lattice, boundary, size range, parameters, open only, words in the label |
| `best_values` | for one instance: the exact energy and the best energy of each bound type, with sigma, method and reference |
| `get_instance` | for one instance: every row |

Cite individual energies to the primary paper named on the row, not to QMBL.

## Install

Clone the repository, or download `server.mjs` alone. Then, in Claude Code:

```sh
claude mcp add qmbl -- node /path/to/mcp/server.mjs
```

Any other MCP client: command `node`, argument the path to `server.mjs`, transport stdio.

## Settings

| variable | effect |
|---|---|
| `QMBL_URL` | the deployment to read (default `https://qmbl.org`) |
| `QMBL_SITE` | a local build to read instead, the `_site/` that `scripts/site.mjs` writes |

The server caches each file for the life of the process. Restart it to see a new build.
