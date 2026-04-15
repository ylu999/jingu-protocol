#!/usr/bin/env node
/**
 * check-no-alias.mjs — detect alias maps and local symbol redefinitions.
 *
 * Scans sibling repo directories for patterns that indicate a consumer is
 * redefining canonical symbols locally instead of importing from jingu-protocol.
 *
 * Exit 0 = clean, Exit 1 = violations found.
 */
import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..");
const parentDir = resolve(repoRoot, "..");

const REPOS = [
  { name: "jingu-cognition", path: resolve(parentDir, "jingu-cognition/src") },
  { name: "jingu-policy-core", path: resolve(parentDir, "jingu-policy-core/src") },
  { name: "jingu-swebench", path: resolve(parentDir, "jingu-swebench/scripts") },
];

// Files that are intentionally allowed to define their own Principal/Phase types
// (CDP v1 is a completely separate taxonomy)
const ALLOWLISTED_FILES = [
  // CDP v1 taxonomy — completely separate principal/type system, not cognition-layer symbols
  "jingu-policy-core/src/cognition/principals/taxonomy.ts",
  "jingu-policy-core/src/cognition/taxonomy.ts",
  // LLM output boundary adapters — the ONE place where non-canonical phase strings are
  // legitimately referenced, because LLM output may contain "ANALYSIS" instead of "ANALYZE".
  // These files normalize at the system boundary; all internal code uses canonical only.
  "jingu-swebench/scripts/declaration_extractor.py",
  "jingu-swebench/scripts/principal_inference.py",
];

/**
 * Patterns that indicate alias maps or local symbol redefinitions.
 * Each has a pattern (grep -E regex) and description for error messages.
 */
const FORBIDDEN_PATTERNS = [
  { pattern: "_PHASE_CANON", desc: "local phase alias map" },
  { pattern: "_phase_canon", desc: "local phase alias map" },
  { pattern: "PHASE_ALIAS", desc: "phase alias table" },
  { pattern: "normalize_phase", desc: "phase normalization function" },
  { pattern: "map_phase", desc: "phase mapping function" },
  { pattern: "toUpperCase\\(\\)\\s*(as\\s+Phase)", desc: "unsafe toUpperCase as Phase cast" },
  { pattern: "toLowerCase\\(\\)\\s*(as\\s+Principal)", desc: "unsafe toLowerCase as Principal cast" },
];

/**
 * Type redefinition patterns — these catch consumers defining their own
 * Phase/Principal/Subtype/Verdict types instead of importing from protocol.
 */
const FORBIDDEN_TYPE_DEFS = [
  { pattern: "^\\s*(export\\s+)?type\\s+Phase\\s*=", desc: "local Phase type redefinition" },
  { pattern: "^\\s*(export\\s+)?type\\s+Principal\\s*=", desc: "local Principal type redefinition" },
  { pattern: "^\\s*(export\\s+)?type\\s+Subtype\\s*=", desc: "local Subtype type redefinition" },
  { pattern: "^\\s*(export\\s+)?type\\s+Verdict\\s*=", desc: "local Verdict type redefinition" },
];

/**
 * Non-canonical phase string literals that indicate alias usage.
 * These are strings that look like phases but are not in the canonical set.
 */
const NON_CANONICAL_PHASE_LITERALS = [
  { pattern: '"ANALYSIS"', desc: "non-canonical phase alias ANALYSIS" },
  { pattern: '"EXECUTION"', desc: "non-canonical phase alias EXECUTION" },
  { pattern: '"OBSERVATION"', desc: "non-canonical phase alias OBSERVATION" },
  { pattern: '"PLANNING"', desc: "non-canonical phase alias PLANNING" },
  { pattern: '"VERIFY"', desc: "non-canonical phase alias VERIFY" },
  { pattern: '"VALIDATE"', desc: "non-canonical phase alias VALIDATE" },
];

let violations = 0;

/**
 * Run grep on a directory, return matching lines or empty string.
 */
