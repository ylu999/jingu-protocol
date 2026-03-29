// src/rpp/rpp.validate.ts

import { RPPRecord, RPPFailure, RPPValidationResult, CognitiveStep, Reference } from "./rpp.types.js"
import { isHardFailure } from "./rpp.failures.js"

const REQUIRED_STAGES: Array<CognitiveStep["stage"]> = [
  "interpretation",
  "reasoning",
  "decision",
  "action",
]

const RULE_METHOD_ID_PATTERN = /^[A-Z]+-\d+$/

const CERTAINTY_WORDS = [
  "is definitely",
  "always",
  "never",
  "must be",
  "certainly",
]

function validateReference(ref: Reference, stage: CognitiveStep["stage"] | "response"): RPPFailure | null {
  if (ref.type === "rule") {
    if (!RULE_METHOD_ID_PATTERN.test(ref.rule_id)) {
      return {
        code: "INVALID_REFERENCE",
        stage,
        detail: `RuleRef has invalid rule_id: "${ref.rule_id}". Must match /^[A-Z]+-\\d+$/.`,
      }
    }
  } else if (ref.type === "method") {
    if (!RULE_METHOD_ID_PATTERN.test(ref.method_id)) {
      return {
        code: "INVALID_REFERENCE",
        stage,
        detail: `MethodRef has invalid method_id: "${ref.method_id}". Must match /^[A-Z]+-\\d+$/.`,
      }
    }
  } else if (ref.type === "evidence") {
    if (!ref.source || typeof ref.source !== "string" || ref.source.trim() === "") {
      return {
        code: "INVALID_REFERENCE",
        stage,
        detail: `EvidenceRef has empty or missing 'source' field.`,
      }
    }
    if (!ref.locator || typeof ref.locator !== "string" || ref.locator.trim() === "") {
      return {
        code: "INVALID_REFERENCE",
        stage,
        detail: `EvidenceRef has empty or missing 'locator' field.`,
      }
    }
  }
  // derived refs: no structural fields beyond 'supports' — validated by SUPPORTS_EMPTY below
  return null
}

export function validateRPP(record: RPPRecord): RPPValidationResult {
  const allIssues: RPPFailure[] = []

  // --- Check 1: MISSING_STAGE ---
  const presentStages = new Set(record.steps.map((s) => s.stage))
  for (const required of REQUIRED_STAGES) {
    if (!presentStages.has(required)) {
      allIssues.push({
        code: "MISSING_STAGE",
        stage: required,
        detail: `Required stage "${required}" is missing from the RPP record.`,
      })
    }
  }

  // For checks 2–5, iterate over present steps only
  for (const step of record.steps) {
    const stage = step.stage

    // --- Check 2: EMPTY_CONTENT ---
    if (!step.content || step.content.length < 1) {
      allIssues.push({
        code: "EMPTY_CONTENT",
        stage,
        detail: `Stage "${stage}" has empty content array.`,
      })
    }

    // --- Check 3: NO_REFERENCES ---
    if (!step.references || step.references.length < 1) {
      allIssues.push({
        code: "NO_REFERENCES",
        stage,
        detail: `Stage "${stage}" has no references.`,
      })
    }

    // --- Check 4: SUPPORTS_TOO_VAGUE (warning) ---
    // Checks structural completeness: supports must be a non-empty string.
    // Does NOT check character count — length-based thresholds are string heuristics,
    // not semantic validation. A one-word supports field is valid; an empty one is not.
    for (const ref of step.references ?? []) {
      if (!ref.supports || ref.supports.trim() === "") {
        allIssues.push({
          code: "SUPPORTS_TOO_VAGUE",
          stage,
          detail: `Reference in stage "${stage}" has an empty 'supports' field. State what claim this reference supports.`,
        })
      }
    }

    // --- Check 5: INVALID_REFERENCE ---
    for (const ref of step.references ?? []) {
      const failure = validateReference(ref, stage)
      if (failure) {
        allIssues.push(failure)
      }
    }
  }

  // --- Check 6: UNJUSTIFIED_DECISION ---
  const decisionStep = record.steps.find((s) => s.stage === "decision")
  if (decisionStep) {
    const hasRuleOrMethod = decisionStep.references.some(
      (ref) => ref.type === "rule" || ref.type === "method"
    )
    if (!hasRuleOrMethod) {
      allIssues.push({
        code: "UNJUSTIFIED_DECISION",
        stage: "decision",
        detail: `Decision stage has no rule or method reference to justify the decision.`,
      })
    }
  }

  // --- Check 7: INFERENCE_AS_FACT (warning) ---
  const reasoningStep = record.steps.find((s) => s.stage === "reasoning")
  if (reasoningStep) {
    const hasEvidenceRef = reasoningStep.references.some((ref) => ref.type === "evidence")
    if (!hasEvidenceRef) {
      for (const contentItem of reasoningStep.content ?? []) {
        const lower = contentItem.toLowerCase()
        const hasCertaintyWord = CERTAINTY_WORDS.some((word) => lower.includes(word))
        if (hasCertaintyWord) {
          allIssues.push({
            code: "INFERENCE_AS_FACT",
            stage: "reasoning",
            detail: `Reasoning stage content uses certainty language ("${CERTAINTY_WORDS.find((w) => lower.includes(w))}") without any evidence reference: "${contentItem.slice(0, 80)}${contentItem.length > 80 ? "..." : ""}"`,
          })
        }
      }
    }
  }

  // --- Check 8: UNTRACEABLE_RESPONSE ---
  // Structural check: response must contain at least one reference of type "derived".
  // A DerivedRef is an explicit structural claim that the response follows from
  // the cognitive chain above — it is the machine-checkable link between response
  // and reasoning. This replaces the prior keyword-match heuristic which:
  //   (a) stripped all non-ASCII characters (breaking non-English content)
  //   (b) used a magic length threshold (>= 3 chars) with no semantic meaning
  //   (c) could be trivially gamed by repeating any word from a prior step
  if (record.response.references.length === 0) {
    allIssues.push({
      code: "UNTRACEABLE_RESPONSE",
      stage: "response",
      detail: `Response has no references. Add at least one { type: "derived", supports: "..." } reference to establish that the response follows from the cognitive chain.`,
    })
  } else {
    const hasDerived = record.response.references.some((ref) => ref.type === "derived")
    if (!hasDerived) {
      allIssues.push({
        code: "UNTRACEABLE_RESPONSE",
        stage: "response",
        detail: `Response references contain no "derived" type. Add at least one { type: "derived", supports: "..." } to structurally link the response to the prior reasoning steps.`,
      })
    }
  }

  // --- Compute overall_status ---
  const failures = allIssues.filter((issue) => isHardFailure(issue.code))
  const warnings = allIssues.filter((issue) => !isHardFailure(issue.code))

  let overall_status: RPPValidationResult["overall_status"]
  if (failures.length > 0) {
    overall_status = "invalid"
  } else if (warnings.length > 0) {
    overall_status = "weakly_supported"
  } else {
    overall_status = "valid"
  }

  return { overall_status, failures, warnings }
}
