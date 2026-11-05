// @vitest-environment node
import { mkdtempSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

import serverModuleStubs, {
  runtimeExports,
  serverModuleKind,
  stubModuleSource,
} from "./serverModuleStubs";

const ROOT = join(__dirname, "..");

describe("serverModuleKind", () => {
  it("recognises a Server Action module by its leading directive", () => {
    expect(
      serverModuleKind(
        '"use server";\nexport default async function a() {}',
        "a.ts"
      )
    ).toBe("server-action");
  });

  it("recognises a module that imports the Prisma connection", () => {
    expect(
      serverModuleKind(
        'import prisma from "@/app/lib/connections/prisma";\nexport async function f() {}',
        "f.ts"
      )
    ).toBe("database");
    expect(
      serverModuleKind('import prisma from "../../connections/prisma";', "f.ts")
    ).toBe("database");
  });

  it("leaves everything else to run in the browser", () => {
    // A type-only import pulls nothing into the bundle.
    expect(
      serverModuleKind(
        'import type prisma from "@/app/lib/connections/prisma";',
        "t.ts"
      )
    ).toBeNull();
    // Only a *leading* directive makes a Server Action module.
    expect(
      serverModuleKind('import x from "y";\n"use server";', "late.ts")
    ).toBeNull();
    expect(
      serverModuleKind('"use client";\nexport default function C() {}', "c.tsx")
    ).toBeNull();
  });
});

describe("runtimeExports", () => {
  it("lists every runtime export and skips the type-only ones", () => {
    const source = `
      "use server";
      import type Spell from "./Spell";
      export type Result = { ok: boolean };
      export interface Options { page: number }
      export default async function createSpell() {}
      export async function fetchOne() {}
      export const fetchMany = async () => [];
      export const cached = cache(async () => null);
      const local = async () => null;
      export { local as renamed, type Spell };
    `;
    expect(runtimeExports(source, "m.ts")).toEqual([
      { name: "default" },
      { name: "fetchOne" },
      { name: "fetchMany" },
      { name: "cached" },
      { name: "renamed" },
    ]);
  });

  it("keeps a literal constant's value", () => {
    expect(runtimeExports("export const YEARS_PER_PAGE = 10;", "m.ts")).toEqual(
      [{ name: "YEARS_PER_PAGE", literal: "10" }]
    );
  });

  it("refuses what a spy cannot stand in for", () => {
    expect(() =>
      runtimeExports("export const LIMITS = computeLimits();", "m.ts")
    ).toThrow(/LIMITS.*neither a function nor a literal/);
    expect(() => runtimeExports('export * from "./other";', "m.ts")).toThrow(
      /export \*/
    );
    expect(() => runtimeExports("export class Store {}", "m.ts")).toThrow(
      /class `Store`/
    );
  });
});

describe("stubModuleSource", () => {
  it("names each spy after its module and export", () => {
    const source = stubModuleSource("app/lib/data/spells/createSpell", [
      { name: "default" },
      { name: "helper" },
      { name: "PAGE_SIZE", literal: "20" },
    ]);
    expect(source).toContain('import { fn } from "storybook/test";');
    expect(source).toContain(
      'export default stub("app/lib/data/spells/createSpell::default");'
    );
    expect(source).toContain(
      'export const helper = stub("app/lib/data/spells/createSpell::helper");'
    );
    expect(source).toContain("export const PAGE_SIZE = 20;");
  });
});

describe("the Vite plugin", () => {
  const dir = mkdtempSync(join(tmpdir(), "server-module-stubs-"));
  const plugin = serverModuleStubs(dir);
  const load = (id: string) =>
    (plugin.load as (id: string) => string | null).call({}, id);

  it("replaces a server module with its stub", () => {
    const file = join(dir, "createThing.ts");
    writeFileSync(file, '"use server";\nexport default async function c() {}');
    expect(load(file)).toContain('stub("createThing::default")');
    // Vite appends queries to ids; they do not change the file.
    expect(load(`${file}?v=123`)).toContain('stub("createThing::default")');
  });

  it("leaves a browser module, a dependency and a file outside the root alone", () => {
    const file = join(dir, "Button.tsx");
    writeFileSync(file, "export default function Button() {}");
    expect(load(file)).toBeNull();
    expect(load(join(dir, "node_modules", "pkg", "index.ts"))).toBeNull();
    expect(load(join(tmpdir(), "elsewhere.ts"))).toBeNull();
    expect(load(join(dir, "styles.css"))).toBeNull();
  });
});

/**
 * The guard that matters: a server module that cannot be stubbed breaks every
 * story that imports it, but only once someone opens Storybook. Checking the
 * whole tree here moves that failure into `pnpm test`.
 */
describe("every server module in app/", () => {
  const files = sourceFiles(join(ROOT, "app"));
  const serverModules = files.filter((file) =>
    serverModuleKind(readFileSync(file, "utf-8"), file)
  );

  it("is found (the scan is not silently empty)", () => {
    expect(serverModules.length).toBeGreaterThan(100);
  });

  it("can be stubbed, every one", () => {
    const refusals = serverModules.flatMap((file) => {
      try {
        runtimeExports(readFileSync(file, "utf-8"), relative(ROOT, file));
        return [];
      } catch (error) {
        return [(error as Error).message];
      }
    });
    expect(refusals).toEqual([]);
  });
});

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return /\.tsx?$/.test(entry.name) &&
      !/\.(test|spec|stories)\.tsx?$/.test(entry.name)
      ? [path]
      : [];
  });
}
