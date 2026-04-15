"use strict";
/**
 * verdict.ts — canonical verdict values for the Jingu admission gate.
 *
 * A verdict is the gate's final decision on whether a phase output is admitted.
 * No aliases allowed — non-canonical input throws TypeError.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ALL_VERDICTS = void 0;
exports.assertVerdict = assertVerdict;
exports.ALL_VERDICTS = [
    "ADMITTED",
    "RETRYABLE",
    "REJECTED",
];
/**
 * Assert that a string is a valid Verdict.
 * Throws TypeError on non-canonical input — no alias resolution, no case coercion.
 */
function assertVerdict(value) {
    if (!exports.ALL_VERDICTS.includes(value)) {
        throw new TypeError(`Invalid Verdict: "${value}". Must be one of: ${exports.ALL_VERDICTS.join(", ")}`);
    }
}
//# sourceMappingURL=verdict.js.map