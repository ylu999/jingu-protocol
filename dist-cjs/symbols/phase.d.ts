/**
 * phase.ts — canonical phase names for the Jingu cognition system.
 *
 * This is the single source of truth for phase name strings.
 * All consumers MUST import Phase / ALL_PHASES / assertPhase from here.
 * No aliases, no normalization — non-canonical input throws TypeError.
 */
export type Phase = "UNDERSTAND" | "OBSERVE" | "ANALYZE" | "DECIDE" | "DESIGN" | "EXECUTE" | "JUDGE";
export declare const ALL_PHASES: readonly Phase[];
/**
 * Assert that a string is a valid Phase.
 * Throws TypeError on non-canonical input — no alias resolution, no case coercion.
 */
export declare function assertPhase(value: string): asserts value is Phase;
//# sourceMappingURL=phase.d.ts.map