// src/index.ts — jingu-protocol public API

export type {
  EvidenceRef,
  RuleRef,
  MethodRef,
  DerivedRef,
  Reference,
  CognitiveStep,
  ResponseStep,
  RPPRecord,
  RPPFailureCode,
  RPPFailure,
  RPPValidationResult,
  RPPPolicy,
} from "./rpp/rpp.types.js"

export type { RPPFailureDescription } from "./rpp/rpp.failures.js"
export { RPP_FAILURE_DESCRIPTIONS, isHardFailure } from "./rpp/rpp.failures.js"

export { validateRPP } from "./rpp/rpp.validate.js"
