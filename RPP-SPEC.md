# RPP Formal Specification

**Reasoning Provenance Protocol — Invariant System v1**

---

## Abstract

The Reasoning Provenance Protocol (RPP) is a structural contract that requires every LLM response preceding a tool call to carry a machine-verifiable provenance record. Each record declares the cognitive stages that produced the response, the references that ground those stages, and explicit derivation links from the response back to those stages. RPP does not evaluate whether reasoning is *sound* — it enforces that reasoning is *traceable*. The distinction matters: prompt engineering and guardrails attempt to improve output quality through natural language instructions; RPP enforces a graph structure that makes the output's lineage checkable by a deterministic validator, independent of language, phrasing, or model behavior.

---

## Core Definitions

**RPPRecord**

    R = (call_id, Steps, Response)

    call_id  : string               -- unique identifier for this call
    Steps    : CognitiveStep[]      -- ordered list of cognitive steps
    Response : ResponseStep         -- the output step

**CognitiveStep**

    s = (id, stage, content, references)

    id         : string?            -- optional; required when referenced by DerivedRef.from_steps
    stage      : Stage
    content    : string[]           -- one or more content claims
    references : Reference[]        -- one or more references grounding the content

**Stage**

    Stage in {interpretation, reasoning, decision, action}

All four stages must be present in every RPPRecord (see I-1).

**Reference**

    Reference r in EvidenceRef | RuleRef | MethodRef | DerivedRef

    EvidenceRef  = { type: "evidence",  source: string, locator: string, supports: string }
    RuleRef      = { type: "rule",      rule_id: string,                 supports: string }
    MethodRef    = { type: "method",    method_id: string,               supports: string }
    DerivedRef   = { type: "derived",   from_steps: string[],            supports: string }

    rule_id and method_id must match: /^[A-Z]+-[0-9]+$/
    source and locator in EvidenceRef must be non-empty strings

**Grounded(s)**

A step s is *grounded* if it has at least one reference of type evidence, rule, or method:

    Grounded(s) = exists r in s.references such that r.type in {evidence, rule, method}

A step with only DerivedRef references is not grounded.

**ProvenanceGraph G(R)**

    G(R) = directed graph where:
      nodes = { s.id | s in R.Steps, s.id is defined }
              union { "response" }
      edges = { (response, s.id) | DerivedRef d in R.Response.references,
                                    s.id in d.from_steps }

G(R) is required to be acyclic (no step may reference itself or form a cycle through from_steps). By convention, from_steps may only reference steps that appear earlier in the Steps array.

---

## Invariant Set

Each invariant is enforced by the validator in `src/rpp/rpp.validate.ts`. Hard invariants block execution; soft invariants produce warnings.

---

    I-1: Stage Completeness
    Formal:   {interpretation, reasoning, decision, action} ⊆ { s.stage | s in R.Steps }
    Violation: MISSING_STAGE
    Severity:  hard
    Counter-example: An RPP record with interpretation + decision but no reasoning stage is
                     rejected. The omitted stage cannot be inferred from the others.

---

    I-2: Content Non-emptiness
    Formal:   for all s in R.Steps: |s.content| >= 1
    Violation: EMPTY_CONTENT
    Severity:  hard
    Counter-example: A decision step with content: [] declares a decision but states nothing
                     about what was decided. The validator rejects it.

---

    I-3: Reference Existence
    Formal:   for all s in R.Steps: |s.references| >= 1
    Violation: NO_REFERENCES
    Severity:  hard
    Counter-example: A reasoning step with no references makes claims that cannot be traced
                     to any source. Rejected even if content is non-empty.

---

    I-4: Decision Justification
    Formal:   exists r in decision_step.references such that r.type in {rule, method}
    Violation: UNJUSTIFIED_DECISION
    Severity:  hard
    Counter-example: A decision step whose references are all EvidenceRef entries is rejected.
                     Evidence alone shows *what* was observed; a rule or method is required
                     to justify *why* this specific decision follows from that evidence.

---

    I-5: Action Grounding
    Formal:   exists r in action_step.references such that r.type = "evidence"
    Violation: ACTION_NO_EVIDENCE
    Severity:  hard
    Counter-example: An action step citing only { type: "rule", rule_id: "RUL-002" } is
                     rejected. Rules authorize action categories; evidence grounds the
                     specific observable reality being acted on (which file, which result,
                     which artifact). Rule or method alone is not sufficient.

