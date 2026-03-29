// src/rpp/rpp.types.ts

export type EvidenceRef = {
  type: "evidence"
  source: string
  locator: string
  supports: string
}

export type RuleRef = {
  type: "rule"
  rule_id: string
  supports: string
}

export type MethodRef = {
  type: "method"
  method_id: string
  supports: string
}

/**
 * DerivedRef: structural claim that this content is derived from specific
 * prior steps in the same RPP record. `from_steps` must list the step ids
 * of the steps this content is derived from — the gate validates that every
 * listed id exists in record.steps and that those steps have references.
 *
 * This replaces fragile keyword matching with a machine-checkable provenance
 * graph edge: response → step(s) → references → evidence/rule/method.
 */
export type DerivedRef = {
  type: "derived"
  from_steps: string[]
  supports: string
}

export type Reference = EvidenceRef | RuleRef | MethodRef | DerivedRef

export type CognitiveStep = {
  id?: string   // optional step identifier — required to be referenced by DerivedRef.from_steps
  stage: "interpretation" | "reasoning" | "decision" | "action"
  content: string[]
  references: Reference[]
  method_refs?: MethodRef[]
  uncertainties?: string[]
}

export type ResponseStep = {
  content: string[]
  references: Reference[]
}

export type RPPRecord = {
  call_id: string
  session_id?: string
  call_sequence?: number
  steps: CognitiveStep[]
  response: ResponseStep
}

export type RPPFailureCode =
  | "MISSING_STAGE"
  | "EMPTY_CONTENT"
  | "NO_REFERENCES"
  | "UNSUPPORTED_CLAIM"
  | "INFERENCE_AS_FACT"
  | "UNTRACEABLE_RESPONSE"
  | "UNJUSTIFIED_DECISION"
  | "ACTION_SCOPE_VIOLATION"
  | "METHOD_NOT_ACTUALLY_USED"
  | "INVALID_REFERENCE"
  | "SUPPORTS_TOO_VAGUE"
  | "CIRCULAR_REFERENCE"
  | "DANGLING_PROVENANCE_LINK"
  | "EMPTY_PROVENANCE_LINK"
  | "ACTION_NO_EVIDENCE"
  | "RESPONSE_MISSING_GROUNDED_STEP"
  | "STEP_DERIVED_REF_FORBIDDEN"
  | "UNKNOWN_RULE_ID"
  | "UNKNOWN_METHOD_ID"
  | "DISALLOWED_EVIDENCE_SOURCE"

export type RPPFailure = {
  code: RPPFailureCode
  stage?: CognitiveStep["stage"] | "response"
  detail: string
}

export type RPPValidationResult = {
  overall_status: "valid" | "weakly_supported" | "invalid"
  failures: RPPFailure[]
  warnings: RPPFailure[]
}

/**
 * RPPPolicy: project-level policy configuration for validateRPP.
 * All fields are optional. When no policy is provided, validateRPP behaves
 * identically to the no-policy baseline.
 */
export type RPPPolicy = {
  /** If specified, every rule_id in any RuleRef must appear in this list (UNKNOWN_RULE_ID). */
  allowed_rule_ids?: string[]
  /** If specified, every method_id in any MethodRef must appear in this list (UNKNOWN_METHOD_ID). */
  allowed_method_ids?: string[]
  /** Override the default hard/soft severity for specific failure codes. */
  severity_overrides?: Partial<Record<RPPFailureCode, "hard" | "soft">>
  /** If specified, every evidence source in action-stage EvidenceRefs must appear in this list (DISALLOWED_EVIDENCE_SOURCE). */
  action_evidence_sources?: string[]
  /**
   * Stages that the response DerivedRef must include at least one of.
   * Defaults to ["decision", "action"] when not specified.
   */
  response_must_reference_stages?: Array<"interpretation" | "reasoning" | "decision" | "action">
}
