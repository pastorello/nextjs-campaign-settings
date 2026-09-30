import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import ts from "typescript";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

// TD-148 — `next dev` writes `.next/dev/types` from a watcher handler nothing
// serialises, so at startup two writes to one file can overlap and leave a
// shorter version followed by the tail of a longer one. `pnpm typecheck` then
// failed on generated code. The fix is `tsconfig.typecheck.json`, which
// leaves `.next/dev` out the way `next build`'s own type check does.
//
// The projects are parsed in a temp dir with such a file planted, so the
// tests do not depend on whether a dev server ever ran in this checkout (CI's
// unit job has no `.next` at all). Only syntax is checked: that is what a
// half-written file breaks, and it needs no lib or node_modules.

const repoRoot = process.cwd();

// The shape seen on 2026-09-30 in validator.ts: a complete shorter write,
// then a longer write's tail starting mid-line.
const HALF_WRITTEN_VALIDATOR = `export {}
n/domains/layout.tsx")
  handler satisfies LayoutConfig<"/[locale]/dashboard/[system]/domains">
}
`;

let fixtureRoot: string;

function write(relativePath: string, content: string) {
  const filePath = path.join(fixtureRoot, relativePath);
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, content);
}

function programFor(configName: string): ts.Program {
  const parsed = ts.getParsedCommandLineOfConfigFile(
    path.join(fixtureRoot, configName),
    { noLib: true, types: [] },
    {
      ...ts.sys,
      onUnRecoverableConfigFileDiagnostic: (diagnostic) => {
        throw new Error(
          ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n")
        );
      },
    }
  );
  if (!parsed) throw new Error(`${configName} did not parse`);
  return ts.createProgram({
    rootNames: parsed.fileNames,
    options: parsed.options,
  });
}

function relative(fileName: string): string {
  return path.relative(fixtureRoot, fileName).split(path.sep).join("/");
}

function filesIn(program: ts.Program): string[] {
  return program.getSourceFiles().map((file) => relative(file.fileName));
}

function filesWithSyntaxErrors(program: ts.Program): string[] {
  return program
    .getSyntacticDiagnostics()
    .map((diagnostic) =>
      diagnostic.file ? relative(diagnostic.file.fileName) : "(global)"
    );
}

beforeAll(() => {
  fixtureRoot = mkdtempSync(path.join(tmpdir(), "td148-"));
  for (const config of ["tsconfig.json", "tsconfig.typecheck.json"]) {
    copyFileSync(path.join(repoRoot, config), path.join(fixtureRoot, config));
  }
  // What `next typegen` leaves behind: next-env.d.ts pointing at .next/types.
  write(
    "next-env.d.ts",
    'import "./.next/types/routes.d.ts";\nimport "./.next/types/root-params.d.ts";\n'
  );
  write(".next/types/routes.d.ts", "export {}\n");
  write(".next/types/root-params.d.ts", "export {}\n");
  write(".next/types/validator.ts", "export {}\n");
  write(".next/dev/types/validator.ts", HALF_WRITTEN_VALIDATOR);
  write("app/page.ts", "export const page = 1;\n");
});

afterAll(() => {
  rmSync(fixtureRoot, { recursive: true, force: true });
});

describe("pnpm typecheck's project (TD-148)", () => {
  it("is the project the typecheck script runs, after next typegen", () => {
    const { scripts } = JSON.parse(
      readFileSync(path.join(repoRoot, "package.json"), "utf-8")
    ) as { scripts: Record<string, string> };

    expect(scripts.typecheck).toBe(
      "next typegen && tsc --noEmit -p tsconfig.typecheck.json"
    );
  });

  it("does not read a half-written file under .next/dev/types", () => {
    const program = programFor("tsconfig.typecheck.json");

    expect(filesWithSyntaxErrors(program)).toEqual([]);
    expect(filesIn(program).filter((f) => f.startsWith(".next/dev/"))).toEqual(
      []
    );
  });

  it("still reads the types next typegen writes to .next/types", () => {
    const files = filesIn(programFor("tsconfig.typecheck.json"));

    expect(files).toContain(".next/types/validator.ts");
    expect(files).toContain("app/page.ts");
  });

  it("differs from tsconfig.json, which next dev keeps reading .next/dev/types", () => {
    // The old script ran tsc on this project; this is the failure it hit.
    expect(filesWithSyntaxErrors(programFor("tsconfig.json"))).toContain(
      ".next/dev/types/validator.ts"
    );
  });
});