---

    I-6: Response Traceability
    Formal:   exists r in R.Response.references such that r.type = "derived"
    Violation: UNTRACEABLE_RESPONSE
    Severity:  hard
    Counter-example: A response whose references contain only EvidenceRef entries — even
                     valid ones — is rejected. EvidenceRef in the response shows what the
                     response is about; a DerivedRef is required to assert that the response
                     *follows from* the prior reasoning chain.

---

    I-7: Provenance Non-emptiness
    Formal:   for all r in R.Response.references where r.type = "derived":
                |r.from_steps| >= 1
    Violation: EMPTY_PROVENANCE_LINK
    Severity:  hard
    Counter-example: { type: "derived", from_steps: [], supports: "..." } declares derivation
                     but names no source. This is structurally equivalent to having no derived
                     ref at all. Rejected.

---

    I-8: Provenance Validity
    Formal:   for all r in R.Response.references where r.type = "derived":
                for all id in r.from_steps:
                  exists s in R.Steps such that s.id = id
    Violation: DANGLING_PROVENANCE_LINK
    Severity:  hard
    Counter-example: from_steps: ["s-decision"] when no step has id "s-decision". The
                     provenance edge points into a void. Rejected when step ids are present
                     in the record.

---

    I-9: Provenance Grounding
    Formal:   for all r in R.Response.references where r.type = "derived":
                for all id in r.from_steps:
                  let s = step with s.id = id
                  Grounded(s)   -- i.e., s has at least one evidence/rule/method ref
    Violation: DANGLING_PROVENANCE_LINK
    Severity:  hard
    Counter-example: from_steps: ["s-reasoning"] where s-reasoning has only DerivedRef
                     references. The chain terminates in a floating declaration, not in
                     actual grounding. Rejected.

    Note: I-8 and I-9 share the DANGLING_PROVENANCE_LINK failure code but represent
    distinct failure sub-cases: I-8 is a missing node; I-9 is an ungrounded node.

---

    I-10: Response Commitment
    Formal:   exists r in R.Response.references where r.type = "derived":
                exists id in r.from_steps:
                  let s = step with s.id = id
                  s.stage in {decision, action}
    Violation: RESPONSE_MISSING_GROUNDED_STEP
    Severity:  hard
    Counter-example: from_steps: ["s-interpretation", "s-reasoning"] only. Interpretation
                     establishes context; reasoning produces analysis. Neither represents a
                     concluded decision or a concrete action. A response that derives only
                     from these stages has not committed to anything. Rejected.

---

## Provenance Graph Properties

### DAG Property

The provenance graph G(R) must be acyclic. `from_steps` may only reference steps that appear earlier in the `Steps` array. A step referencing itself or forming a cycle through other steps violates this property.

### Termination Invariant

All paths in G(R) must terminate in a node s where Grounded(s). A path that terminates in an ungrounded step (one whose references are only DerivedRef) does not provide traceable evidence — it is an infinitely regressing chain of assertions.

### Completeness

The response node must be connected to at least one node s where s.stage in {decision, action}. Connecting only to interpretation or reasoning is insufficient — those stages produce context and analysis, not conclusions or actions.

### Valid vs Invalid Graph Shapes

**Valid: response traces to grounded decision and action**

    [interpretation]---(evidence)--> [grounded]
          |
    [reasoning]-------(method)-----> [grounded]
          |
    [decision]--------(rule)-------> [grounded]  <---+
          |                                           |
    [action]----------(evidence)---> [grounded]  <---+
                                                      |
    [response] -----(derived: from_steps=[s-decision, s-action])--+

    All paths from response terminate in grounded nodes. VALID.

---

**Invalid: empty from_steps (I-7)**

    [response] -----(derived: from_steps=[])

    Edge declared but points to nothing. DANGLING. Blocked by I-7.

---

**Invalid: from_steps references non-existent step id (I-8)**

    [response] -----(derived: from_steps=["s-xyz"])

    No step has id "s-xyz". Edge target does not exist. Blocked by I-8.

---

**Invalid: from_steps references ungrounded step (I-9)**

    [some-step] --- only DerivedRef refs (no evidence/rule/method)

    [response] -----(derived: from_steps=["some-step"])

    Chain terminates in an ungrounded node. Blocked by I-9.

---

**Invalid: response traces only to interpretation/reasoning (I-10)**

    [interpretation] --- (evidence) --> [grounded]
    [reasoning]      --- (method)  --> [grounded]

    [response] -----(derived: from_steps=["s-interpretation", "s-reasoning"])

    No decision or action step in from_steps. Response has context and analysis
    but no commitment. Blocked by I-10.

---

