# AD4M Link Language Template

A starting point for building new **AD4M link languages** using the modern [ALDK](https://github.com/coasys/ad4m/tree/dev/ad4m-ldk) (`@coasys/ad4m-ldk`) pattern.

This template gives you a working link language skeleton with:

- Local link store with indexed queries (by source, target, predicate)
- Transport and storage adapter pattern (pure/impure separation)
- Template variable support for per-neighbourhood configuration
- esbuild bundling for the Deno executor runtime
- Unit tests that run outside the executor (Node.js + tsx)

## Prerequisites

- **[Deno](https://deno.land/)** (v1.32+) — used by the executor runtime and the build script
- **[Node.js](https://nodejs.org/)** (v20+) + **npm/pnpm** — for dev dependencies and running tests
- **`@coasys/ad4m-ldk`** — either:
  - Cloned at a sibling path: `../ad4m/ad4m-ldk/js/` (the default)
  - Or set `AD4M_LDK_ENTRY` env var to the compiled `lib/index.js`

## Quick Start

```bash
# Install dev dependencies
pnpm install   # or npm install

# Build the bundle
deno run --allow-all esbuild.ts

# Run tests
node --experimental-vm-modules --import tsx --test tests/*.test.ts

# Type-check
npx tsc --noEmit
```

## Project Structure

```
├── index.ts              # Main entry — uses defineLanguage() from @coasys/ad4m-ldk
├── esbuild.ts            # Build script (Deno + esbuild)
├── package.json          # Dependencies
├── tsconfig.json         # TypeScript config
├── src/
│   ├── types.ts          # Shared types (PerspectiveDiff, LinkExpression, etc.)
│   ├── store.ts          # Local link store using storage KV
│   ├── transport.ts      # Transport interface + singleton
│   ├── transport-deno.ts # Deno/executor transport (httpFetch wrapper)
│   ├── storage-interface.ts  # Storage adapter interface
│   ├── storage-deno.ts   # Deno storage adapter (storageGet/storagePut)
│   └── sync.ts           # Sync logic (implement your remote sync here)
├── tests/
│   └── store.test.ts     # Unit tests for the link store
├── build/                # Output directory (bundle.js)
├── README.md
└── LICENSE               # CAL-1.0
```

## Architecture

### Pure / Impure Separation

Core logic is kept free of runtime-specific imports:

- **Pure modules** (`types.ts`, `store.ts`, `transport.ts`, `storage-interface.ts`, `sync.ts`) — no `ad4m:host` imports. They depend only on TypeScript types and injected adapters. These can be tested in plain Node.js.
- **Impure modules** (`storage-deno.ts`, `transport-deno.ts`) — wrap `ad4m:host` functions via `@coasys/ad4m-ldk`. Only imported in `index.ts` during `init()`.

This separation means your business logic is testable without the executor runtime.

### Transport Adapter

The transport layer abstracts HTTP calls. In the executor, `httpFetch` from `ad4m:host` is the only way to make outbound requests.

**Important:** `httpFetch` returns raw body text on 2xx and throws on non-2xx. The `DenoTransport` in `src/transport-deno.ts` handles this by parsing the error message format to extract status codes.

In tests, inject a `MockTransport` that implements the `Transport` interface.

### Storage Adapter

The storage layer wraps the executor's KV store (`storageGet`, `storagePut`, `storageDelete`, `storageListKeys`). In tests, use a simple `Map`-based mock.

### defineLanguage()

The modern ALDK entry point. Instead of the old `create(context: LanguageContext)` pattern, you call `defineLanguage()` with a config object that declares your capabilities:

```typescript
const language = defineLanguage({
    name: "my-language",
    version: "0.1.0",
    isPublic: true,
    async init() { /* ... */ },
    commit: { async commit(diff) { /* ... */ } },
    sync: { async sync() { /* ... */ } },
    query: { supportedKinds() { /* ... */ }, async run(req) { /* ... */ } },
});
```

The returned object has flat exports (`perspectiveCommit`, `perspectiveSyncSync`, etc.) that the executor binds to.

## Template Variables

Template variables allow per-neighbourhood configuration at publish time. Mark them with the `//!@ad4m-template-variable` comment:

```typescript
//!@ad4m-template-variable
const MY_CONFIG = "<to-be-filled>";
```

When the language is published via `language.publish`, the executor replaces `"<to-be-filled>"` with actual values from the `templateParams` map. The `possibleTemplateParams` export tells the executor which variables exist.

Add your own template variables for backend URLs, API keys, room IDs, or any per-neighbourhood configuration.

## Publishing

To publish your language to an AD4M executor:

1. Build the bundle: `deno run --allow-all esbuild.ts`
2. Use the executor's WebSocket API to call `language.publish`:

```json
{
    "languagePath": "./build/bundle.js",
    "languageMeta": {
        "name": "my-ad4m-link-language",
        "description": "My custom link language",
        "possibleTemplateParams": ["UNIQUE_SEED"],
        "sourceCodeLink": "https://github.com/your-org/your-repo"
    }
}
```

## Implementing Your Sync Logic

The `src/sync.ts` file contains a `performSync()` stub. Replace it with your actual remote sync implementation:

1. Use `getTransport()` for HTTP calls to your backend
2. Use `getStorage()` for persisting sync state (tokens, cursors)
3. Use `store.applyDiff()` to persist incoming links
4. Return the `PerspectiveDiff` of new changes

Similarly, extend `commit.commit()` in `index.ts` to push links to your backend.

## License

[Cryptographic Autonomy License v1.0 (CAL-1.0)](LICENSE)
