import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";

/**
 * Which UI components a story renders (ADR-0021). A component counts as
 * covered when some `*.stories.tsx` imports its file — directly, which is
 * how every story names its subject.
 */

export const ROOT = resolve(__dirname, "..");
const COMPONENT_ROOTS = ["app/ui", "app/modules"];

/** Every component file: `.tsx` under the UI roots, tests and stories aside. */
export function componentFiles(): string[] {
  return COMPONENT_ROOTS.flatMap((dir) => walk(join(ROOT, dir)))
    .filter(
      (file) =>
        file.endsWith(".tsx") &&
        !/\.(test|spec|stories|testkit)\.tsx$/.test(file)
    )
    .map((file) => relative(ROOT, file))
    .sort();
}

/** The component files some story imports. */
export function storiedFiles(): Set<string> {
  const stories = COMPONENT_ROOTS.flatMap((dir) =>
    walk(join(ROOT, dir))
  ).filter((file) => /\.stories\.tsx?$/.test(file));
  const imported = new Set<string>();
  for (const story of stories) {
    const source = readFileSync(story, "utf-8");
    for (const [, specifier] of source.matchAll(/from\s+["']([^"']+)["']/g)) {
      const file = specifier && resolveImport(specifier, dirname(story));
      if (file) imported.add(relative(ROOT, file));
    }
  }
  return imported;
}

function resolveImport(specifier: string, fromDir: string): string | null {
  let base: string;
  if (specifier.startsWith("@/")) base = join(ROOT, specifier.slice(2));
  else if (specifier.startsWith(".")) base = resolve(fromDir, specifier);
  else return null;

  for (const candidate of [
    base,
    `${base}.tsx`,
    `${base}.ts`,
    join(base, "index.tsx"),
    join(base, "index.ts"),
  ]) {
    if (existsSync(candidate) && /\.tsx?$/.test(candidate)) return candidate;
  }
  return null;
}

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}