**Invalid: no derived ref in response (I-6)**

    [decision] --- (rule) --> [grounded]
    [action]   --- (evidence) --> [grounded]

    [response] -----(evidence: source="file", locator="foo.ts")

    Response references observable reality but declares no derivation from the
    reasoning chain. Blocked by I-6.

---

## What This System Does NOT Claim

**RPP does not verify semantic correctness.**
Whether the content of a reasoning step is factually accurate is outside the scope of this protocol. A step can be structurally valid and factually wrong.

**RPP does not judge whether reasoning is sound.**
The validator checks that a decision step has a rule or method reference. It does not check whether the rule or method is actually applicable to the situation.

**RPP does not detect hallucination in content.**
Content claims are string values. The protocol enforces that they are non-empty and that the step has references, but it does not parse the content for false statements.

**This is intentional.**
Semantic correctness requires judgment. The goal of RPP is deterministic, language-independent structural enforcement. A validator that can be run identically on every RPP record without any model-in-the-loop is more reliable as a gate than a validator that attempts to assess reasoning quality. RPP makes provenance *checkable*; soundness remains the responsibility of the author.

---

## Comparison Table

| Property                    | String heuristics          | RPP                        |
|-----------------------------|----------------------------|----------------------------|
| Language independence       | No                         | Yes                        |
| Machine verifiable          | No                         | Yes                        |
| Gameable                    | Yes (easy keyword stuffing)| Harder (structural graph)  |
| Deterministic               | Varies                     | Yes                        |
| Semantic correctness        | No                         | No (by design)             |
| Requires model cooperation  | Yes                        | Yes (author provides RPP)  |
| Failure codes               | None                       | 10 typed codes             |
| Enforcement point           | Prompt                     | Pre-tool-use hook          |

---

## Anti-pattern Registry

The following patterns are classified as forbidden for use as provenance mechanisms. They may co-exist with RPP in logging or monitoring contexts, but none of them may replace a structural RPP record as the basis for gate enforcement.

---

**AP-1: Keyword-match provenance**

Definition: Inferring that a response is grounded by scanning content for trigger words ("because", "therefore", "based on", "evidence shows").

Why forbidden: Keyword presence is independent of whether the reasoning chain is structurally connected. A response can contain all trigger words while having no evidence references and no derived link to any prior step. The gate would pass fabricated reasoning as long as it uses the right vocabulary.

---

**AP-2: ASCII-only traceability**

Definition: Treating the presence of formatted sections (e.g., a block labeled "Reasoning:" or "Decision:") as proof that the corresponding cognitive work was done.

Why forbidden: Section labels are prose structure, not provenance structure. A "Decision:" heading with empty content, or content with no references, satisfies no invariant. The RPP validator rejects both. ASCII formatting is a display convention; structural validity requires typed fields.

---

**AP-3: Magic-number heuristics**

Definition: Using fixed thresholds on reference counts, step counts, or word counts to approximate provenance quality (e.g., "at least 2 references per step" or "reasoning must be at least 50 words").

Why forbidden: Invariant thresholds in RPP are derived from the *structural semantics* of each stage — a decision step needs a rule or method reference because that is what justifies a decision, not because 2 > 1. Numeric thresholds unmoored from semantic intent can be satisfied by padding. They also cannot distinguish between a one-word `supports` field that is precise and a 100-word `supports` field that is meaningless.

Note: the validator's `SUPPORTS_TOO_VAGUE` check explicitly validates only structural emptiness (empty string), not character count, precisely to avoid this anti-pattern.

---

**AP-4: Length-based pseudo-semantics**

Definition: Treating longer content as better-grounded content (e.g., "if content exceeds N characters, mark it as sufficiently detailed").

Why forbidden: Length is not a proxy for grounding. A short, precise evidence locator (`foo.ts:42`) is better grounding than a 200-word paraphrase of the same file with no locator. Length-based checks can be trivially satisfied by verbosity while missing every structural invariant.

---

**AP-5: Self-referential derived chains**

Definition: A DerivedRef whose from_steps points only to other steps that themselves have only DerivedRef references, creating a chain that never reaches a grounded node.

Why forbidden: This is the provenance equivalent of circular reasoning. Each step in the chain asserts that it derives from the previous one, but no step in the chain is grounded in evidence, rule, or method. Invariant I-9 (Provenance Grounding) blocks this: a from_steps target must satisfy Grounded(s), which requires at least one non-derived reference. A chain of pure DerivedRefs terminates in nothing.

---

*Spec derived from: `src/rpp/rpp.types.ts`, `src/rpp/rpp.validate.ts`, `src/rpp/rpp.failures.ts`*
