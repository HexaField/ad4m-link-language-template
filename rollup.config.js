import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

const NODE_BUILTINS = new Set([
  'assert', 'buffer', 'child_process', 'cluster', 'crypto', 'dgram', 'dns',
  'events', 'fs', 'http', 'http2', 'https', 'net', 'os', 'path', 'perf_hooks',
  'process', 'querystring', 'readline', 'stream', 'string_decoder', 'timers',
  'tls', 'tty', 'url', 'util', 'v8', 'vm', 'worker_threads', 'zlib',
]);

export default {
  input: 'src/index.ts',
  output: {
    file: 'build/index.js',
    format: 'es',
    sourcemap: true,
  },
  plugins: [
    // Resolve package.json imports to empty objects (some deps try to import their own package.json)
    {
      name: 'ignore-package-json',
      resolveId(source) {
        if (source.endsWith('package.json')) {
          return { id: '\0empty-package-json', moduleSideEffects: false };
        }
        return null;
      },
      load(id) {
        if (id === '\0empty-package-json') {
          return 'export default {}; export var version = "0.0.0";';
        }
        return null;
      },
    },
    // Rewrite bare Node builtin imports to node: prefix for Deno compatibility
    {
      name: 'node-prefix-builtins',
      resolveId(source) {
        const bare = source.replace(/\?commonjs-external$/, '').replace(/^node:/, '');
        if (NODE_BUILTINS.has(bare)) {
          return { id: `node:${bare}`, external: true };
        }
        return null;
      },
    },
    // --- Optional: Inline WASM binary for languages that use WebAssembly ---
    // If your language depends on a .wasm file, uncomment and adapt:
    //
    // import { readFileSync } from 'fs';
    // import { join, dirname } from 'path';
    // import { fileURLToPath } from 'url';
    // const __dirname = dirname(fileURLToPath(import.meta.url));
    // const wasmBase64 = readFileSync(join(__dirname, 'path/to/file.wasm')).toString('base64');
    //
    // {
    //   name: 'inline-wasm',
    //   generateBundle(_, bundle) {
    //     for (const [fileName, chunk] of Object.entries(bundle)) {
    //       if (chunk.type === 'chunk' && chunk.code.includes('your_wasm_file')) {
    //         chunk.code = chunk.code.replace(
    //           /readFileSync\(.*?\.wasm.*?\)/,
    //           `Uint8Array.from(atob("${wasmBase64}"), c => c.charCodeAt(0))`
    //         );
    //       }
    //     }
    //   },
    // },
    resolve({
      preferBuiltins: false,
    }),
    commonjs(),
    typescript({ tsconfig: './tsconfig.json' }),
  ].filter(Boolean),
  // Bundle everything — Deno has no node_modules
  external: [],
};
