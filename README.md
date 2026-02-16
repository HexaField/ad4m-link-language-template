# AD4M Link Language Template

A ready-to-use template for creating [AD4M](https://ad4m.dev) Languages with full unit + E2E test support and GitHub Actions CI.

## What is an AD4M Language?

AD4M (Agent-Centric Distributed Application Meta-ontology) uses "Languages" as its abstraction for any storage/communication backend. A Language defines how expressions (content) are created, stored, and retrieved, and how links (relationships) are synced between agents.

This template provides the scaffolding so you can focus on your adapter logic — the Rollup config, Deno compatibility, CI pipeline, and test infrastructure are all handled.

## Quick Start

```bash
# 1. Clone this template
git clone https://github.com/YOUR_ORG/ad4m-link-language-template my-language
cd my-language

# 2. Update package.json with your language name
# 3. Install dependencies
pnpm install

# 4. Run unit tests (in-memory adapters work out of the box)
pnpm test

# 5. Build the bundle
pnpm run build

# 6. Run E2E tests (requires Linux — see CI section)
pnpm run test:e2e
```

## Project Structure

```
├── src/
│   ├── index.ts          # Language factory — entry point
│   ├── adapter.ts        # Expression adapter (create/get expressions)
│   ├── links.ts          # Links adapter (add/remove/get links)
│   └── types.ts          # Shared types
├── test/
│   ├── adapter.test.ts   # Unit tests for expressions
│   ├── links.test.ts     # Unit tests for links
│   └── ad4m-e2e.test.js  # E2E test with real AD4M executor
├── scripts/
│   └── patch-ad4m-test.cjs  # Compatibility patches for @coasys/ad4m-test
├── rollup.config.js      # Builds Deno-compatible ESM bundle
├── .github/workflows/
│   └── ci.yml            # GitHub Actions: unit + E2E tests
└── package.json
```

## Building Your Language

### 1. Implement Your Adapters

The template ships with in-memory adapters that pass all tests. Replace them with your actual storage backend:

- **`src/adapter.ts`** — `MyExpressionAdapter` and `MyPutAdapter`
  - `createPublicExpression(data)` → store content, return address
  - `get(address)` → retrieve content by address

- **`src/links.ts`** — `MyLinksAdapter`
  - `addLink(link)` → persist a link
  - `removeLink(link)` → remove a link
  - `getLinks(query)` → query links

### 2. Add Your Dependencies

Install your storage backend (e.g., Gun.js, Automerge, Nostr, IPFS):

```bash
pnpm add gun  # or whatever you're using
```

### 3. Build

```bash
pnpm run build
# Produces build/index.js — a single ESM bundle
```

## Deno Compatibility

The AD4M executor runs Language bundles in an embedded **Deno** runtime, not Node.js. This means:

- **ESM only** — no `require()`, no `module.exports`
- **No `node_modules`** — everything must be bundled (Rollup `external: []`)
- **`node:` prefix required** — `import fs from 'fs'` → `import fs from 'node:fs'`
- **No CJS dependencies** — the Rollup config converts them automatically

The included `rollup.config.js` handles all of this with two custom plugins:
- `node-prefix-builtins` — rewrites bare Node builtin imports to `node:` prefix
- `ignore-package-json` — resolves `package.json` imports to empty objects

### Inlining Large Assets (WASM, etc.)

If your language uses WASM or other binary assets, they must be inlined in the bundle since Deno loads languages in isolation with no filesystem access to `node_modules`. See the commented example in `rollup.config.js`.

## Testing

### Unit Tests

```bash
pnpm test  # vitest
```

Unit tests use mocked `LanguageContext` and run anywhere (Node 22+).

### E2E Tests

```bash
pnpm run test:e2e  # requires Linux with glibc 2.39+
```

E2E tests run your Language inside a real AD4M executor. They require:
- **Linux** (no macOS binary available)
- **glibc 2.39+** (Ubuntu 24.04+ or GitHub Actions `ubuntu-latest`)
- **Node 22+**

The CI workflow handles all of this automatically on GitHub Actions.

### `@coasys/ad4m-test` Compatibility

The published `@coasys/ad4m-test` package has [multiple issues](https://github.com/coasys/ad4m/issues/671) that prevent it from working out of the box. The included `scripts/patch-ad4m-test.cjs` handles all of them:

- Compiles the TypeScript source (no `build/` directory shipped)
- Fixes CLI flag names (camelCase → kebab-case)
- Fixes GitHub API URL (`perspect3vism` → `coasys`)
- Converts CJS language bundles to ESM for Deno
- Patches out removed IPFS dependency
- Creates `bootstrapSeed.json` with Language Language bundle

These fixes are upstreamed in [PR #670](https://github.com/coasys/ad4m/pull/670). Once merged, the patch script can be simplified.

## CI

The included GitHub Actions workflow (`.github/workflows/ci.yml`) runs:

1. **Unit Tests** — `pnpm test` on ubuntu-latest, Node 22
2. **E2E Tests** — builds the bundle, patches ad4m-test, downloads the executor binary, runs the full integration test

Push to `main` or open a PR to trigger it.

## Creating a GitHub Template Repo

To use this as a GitHub template:

1. Push to a new repo
2. Go to Settings → check "Template repository"
3. Others can then click "Use this template" to create new languages

## Related

- [AD4M Documentation](https://docs.ad4m.dev)
- [coasys/ad4m](https://github.com/coasys/ad4m) — AD4M source
- [PR #670](https://github.com/coasys/ad4m/pull/670) — Test runner fixes
- [Issue #671](https://github.com/coasys/ad4m/issues/671) — Compatibility issues tracker
- [Issue #667](https://github.com/coasys/ad4m/issues/667) — Template repo request

## License

MIT
