/**
 * Transport abstraction layer — interfaces and singleton only.
 *
 * No ad4m:host imports. Safe for cross-runtime testing.
 * Deno-specific implementation is in transport-deno.ts.
 */

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

export interface TransportResponse {
    status: number;
    headers: Record<string, string>;
    body: string;
}

export interface Transport {
    fetch(
        url: string,
        method: string,
        headers: Record<string, string>,
        body: string,
    ): Promise<TransportResponse>;
}

// ---------------------------------------------------------------------------
// Global singleton
// ---------------------------------------------------------------------------

let _transport: Transport | null = null;

export function initTransport(transport: Transport): void {
    _transport = transport;
}

export function getTransport(): Transport {
    if (!_transport) {
        throw new Error(
            "Transport not initialized. Call initTransport() during language init().",
        );
    }
    return _transport;
}
