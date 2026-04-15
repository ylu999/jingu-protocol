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
export type Principal = "ontology_alignment" | "phase_boundary_discipline" | "evidence_completeness" | "causal_grounding" | "evidence_linkage" | "alternative_hypothesis_check" | "uncertainty_honesty" | "option_comparison" | "constraint_satisfaction" | "invariant_preservation" | "scope_minimality" | "action_grounding" | "minimal_change" | "result_verification" | "residual_risk_detection";
export declare const ALL_PRINCIPALS: readonly Principal[];
/**
 * Assert that a string is a valid Principal.
 * Throws TypeError on non-canonical input — no alias resolution, no case coercion.
 */
export declare function assertPrincipal(value: string): asserts value is Principal;
//# sourceMappingURL=principal.d.ts.map