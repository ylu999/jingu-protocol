"use strict";
// src/rpp/rpp.validate.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRPP = validateRPP;
const rpp_failures_js_1 = require("./rpp.failures.js");
const REQUIRED_STAGES = [
    "interpretation",
    "reasoning",
    "decision",
    "action",
];
const RULE_METHOD_ID_PATTERN = /^[A-Z]+-\d+$/;
const CERTAINTY_WORDS = [
    "is definitely",
    "always",
    "never",
    "must be",
    "certainly",
];
function validateReference(ref, stage) {
    if (ref.type === "rule") {
        if (!RULE_METHOD_ID_PATTERN.test(ref.rule_id)) {
            return {
                code: "INVALID_REFERENCE",
                stage,
                detail: `RuleRef has invalid rule_id: "${ref.rule_id}". Must match /^[A-Z]+-\\d+$/.`,
            };
        }
    }
    else if (ref.type === "method") {
        if (!RULE_METHOD_ID_PATTERN.test(ref.method_id)) {
            return {
                code: "INVALID_REFERENCE",
                stage,
                detail: `MethodRef has invalid method_id: "${ref.method_id}". Must match /^[A-Z]+-\\d+$/.`,
            };
        }
    }
    else if (ref.type === "evidence") {
        if (!ref.source || typeof ref.source !== "string" || ref.source.trim() === "") {
            return {
                code: "INVALID_REFERENCE",
                stage,
                detail: `EvidenceRef has empty or missing 'source' field.`,
            };
        }
        if (!ref.locator || typeof ref.locator !== "string" || ref.locator.trim() === "") {
            return {
                code: "INVALID_REFERENCE",
                stage,
                detail: `EvidenceRef has empty or missing 'locator' field.`,
            };
        }
    }
    // derived refs: no structural fields beyond 'supports' — validated by SUPPORTS_EMPTY below
    return null;
}
function validateRPP(record, policy) {
    const allIssues = [];
    // --- Check 1: MISSING_STAGE ---
    const presentStages = new Set(record.steps.map((s) => s.stage));
    for (const required of REQUIRED_STAGES) {
        if (!presentStages.has(required)) {
            allIssues.push({
                code: "MISSING_STAGE",
                stage: required,
                detail: `Required stage "${required}" is missing from the RPP record.`,
            });
        }
    }
    // For checks 2–5, iterate over present steps only
    for (const step of record.steps) {
        const stage = step.stage;
        // --- Check 2: EMPTY_CONTENT ---
        if (!step.content || step.content.length < 1) {
            allIssues.push({
                code: "EMPTY_CONTENT",
                stage,
                detail: `Stage "${stage}" has empty content array.`,
            });
        }
        // --- Check 3: NO_REFERENCES ---
        if (!step.references || step.references.length < 1) {
            allIssues.push({
                code: "NO_REFERENCES",
                stage,
                detail: `Stage "${stage}" has no references.`,
            });
        }
        // --- Check 4: SUPPORTS_TOO_VAGUE (warning) ---
        // A supports field shorter than 8 chars is a heuristic filter: statistically,
        // fewer than 8 chars cannot carry a meaningful claim description.
        // Empty and whitespace-only are the most severe case; short-but-non-empty is also flagged.
        const SUPPORTS_MIN_LENGTH = 8;
        for (const ref of step.references ?? []) {
            const text = ref.supports?.trim() ?? "";
            if (text.length < SUPPORTS_MIN_LENGTH) {
                allIssues.push({
                    code: "SUPPORTS_TOO_VAGUE",
                    stage,
                    detail: `Reference in stage "${stage}" has a 'supports' field that is too short (${text.length} chars, minimum ${SUPPORTS_MIN_LENGTH}). State what specific claim this reference supports.`,
                });
            }
        }
        // --- Check 5: INVALID_REFERENCE ---
        for (const ref of step.references ?? []) {
            const failure = validateReference(ref, stage);
            if (failure) {
                allIssues.push(failure);
            }
        }
        // --- Check 10: STEP_DERIVED_REF_FORBIDDEN ---
        for (const ref of step.references ?? []) {
            if (ref.type === "derived") {
                allIssues.push({
                    code: "STEP_DERIVED_REF_FORBIDDEN",
                    stage,
                    detail: `Stage "${stage}" contains a reference of type "derived". DerivedRef is only valid in response.references. Use evidence, rule, or method references within steps.`,
                });
            }
        }
    }
    // --- Check 6a: ACTION_NO_EVIDENCE ---
    // The action stage must have at least one evidence reference.
    // A rule or method justifies *why* an action is taken; evidence grounds *what*
    // observable reality it acts on. Without evidence, action is unjustified in fact.
    const actionStep = record.steps.find((s) => s.stage === "action");
    if (actionStep) {
        const hasEvidence = (actionStep.references ?? []).some((r) => r.type === "evidence");
        if (!hasEvidence) {
            allIssues.push({
                code: "ACTION_NO_EVIDENCE",
                stage: "action",
                detail: `Action stage has no evidence reference. Actions must be grounded in observable reality (file, tool_result, log, etc.) — a rule or method alone does not suffice.`,
            });
        }
    }
    // --- Check 6: UNJUSTIFIED_DECISION ---
    const decisionStep = record.steps.find((s) => s.stage === "decision");
    if (decisionStep) {
        const hasRuleOrMethod = decisionStep.references.some((ref) => ref.type === "rule" || ref.type === "method");
        if (!hasRuleOrMethod) {
            allIssues.push({
                code: "UNJUSTIFIED_DECISION",
                stage: "decision",
                detail: `Decision stage has no rule or method reference to justify the decision.`,
            });
        }
    }
    // --- Check 7: INFERENCE_AS_FACT (warning) ---
    const reasoningStep = record.steps.find((s) => s.stage === "reasoning");
    if (reasoningStep) {
        const hasEvidenceRef = reasoningStep.references.some((ref) => ref.type === "evidence");
        if (!hasEvidenceRef) {
            for (const contentItem of reasoningStep.content ?? []) {
                const lower = contentItem.toLowerCase();
                const hasCertaintyWord = CERTAINTY_WORDS.some((word) => lower.includes(word));
                if (hasCertaintyWord) {
                    allIssues.push({
                        code: "INFERENCE_AS_FACT",
                        stage: "reasoning",
                        detail: `Reasoning stage content uses certainty language ("${CERTAINTY_WORDS.find((w) => lower.includes(w))}") without any evidence reference: "${contentItem.slice(0, 80)}${contentItem.length > 80 ? "..." : ""}"`,
                    });
                }
            }
        }
    }
    // --- Check 8: UNTRACEABLE_RESPONSE ---
    // Structural check: response must contain at least one DerivedRef.
    // DerivedRef is the provenance graph edge: response → step(s) → references.
    if (record.response.references.length === 0) {
        allIssues.push({
            code: "UNTRACEABLE_RESPONSE",
            stage: "response",
            detail: `Response has no references. Add at least one { type: "derived", from_steps: [...], supports: "..." } to establish the provenance chain.`,
        });
    }
    else {
        const hasDerived = record.response.references.some((ref) => ref.type === "derived");
        if (!hasDerived) {
            allIssues.push({
                code: "UNTRACEABLE_RESPONSE",
                stage: "response",
                detail: `Response references contain no "derived" type. Add { type: "derived", from_steps: [...], supports: "..." } to link the response to the prior reasoning steps.`,
            });
        }
    }
    // --- Check 9: DANGLING_PROVENANCE_LINK ---
    // When a DerivedRef lists from_steps, each listed step id must exist in the
    // record and that step must have at least one reference (otherwise the chain
    // terminates in a step with no evidence, which is not a valid provenance node).
    //
    // Backward compat: if all steps lack ids, from_steps cannot be validated and
    // this check is skipped. Verification only fires when step ids are present.
    const stepById = new Map();
    for (const step of record.steps) {
        if (step.id)
            stepById.set(step.id, step);
    }
    // --- Check 8b: RESPONSE_MISSING_GROUNDED_STEP ---
    // When step ids are present, the response derived ref must include at least
    // one step that is a decision or action stage. Tracing only to interpretation
    // or reasoning means the response is grounded in "I thought about it" but not
    // in "I decided" or "I acted" — which is insufficient for an action-authorizing response.
    //
    // Only enforced when step ids exist (backward compat) and a derived ref is present.
    const requiredStages = policy?.response_must_reference_stages ?? ["decision", "action"];
    if (stepById.size > 0) {
        for (const ref of record.response.references) {
            if (ref.type !== "derived" || ref.from_steps.length === 0)
                continue;
            const hasRequiredStage = ref.from_steps.some((id) => {
                const s = stepById.get(id);
                return s !== undefined && requiredStages.includes(s.stage);
            });
            if (!hasRequiredStage) {
                allIssues.push({
                    code: "RESPONSE_MISSING_GROUNDED_STEP",
                    stage: "response",
                    detail: `Response DerivedRef.from_steps [${ref.from_steps.join(", ")}] does not include a step with stage in [${requiredStages.join(", ")}]. The response must trace to one of these stages.`,
                });
            }
        }
    }
    for (const ref of record.response.references) {
        if (ref.type !== "derived")
            continue;
        // --- Check 9a: EMPTY_PROVENANCE_LINK ---
        // from_steps must name at least one step. An empty array is a self-claim:
        // it declares derivation but points to nothing — equivalent to no chain at all.
        if (ref.from_steps.length === 0) {
            allIssues.push({
                code: "EMPTY_PROVENANCE_LINK",
                stage: "response",
                detail: `DerivedRef.from_steps is empty. List at least one step id that this response derives from.`,
            });
            continue;
        }
        // --- Check 9b: DANGLING_PROVENANCE_LINK ---
        // When step ids are present in the record, each from_steps entry must:
        //   (1) resolve to an existing step
        //   (2) that step must have at least one non-derived reference
        //       (evidence / rule / method) — otherwise the chain terminates in
        //       another floating declaration, not in actual grounding.
        //
        // Backward compat: if no steps have ids, skip resolution check.
        if (stepById.size > 0) {
            for (const stepId of ref.from_steps) {
                const target = stepById.get(stepId);
                if (!target) {
                    allIssues.push({
                        code: "DANGLING_PROVENANCE_LINK",
                        stage: "response",
                        detail: `DerivedRef.from_steps references step id "${stepId}" which does not exist in this RPP record.`,
                    });
                }
                else {
                    const hasGroundedRef = (target.references ?? []).some((r) => r.type === "evidence" || r.type === "rule" || r.type === "method");
                    if (!hasGroundedRef) {
                        allIssues.push({
                            code: "DANGLING_PROVENANCE_LINK",
                            stage: "response",
                            detail: `DerivedRef.from_steps references step "${stepId}" (stage: "${target.stage}") which has no evidence/rule/method references — the provenance chain terminates in an ungrounded step.`,
                        });
                    }
                }
            }
        }
    }
    // --- Policy checks (only when policy is provided) ---
    if (policy) {
        // UNKNOWN_RULE_ID: rule_id must be in allowed_rule_ids
        if (policy.allowed_rule_ids && policy.allowed_rule_ids.length > 0) {
            for (const step of record.steps) {
                for (const ref of step.references ?? []) {
                    if (ref.type === "rule" && !policy.allowed_rule_ids.includes(ref.rule_id)) {
                        allIssues.push({
                            code: "UNKNOWN_RULE_ID",
                            stage: step.stage,
                            detail: `rule_id "${ref.rule_id}" is not in the project's allowed_rule_ids list: [${policy.allowed_rule_ids.join(", ")}].`,
                        });
                    }
                }
            }
        }
        // UNKNOWN_METHOD_ID: method_id must be in allowed_method_ids
        if (policy.allowed_method_ids && policy.allowed_method_ids.length > 0) {
            for (const step of record.steps) {
                for (const ref of step.references ?? []) {
                    if (ref.type === "method" && !policy.allowed_method_ids.includes(ref.method_id)) {
                        allIssues.push({
                            code: "UNKNOWN_METHOD_ID",
                            stage: step.stage,
                            detail: `method_id "${ref.method_id}" is not in the project's allowed_method_ids list: [${policy.allowed_method_ids.join(", ")}].`,
                        });
                    }
                }
            }
        }
        // DISALLOWED_EVIDENCE_SOURCE: action step evidence sources must be in action_evidence_sources
        if (policy.action_evidence_sources && policy.action_evidence_sources.length > 0) {
            const actionStep = record.steps.find((s) => s.stage === "action");
            if (actionStep) {
                for (const ref of actionStep.references ?? []) {
                    if (ref.type === "evidence" && !policy.action_evidence_sources.includes(ref.source)) {
                        allIssues.push({
                            code: "DISALLOWED_EVIDENCE_SOURCE",
                            stage: "action",
                            detail: `Evidence source "${ref.source}" in action stage is not in the project's allowed action_evidence_sources list: [${policy.action_evidence_sources.join(", ")}].`,
                        });
                    }
                }
            }
        }
    }
    // --- Compute overall_status ---
    // severity_overrides can promote soft failures to hard or demote hard failures to soft.
    const overrides = policy?.severity_overrides ?? {};
    const isEffectivelyHard = (code) => {
        if (code in overrides)
            return overrides[code] === "hard";
        return (0, rpp_failures_js_1.isHardFailure)(code);
    };
    const failures = allIssues.filter((issue) => isEffectivelyHard(issue.code));
    const warnings = allIssues.filter((issue) => !isEffectivelyHard(issue.code));
    let overall_status;
    if (failures.length > 0) {
        overall_status = "invalid";
    }
    else if (warnings.length > 0) {
        overall_status = "weakly_supported";
    }
    else {
        overall_status = "valid";
    }
    return { overall_status, failures, warnings };
}
//# sourceMappingURL=rpp.validate.js.map