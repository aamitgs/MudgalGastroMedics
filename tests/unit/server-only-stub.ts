/**
 * `server-only` is supplied by Next at build time, so it does not resolve
 * under vitest. Aliasing it to this empty module lets unit tests import
 * server-side modules directly (PDF builders, stores) without weakening
 * anything: the real guard is enforced by the Next build, which never sees
 * this file.
 */
export {};
