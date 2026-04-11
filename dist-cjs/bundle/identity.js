"use strict";
// src/bundle/identity.ts — Parse and format BundleIdentity strings
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseBundleIdentity = parseBundleIdentity;
exports.formatBundleIdentity = formatBundleIdentity;
/**
 * Parse a bundle identity string in the format "namespace/name:version".
 * Example: "jingu/core:1.0.0" -> { namespace: "jingu", name: "core", version: "1.0.0" }
 */
function parseBundleIdentity(s) {
    const colonIdx = s.lastIndexOf(":");
    if (colonIdx === -1) {
        throw new Error(`Invalid bundle identity: "${s}" — expected "ns/name:version"`);
    }
    const version = s.slice(colonIdx + 1);
    const slashIdx = s.lastIndexOf("/", colonIdx);
    if (slashIdx === -1) {
        throw new Error(`Invalid bundle identity: "${s}" — expected "ns/name:version"`);
    }
    return {
        namespace: s.slice(0, slashIdx),
        name: s.slice(slashIdx + 1, colonIdx),
        version,
    };
}
/**
 * Format a BundleIdentity object into the canonical string form "namespace/name:version".
 */
function formatBundleIdentity(id) {
    return `${id.namespace}/${id.name}:${id.version}`;
}
//# sourceMappingURL=identity.js.map