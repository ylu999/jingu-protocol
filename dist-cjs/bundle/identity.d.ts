import type { BundleIdentity } from "./schema.js";
/**
 * Parse a bundle identity string in the format "namespace/name:version".
 * Example: "jingu/core:1.0.0" -> { namespace: "jingu", name: "core", version: "1.0.0" }
 */
export declare function parseBundleIdentity(s: string): BundleIdentity;
/**
 * Format a BundleIdentity object into the canonical string form "namespace/name:version".
 */
export declare function formatBundleIdentity(id: BundleIdentity): string;
//# sourceMappingURL=identity.d.ts.map