function grep(pattern, dir, fileGlob) {
  try {
    return execSync(
      `grep -rnE '${pattern}' "${dir}" --include="${fileGlob}" 2>/dev/null || true`,
      { encoding: "utf-8" },
    ).trim();
  } catch {
    return "";
  }
}

/**
 * Check if a match line is in the allowlist.
 */
function isAllowlisted(line) {
  return ALLOWLISTED_FILES.some((f) => line.includes(f));
}

/**
 * Filter out comment lines (// for TS, # for Python) and allowlisted files.
 */
function filterLines(raw) {
  if (!raw) return [];
  return raw
    .split("\n")
    .filter((l) => l.trim() !== "")
    .filter((l) => !isAllowlisted(l))
    .filter((l) => {
      // Extract the content after the filename:line: prefix
      const contentMatch = l.match(/:\d+:\s*(.*)$/);
      if (!contentMatch) return true;
      const content = contentMatch[1].trim();
      // Skip pure comment lines
      if (content.startsWith("//") || content.startsWith("#") || content.startsWith("*")) return false;
      return true;
    });
}

for (const repo of REPOS) {
  if (!existsSync(repo.path)) {
    console.log(`[skip] ${repo.name}: ${repo.path} not found`);
    continue;
  }

  const fileGlobs = repo.name === "jingu-swebench" ? "*.py" : "*.ts";

  // Check forbidden alias patterns
  for (const { pattern, desc } of FORBIDDEN_PATTERNS) {
    const raw = grep(pattern, repo.path, fileGlobs);
    const lines = filterLines(raw);
    if (lines.length > 0) {
      console.log(`\n[VIOLATION] ${repo.name}: ${desc}`);
      lines.forEach((l) => console.log(`  ${l}`));
      violations++;
    }
  }

  // Check forbidden type redefinitions (TS only)
  if (fileGlobs === "*.ts") {
    for (const { pattern, desc } of FORBIDDEN_TYPE_DEFS) {
      const raw = grep(pattern, repo.path, fileGlobs);
      const lines = filterLines(raw);
      if (lines.length > 0) {
        console.log(`\n[VIOLATION] ${repo.name}: ${desc}`);
        lines.forEach((l) => console.log(`  ${l}`));
        violations++;
      }
    }
  }

  // Check non-canonical phase literals (only in type/const definitions, not in test assertions or error messages)
  for (const { pattern: literal, desc } of NON_CANONICAL_PHASE_LITERALS) {
    const raw = grep(literal, repo.path, fileGlobs);
    const lines = filterLines(raw).filter((l) => {
      // Allow in test assertion contexts (throws, assert)
      if (/\b(throws|assert|expect|test_)\b/.test(l)) return false;
      // Allow in error/explanation message strings (describing the mismatch problem)
      if (/TypeError|ValueError|Error\(|instead of|e\.g\.|for example|was not normalized/.test(l)) return false;
      // Allow in comments about non-canonical values
      if (/non-canonical|alias|stale|legacy/.test(l)) return false;
      return true;
    });
    if (lines.length > 0) {
      console.log(`\n[VIOLATION] ${repo.name}: ${desc}`);
      lines.forEach((l) => console.log(`  ${l}`));
      violations++;
    }
  }

  // Check for Python Literal with lowercase phase names
  if (fileGlobs === "*.py") {
    const pyLiteralPattern = 'Literal\\[.*"(analysis|decision|design|execution|judge|observation)"';
    const raw = grep(pyLiteralPattern, repo.path, fileGlobs);
    const lines = filterLines(raw);
    if (lines.length > 0) {
      console.log(`\n[VIOLATION] ${repo.name}: lowercase phase in Python Literal type`);
      lines.forEach((l) => console.log(`  ${l}`));
      violations++;
    }
  }
}

console.log("");
if (violations > 0) {
  console.log(`${violations} violation(s) found. Fix before committing.`);
  process.exit(1);
} else {
  console.log("No alias violations found.");
  process.exit(0);
}
