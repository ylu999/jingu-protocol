/**
 * verdict.ts — canonical verdict values for the Jingu admission gate.
 *
 * A verdict is the gate's final decision on whether a phase output is admitted.
 * No aliases allowed — non-canonical input throws TypeError.
 */

export type Verdict = "ADMITTED" | "RETRYABLE" | "REJECTED";

export const ALL_VERDICTS: readonly Verdict[] = [
  "ADMITTED",
  "RETRYABLE",
  "REJECTED",
] as const;

/**
 * Assert that a string is a valid Verdict.
 * Throws TypeError on non-canonical input — no alias resolution, no case coercion.
 */
export function assertVerdict(value: string): asserts value is Verdict {
  if (!ALL_VERDICTS.includes(value as Verdict)) {
    throw new TypeError(
      `Invalid Verdict: "${value}". Must be one of: ${ALL_VERDICTS.join(", ")}`,
    );
  }
}
