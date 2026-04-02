/**
 * Control loop data exchange types.
 *
 * These are the cross-repo protocol types for failure signals, execution
 * feedback, and retry plans. Semantic definitions live in:
 *   jingu-policy-core/src/principles/CONTROL_LOOP_PRINCIPLES.md
 *
 * Shape is defined here. Meaning is defined there. Never duplicate.
 */

// ── FailureSignal ─────────────────────────────────────────────────────────────

export type FailureType =
  | "test_failure"
  | "apply_failure"
  | "parse_failure"
  | "no_output"
  | "exploration_loop"   // many reads, no writes, no patch
  | "wrong_direction"    // patch growing + same file + test still failing
  | "environment_failure"
  | "unknown";

export interface FailureSignal {
  type: FailureType;
  /** Names of FAIL_TO_PASS tests that failed. Empty if unknown. */
  failing_tests: string[];
  failure_count: number;
  error_count: number;
  /** Last ~1500 chars of test output. Compressed signal, not raw dump. */
  excerpt: string;
}

// ── PatchFingerprint ──────────────────────────────────────────────────────────

export interface PatchFingerprint {
  files: string[];
  hunks: number;
  lines_added: number;
  lines_removed: number;
}

// ── ExecutionFeedback ─────────────────────────────────────────────────────────

/**
 * Structured output of build_execution_feedback().
 * Captures what happened in attempt N for use in attempt N+1.
 *
 * EFR invariant: if tests_ran=true, failure_signal must be non-null.
 */
export interface ExecutionFeedback {
  tests_ran: boolean;
  failure_signal: FailureSignal | null;
  patch_fingerprint: PatchFingerprint;
}

// ── RetryPlan ─────────────────────────────────────────────────────────────────

/**
 * LLM-generated strategy for attempt N+1.
 * Built on top of ExecutionFeedback (Phase 2A) by retry-controller (Phase 2B).
 *
 * NBR invariant: next_attempt_prompt must not be empty when execution ran.
 */
export interface RetryPlan {
  /** What went wrong in the previous attempt. Must reference concrete observables. */
  root_causes: string[];
  /** What attempt N+1 must do. Concrete, actionable. */
  must_do: string[];
  /** What attempt N+1 must not repeat. */
  must_not_do: string[];
  /** How to validate the fix before submitting. */
  validation_requirement: string;
  /** The actual hint injected into attempt N+1's prompt. */
  next_attempt_prompt: string;
}
