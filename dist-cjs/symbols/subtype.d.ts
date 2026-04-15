/**
 * subtype.ts — canonical subtype names for the Jingu cognition system.
 *
 * A subtype is a specific kind of output within a phase.
 * Format: "<phase_slug>.<output_kind>"
 *
 * No aliases allowed — non-canonical input throws TypeError.
 */
export type Subtype = "observation.fact_gathering" | "analysis.root_cause" | "decision.fix_direction" | "design.solution_shape" | "execution.code_patch" | "judge.verification";
export declare const ALL_SUBTYPES: readonly Subtype[];
/**
 * Assert that a string is a valid Subtype.
 * Throws TypeError on non-canonical input — no alias resolution, no case coercion.
 */
export declare function assertSubtype(value: string): asserts value is Subtype;
//# sourceMappingURL=subtype.d.ts.map