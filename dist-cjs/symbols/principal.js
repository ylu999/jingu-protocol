"use strict";
/**
 * principal.ts — canonical principal names for the Jingu cognition system.
 *
 * A principal is a behavioral commitment the agent makes for a phase output.
 * Names are lowercase_snake. No aliases allowed.
 *
 * NOTE: These are the cognition-layer principals (15 values).
 * CDP v1 PrincipalId (24 values, SCREAMING_SNAKE) in jingu-policy-core
 * is a separate taxonomy and is NOT defined here.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ALL_PRINCIPALS = void 0;
exports.assertPrincipal = assertPrincipal;
exports.ALL_PRINCIPALS = [
    "ontology_alignment",
    "phase_boundary_discipline",
    "evidence_completeness",
    "causal_grounding",
    "evidence_linkage",
    "alternative_hypothesis_check",
    "uncertainty_honesty",
    "option_comparison",
    "constraint_satisfaction",
    "invariant_preservation",
    "scope_minimality",
    "action_grounding",
    "minimal_change",
    "result_verification",
    "residual_risk_detection",
];
/**
 * Assert that a string is a valid Principal.
 * Throws TypeError on non-canonical input — no alias resolution, no case coercion.
 */
function assertPrincipal(value) {
    if (!exports.ALL_PRINCIPALS.includes(value)) {
        throw new TypeError(`Invalid Principal: "${value}". Must be one of: ${exports.ALL_PRINCIPALS.join(", ")}`);
    }
}
//# sourceMappingURL=principal.js.map