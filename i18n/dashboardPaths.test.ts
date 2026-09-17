// @vitest-environment node
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";

/**
 * ADR-0013 rule 5: every dashboard path is built by `dashboardPath`. A link
 * spelled out by hand does not break when it drops the system — `proxy.ts`
 * quietly lands it on the default system — so nothing but this test notices.
 *
 * It walks the TypeScript AST rather than grepping, so a comment describing a
 * URL is not an offence and a literal split across a template is still one.
 *
 * Used to carry an `ALLOWLIST` of files that predated the system segment
 * (SPEC-018 T2 part A); part B rewrote every one of them onto `dashboardPath`
 * and removed it (2026-09-17), so this is now simply "no offenders".
 */
const ROOT = join(__dirname, "..");
const SKIPPED_DIRS = new Set([
  "node_modules",
  "e2e",
  "generated",
  "coverage",
  "playwright-report",
  "test-results",
  "storage",
  "public",
]);
const HELPER = "i18n/dashboardPath.ts";

function isSourceFile(name: string) {
  return /\.tsx?$/.test(name) && !/\.(test|spec)\.tsx?$/.test(name);
}

function* sourceFiles(dir: string): Generator<string> {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".") || SKIPPED_DIRS.has(entry.name)) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* sourceFiles(path);
    else if (isSourceFile(entry.name)) yield relative(ROOT, path);
  }
}

function spellsOutDashboardPath(file: string) {
  const source = ts.createSourceFile(
    file,
    readFileSync(join(ROOT, file), "utf8"),
    ts.ScriptTarget.Latest,
    false,
    file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  );
  let found = false;
  const visit = (node: ts.Node) => {
    if (found) return;
    if (
      (ts.isStringLiteralLike(node) || ts.isTemplateLiteralToken(node)) &&
      node.text.startsWith("/dashboard")
    ) {
      found = true;
      return;
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return found;
}

const offenders = [...sourceFiles(ROOT)]
  .filter((file) => file !== HELPER && spellsOutDashboardPath(file))
  .sort();

describe("dashboard paths (ADR-0013 rule 5)", () => {
  it("are built by dashboardPath, never spelled out", () => {
    expect(offenders).toEqual([]);
  });
});
