# @jingu/protocol

Shared protocol types for the [Jingu](https://github.com/ylu999/jingu-core) system.

Contains the **Reasoning Provenance Protocol (RPP)** — a per-call cognitive audit contract that requires every AI reasoning step to be traceable to evidence, rules, or methods before any tool or action is allowed to execute.

```
Every claim an AI makes must be backed by a reference.
If you can't trace it, you can't trust it.
```

---

## What is RPP?

RPP is a structured audit record that an AI agent must produce alongside any action it takes. It enforces four cognitive stages before execution:

```
interpretation → reasoning → decision → action → response
```

Each stage must:
- Have non-empty content
- Cite at least one reference (evidence, rule, or method)
- The decision stage must cite a rule or method (not just evidence)
- The response content must be traceable to prior step content

A `pre_tool_use` hook validates the RPP block before any tool runs. Missing or invalid RPP blocks the execution.

---

## Install

```bash
npm install @jingu/protocol
```

---

## Quick start

```typescript
import { validateRPP } from "@jingu/protocol"
import type { RPPRecord } from "@jingu/protocol"

const record: RPPRecord = {
  call_id: "call-001",
  steps: [
    {
      stage: "interpretation",
      content: ["User wants to read file foo.ts"],
      references: [{ type: "evidence", source: "user_input", locator: "message.current", supports: "user asked to read foo.ts" }],
    },
    {
      stage: "reasoning",
      content: ["foo.ts likely contains the type definition we need"],
      references: [{ type: "method", method_id: "DBG-001", supports: "read before write — inspect file before modifying" }],
    },
    {
      stage: "decision",
      content: ["Read foo.ts to confirm type shape before editing"],
      references: [{ type: "rule", rule_id: "RUL-002", supports: "cite evidence for every claim before acting" }],
    },
    {
      stage: "action",
      content: ["Read foo.ts"],
      references: [{ type: "evidence", source: "file", locator: "src/foo.ts", supports: "target file for the read action" }],
    },
  ],
  response: {
    content: ["Read foo.ts to confirm type shape"],
    references: [{ type: "derived", supports: "action step states: read foo.ts" }],
  },
}

const result = validateRPP(record)
// result.overall_status: "valid" | "weakly_supported" | "invalid"
// result.failures: RPPFailure[]   — hard failures (block execution)
// result.warnings: RPPFailure[]   — soft failures (flagged but allowed)
```

---

## Validation rules

### Hard failures — block execution

| Code | What it catches |
|------|----------------|
| `MISSING_STAGE` | One of the 4 required stages (interpretation, reasoning, decision, action) is absent |
| `EMPTY_CONTENT` | A stage has no content entries |
| `NO_REFERENCES` | A stage has no references |
| `UNJUSTIFIED_DECISION` | Decision stage has only evidence refs — must have at least one rule or method |
| `UNTRACEABLE_RESPONSE` | Response content cannot be traced back to any prior step |
| `INVALID_REFERENCE` | A rule_id or method_id is malformed, or an evidence ref has empty source/locator |

### Soft failures — warnings only

| Code | What it catches |
|------|----------------|
| `SUPPORTS_TOO_VAGUE` | A reference's `supports` field is under 10 characters |
| `INFERENCE_AS_FACT` | Reasoning stage uses certainty language without an evidence reference |
| `METHOD_NOT_ACTUALLY_USED` | A method_id is cited but the method's logic is not reflected in the content |
| `CIRCULAR_REFERENCE` | Two references mutually cite each other with no external grounding |
| `ACTION_SCOPE_VIOLATION` | Action proposes more than what the decision stage authorized |

---

## Reference types

```typescript
type EvidenceRef = {
  type: "evidence"
  source: string      // "user_input" | "file" | "log" | "test_output" | "tool_result"
  locator: string     // file path with optional :line, log line range, etc.
  supports: string    // which specific claim this evidence supports
}

type RuleRef = {
  type: "rule"
  rule_id: string     // must match /^[A-Z]+-\d+$/ — e.g. "RUL-001"
  supports: string
}

type MethodRef = {
  type: "method"
  method_id: string   // must match /^[A-Z]+-\d+$/ — e.g. "RCA-001"
  supports: string
}
```

---

## Exports

```typescript
// Types
export type { RPPRecord, RPPFailure, RPPFailureCode, RPPValidationResult }
export type { EvidenceRef, RuleRef, MethodRef, Reference }
export type { CognitiveStep, ResponseStep }
export type { RPPFailureDescription }

// Functions
export { validateRPP }
export { isHardFailure }
export { RPP_FAILURE_DESCRIPTIONS }
```

---

## Who uses this

| Package | Role |
|---------|------|
| [`jingu-trust-gate`](https://github.com/ylu999/jingu-trust-gate) | Runs `validateRPP` as a `pre_tool_use` hook — blocks tool execution if RPP is missing or invalid |
| [`jingu-policy-core`](https://github.com/ylu999/jingu-policy-core) | Re-exports all RPP types for consumers that import from `@jingu/policy-core` |

---

## License

MIT
