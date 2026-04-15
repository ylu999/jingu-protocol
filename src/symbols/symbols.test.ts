/**
 * symbols.test.ts — invariant tests for canonical symbol definitions.
 *
 * These tests guard against:
 * - Symbol count changes (accidental additions/removals)
 * - Duplicate entries in symbol arrays
 * - Alias resolution (non-canonical strings must throw)
 * - Round-trip: every value in ALL_X passes assertX
 */
import { describe, it } from "node:test";
import { strict as assert } from "node:assert";
import {
  ALL_PHASES, assertPhase,
  ALL_PRINCIPALS, assertPrincipal,
  ALL_SUBTYPES, assertSubtype,
  ALL_VERDICTS, assertVerdict,
} from "./index.js";

describe("canonical symbols", () => {
  // --- Count invariants ---

  it("Phase has exactly 7 values", () => {
    assert.equal(ALL_PHASES.length, 7);
  });

  it("Principal has exactly 15 values", () => {
    assert.equal(ALL_PRINCIPALS.length, 15);
  });

  it("Subtype has exactly 6 values", () => {
    assert.equal(ALL_SUBTYPES.length, 6);
  });

  it("Verdict has exactly 3 values", () => {
    assert.equal(ALL_VERDICTS.length, 3);
  });

  // --- No duplicates ---

  it("no duplicate phases", () => {
    assert.equal(new Set(ALL_PHASES).size, ALL_PHASES.length);
  });

  it("no duplicate principals", () => {
    assert.equal(new Set(ALL_PRINCIPALS).size, ALL_PRINCIPALS.length);
  });

  it("no duplicate subtypes", () => {
    assert.equal(new Set(ALL_SUBTYPES).size, ALL_SUBTYPES.length);
  });

  it("no duplicate verdicts", () => {
    assert.equal(new Set(ALL_VERDICTS).size, ALL_VERDICTS.length);
  });

  // --- assertPhase: non-canonical throws ---

  it("assertPhase throws on non-canonical", () => {
    assert.throws(() => assertPhase("analysis"), TypeError);
    assert.throws(() => assertPhase("ANALYSIS"), TypeError);
    assert.throws(() => assertPhase("execution"), TypeError);
    assert.throws(() => assertPhase("EXECUTION"), TypeError);
    assert.throws(() => assertPhase("VERIFY"), TypeError);
    assert.throws(() => assertPhase("PLAN"), TypeError);
    assert.throws(() => assertPhase("VALIDATE"), TypeError);
    assert.throws(() => assertPhase(""), TypeError);
  });

  it("assertPhase passes on all canonical values", () => {
    for (const p of ALL_PHASES) {
      // assertPhase returns void (assertion function) — no throw = pass
      assertPhase(p);
    }
  });

  // --- assertPrincipal: non-canonical throws ---

  it("assertPrincipal throws on non-canonical", () => {
    assert.throws(() => assertPrincipal("causality"), TypeError);
    assert.throws(() => assertPrincipal("CAUSAL_GROUNDING"), TypeError);
    assert.throws(() => assertPrincipal("evidence_based"), TypeError);
    assert.throws(() => assertPrincipal(""), TypeError);
  });

  it("assertPrincipal passes on all canonical values", () => {
    for (const p of ALL_PRINCIPALS) {
      assertPrincipal(p);
    }
  });

  // --- assertSubtype: non-canonical throws ---

  it("assertSubtype throws on non-canonical", () => {
    assert.throws(() => assertSubtype("analysis"), TypeError);
    assert.throws(() => assertSubtype("root_cause"), TypeError);
    assert.throws(() => assertSubtype("ANALYSIS.ROOT_CAUSE"), TypeError);
    assert.throws(() => assertSubtype(""), TypeError);
  });

  it("assertSubtype passes on all canonical values", () => {
    for (const s of ALL_SUBTYPES) {
      assertSubtype(s);
    }
  });

  // --- assertVerdict: non-canonical throws ---

  it("assertVerdict throws on non-canonical", () => {
    assert.throws(() => assertVerdict("admitted"), TypeError);
    assert.throws(() => assertVerdict("PASSED"), TypeError);
    assert.throws(() => assertVerdict("pass"), TypeError);
    assert.throws(() => assertVerdict(""), TypeError);
  });

  it("assertVerdict passes on all canonical values", () => {
    for (const v of ALL_VERDICTS) {
      assertVerdict(v);
    }
  });
});
