"use strict";
/**
 * subtype.ts — canonical subtype names for the Jingu cognition system.
 *
 * A subtype is a specific kind of output within a phase.
 * Format: "<phase_slug>.<output_kind>"
 *
 * No aliases allowed — non-canonical input throws TypeError.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ALL_SUBTYPES = void 0;
exports.assertSubtype = assertSubtype;
exports.ALL_SUBTYPES = [
    "observation.fact_gathering",
    "analysis.root_cause",
    "decision.fix_direction",
    "design.solution_shape",
    "execution.code_patch",
    "judge.verification",
];
/**
 * Assert that a string is a valid Subtype.
 * Throws TypeError on non-canonical input — no alias resolution, no case coercion.
 */
function assertSubtype(value) {
    if (!exports.ALL_SUBTYPES.includes(value)) {
        throw new TypeError(`Invalid Subtype: "${value}". Must be one of: ${exports.ALL_SUBTYPES.join(", ")}`);
    }
}
//# sourceMappingURL=subtype.js.map