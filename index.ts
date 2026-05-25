/**
 * # My AD4M Link Language
 *
 * Template for building AD4M link languages using the modern ALDK pattern.
 *
 * Implements perspective-commit, perspective-sync, and perspective-query
 * capabilities. Stores links locally via the storage KV adapter and
 * provides stubs for remote sync that you can fill in.
 *
 * See README.md for architecture details.
 */

import {
    defineLanguage,
    agentDid,
    hash,
    emitPerspectiveDiff,
} from "@coasys/ad4m-ldk";

import type { PerspectiveDiff, LinkExpression } from "./src/types.js";
import * as store from "./src/store.js";
import { performSync } from "./src/sync.js";

// Adapter imports (interfaces for singletons, Deno impls for init)
import { initTransport, initStorage } from "./src/adapters.js";
import { DenoTransport, DenoStorageAdapter } from "./src/adapters-deno.js";

// ---------------------------------------------------------------------------
// Template Variables
// ---------------------------------------------------------------------------
// These are replaced at publish time by the executor. Each one must be
// preceded by the `//!@ad4m-template-variable` comment on the line above.
//
// Add or remove template variables as needed for your link language.
// See README.md § Template Variables for details.

//!@ad4m-template-variable
const UNIQUE_SEED = "<to-be-filled>";

// ---------------------------------------------------------------------------
// Module state
// ---------------------------------------------------------------------------

let myDid: string = "";

function isPlaceholder(value: string): boolean {
    return !value || value === "<to-be-filled>";
}

// ---------------------------------------------------------------------------
// Language definition
// ---------------------------------------------------------------------------

const language = defineLanguage({
    name: "my-ad4m-link-language",
    version: "0.1.0",

    isPublic: true,

    async init() {
        // Initialize adapters before anything else
        initStorage(new DenoStorageAdapter());
        initTransport(new DenoTransport());
        store.initStore(hash);

        myDid = agentDid();

        const configured = !isPlaceholder(UNIQUE_SEED);
        console.log(`[my-link-language] init: did=${myDid}, configured=${configured}`);
    },

    async teardown() {
        myDid = "";
        console.log("[my-link-language] teardown");
    },

    interactions() {
        return [];
    },

    // -----------------------------------------------------------------------
    // perspective-commit
    // -----------------------------------------------------------------------
    commit: {
        async commit(diff: PerspectiveDiff) {
            // 1. Store links locally
            store.applyDiff(diff);

            // 2. TODO: Send links to your remote backend.
            //    Use getTransport().fetch(...) for HTTP calls.
            //    Example:
            //
            //    const transport = getTransport();
            //    for (const link of diff.additions) {
            //        await transport.fetch(
            //            "https://your-backend.example/links",
            //            "POST",
            //            { "Content-Type": "application/json" },
            //            JSON.stringify(link),
            //        );
            //    }

            // 3. Emit diff so other local subscribers are notified
            emitPerspectiveDiff(diff);

            return "";
        },
    },

    // -----------------------------------------------------------------------
    // perspective-sync
    // -----------------------------------------------------------------------
    sync: {
        async sync() {
            // Delegate to the sync module — implement your logic there
            return await performSync();
        },

        async render() {
            return store.allLinks();
        },

        async currentRevision() {
            return store.getRevision() || "";
        },
    },

    // -----------------------------------------------------------------------
    // perspective-query
    // -----------------------------------------------------------------------
    query: {
        supportedKinds() {
            return ["link-pattern"];
        },

        async run(req: { kind: string; payload: unknown }) {
            if (req.kind !== "link-pattern") {
                return { kind: "error", payload: `Unsupported query kind: ${req.kind}` };
            }
            const pattern = req.payload as { source?: string; target?: string; predicate?: string };
            const links = store.queryLinks(pattern);
            return { kind: "links", payload: links };
        },
    },
});

// ---------------------------------------------------------------------------
// Flat exports (required by the ALDK runtime)
// ---------------------------------------------------------------------------

export const {
    name,
    version,
    isPublic,
    init,
    teardown,
    interactions,
    perspectiveCommit,
    perspectiveSyncSync,
    perspectiveSyncRender,
    perspectiveSyncCurrentRevision,
    perspectiveQuerySupportedKinds,
    perspectiveQueryRun,
} = language;

export default language;

// ---------------------------------------------------------------------------
// Template params metadata (for language.publish / LanguageMeta)
// ---------------------------------------------------------------------------

/**
 * List of template parameters this language expects. Pass this as
 * `languageMeta.possibleTemplateParams` when publishing.
 */
export const possibleTemplateParams: string[] = [
    "UNIQUE_SEED",
];
