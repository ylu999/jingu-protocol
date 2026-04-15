"use strict";
/**
 * phase.ts — canonical phase names for the Jingu cognition system.
 *
 * This is the single source of truth for phase name strings.
 * All consumers MUST import Phase / ALL_PHASES / assertPhase from here.
 * No aliases, no normalization — non-canonical input throws TypeError.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ALL_PHASES = void 0;
exports.assertPhase = assertPhase;
exports.ALL_PHASES = [
    "UNDERSTAND",
    "OBSERVE",
    "ANALYZE",
    "DECIDE",
    "DESIGN",
    "EXECUTE",
    "JUDGE",
];
/**
 * Assert that a string is a valid Phase.
 * Throws TypeError on non-canonical input — no alias resolution, no case coercion.
 */
function assertPhase(value) {
    if (!exports.ALL_PHASES.includes(value)) {
        throw new TypeError(`Invalid Phase: "${value}". Must be one of: ${exports.ALL_PHASES.join(", ")}`);
    }
}
//# sourceMappingURL=phase.js.map