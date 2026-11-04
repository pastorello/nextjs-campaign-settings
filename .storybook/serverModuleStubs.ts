import { readFileSync } from "node:fs";
import { relative, sep } from "node:path";
import ts from "typescript";
import type { Plugin } from "vite";

/**
 * ADR-0021: in Storybook, a module that only the server may run is replaced
 * by one spy per export.
 *
 * "Only the server may run" is decided from the source, never from a list:
 *
 * - a **Server Action module** — its first statement is the `"use server"`
 *   directive. Next itself never ships such a module to the browser; a client
 *   component receives a reference that posts back to the server. A stub is
 *   the browser-side equivalent of that reference.
 * - a **database module** — it imports `app/lib/connections/prisma`. Prisma's
 *   client, `pg` and the env validation behind them cannot load in a browser,
 *   and a story must not reach a real database even if they could.
 *
 * A stubbed module's imports are never loaded, so whatever sits behind it
 * (auth guards, `revalidatePath`, Prisma) stays out of the bundle.
 *
 * Each spy is `fn(async () => undefined)` from `storybook/test`, named
 * `<path>::<export>`: Storybook logs every named spy call in the Actions
 * panel, and resets each spy to that default before every story. A story that
 * needs a result imports the real module path and sets it —
 * `mocked(createSpell).mockResolvedValue({ ok: true })` — since the import
 * resolves to this same stub.
 */

const PRISMA_CONNECTION = /(?:^|\/)connections\/prisma$/;

export type ServerModuleKind = "server-action" | "database";

/** One export of a stubbed module: a spy, or a literal kept as written. */
export interface StubExport {
  name: string;
  literal?: string;
}

/** Why `source` must not run in the browser, or `null` when it may. */
export function serverModuleKind(
  source: string,
  fileName: string
): ServerModuleKind | null {
  const file = parse(source, fileName);
  const first = file.statements[0];
  if (
    first &&
    ts.isExpressionStatement(first) &&
    ts.isStringLiteral(first.expression) &&
    first.expression.text === "use server"
  ) {
    return "server-action";
  }

  const opensDatabase = file.statements.some(
    (statement) =>
      ts.isImportDeclaration(statement) &&
      !statement.importClause?.isTypeOnly &&
      ts.isStringLiteral(statement.moduleSpecifier) &&
      PRISMA_CONNECTION.test(statement.moduleSpecifier.text)
  );
  return opensDatabase ? "database" : null;
}

/**
 * The runtime exports of `source`, `"default"` included. Type-only exports
 * are left out: they have no value to stub.
 *
 * A literal constant (`export const YEARS_PER_PAGE = 10`) keeps its value:
 * the source already states it, so the stub can too. Throws on what a stub
 * cannot honestly reproduce — `export *`, a class, an enum, or a computed
 * value. A spy standing in for one would hand a component a function where it
 * expects something else and fail far from here; failing at build time names
 * the module instead.
 */
export function runtimeExports(source: string, fileName: string): StubExport[] {
  const file = parse(source, fileName);
  const names: StubExport[] = [];

  for (const statement of file.statements) {
    if (ts.isFunctionDeclaration(statement) && isExported(statement)) {
      if (hasModifier(statement, ts.SyntaxKind.DefaultKeyword)) {
        names.push({ name: "default" });
      } else if (statement.name) {
        names.push({ name: statement.name.text });
      }
    } else if (ts.isVariableStatement(statement) && isExported(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        const name = declaration.name.getText(file);
        const initializer = declaration.initializer;
        if (initializer && isLiteral(initializer)) {
          names.push({ name, literal: initializer.getText(file) });
        } else if (isFunctionLike(initializer)) {
          names.push({ name });
        } else {
          throw new Error(
            `${fileName}: cannot stub \`${name}\`, which is neither a ` +
              "function nor a literal. Move the value to a module that " +
              "neither is a Server Action nor imports Prisma, so a story can " +
              "load it as it is."
          );
        }
      }
    } else if (ts.isExportAssignment(statement)) {
      names.push({ name: "default" });
    } else if (ts.isExportDeclaration(statement)) {
      if (statement.isTypeOnly) continue;
      if (
        !statement.exportClause ||
        !ts.isNamedExports(statement.exportClause)
      ) {
        throw new Error(
          `${fileName}: \`export *\` cannot be stubbed; name the exports.`
        );
      }
      for (const element of statement.exportClause.elements) {
        if (!element.isTypeOnly) names.push({ name: element.name.text });
      }
    } else if (
      (ts.isClassDeclaration(statement) || ts.isEnumDeclaration(statement)) &&
      isExported(statement) &&
      !hasModifier(statement, ts.SyntaxKind.DeclareKeyword)
    ) {
      throw new Error(
        `${fileName}: cannot stub the ${ts.isClassDeclaration(statement) ? "class" : "enum"} ` +
          `\`${statement.name?.text ?? "default"}\`. Move it out of the module.`
      );
    }
  }

  return names;
}

/** The module Storybook loads instead of `fileName`. */
export function stubModuleSource(
  spyPrefix: string,
  exports: StubExport[]
): string {
  const lines = [
    'import { fn } from "storybook/test";',
    "",
    "const stub = (name) => fn(async () => undefined).mockName(name);",
  ];
  for (const { name, literal } of exports) {
    const value = literal ?? `stub(${JSON.stringify(`${spyPrefix}::${name}`)})`;
    lines.push(
      name === "default"
        ? `export default ${value};`
        : `export const ${name} = ${value};`
    );
  }
  return `${lines.join("\n")}\n`;
}

export default function serverModuleStubs(root = process.cwd()): Plugin {
  return {
    name: "campaign-settings:server-module-stubs",
    enforce: "pre",
    load(id) {
      const path = id.split("?")[0] ?? id;
      if (!/\.tsx?$/.test(path) || path.includes(`${sep}node_modules${sep}`)) {
        return null;
      }
      const relativePath = relative(root, path);
      if (relativePath.startsWith("..")) return null;

      const source = readFileSync(path, "utf-8");
      if (!serverModuleKind(source, path)) return null;

      const spyPrefix = relativePath
        .split(sep)
        .join("/")
        .replace(/\.tsx?$/, "");
      return stubModuleSource(spyPrefix, runtimeExports(source, path));
    },
  };
}

function parse(source: string, fileName: string): ts.SourceFile {
  return ts.createSourceFile(
    fileName,
    source,
    ts.ScriptTarget.Latest,
    true,
    fileName.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  );
}

function hasModifier(node: ts.Node, kind: ts.SyntaxKind): boolean {
  return (
    ts.canHaveModifiers(node) &&
    (ts.getModifiers(node) ?? []).some((modifier) => modifier.kind === kind)
  );
}

function isExported(node: ts.Node): boolean {
  return hasModifier(node, ts.SyntaxKind.ExportKeyword);
}

function isLiteral(node: ts.Expression): boolean {
  if (
    ts.isNumericLiteral(node) ||
    ts.isStringLiteral(node) ||
    ts.isNoSubstitutionTemplateLiteral(node) ||
    node.kind === ts.SyntaxKind.TrueKeyword ||
    node.kind === ts.SyntaxKind.FalseKeyword ||
    node.kind === ts.SyntaxKind.NullKeyword
  ) {
    return true;
  }
  return (
    ts.isPrefixUnaryExpression(node) &&
    node.operator === ts.SyntaxKind.MinusToken &&
    ts.isNumericLiteral(node.operand)
  );
}

function isFunctionLike(node: ts.Expression | undefined): boolean {
  if (!node) return false;
  if (ts.isArrowFunction(node) || ts.isFunctionExpression(node)) return true;
  // `export const fetchX = cache(async () => …)` and similar wrappers.
  if (ts.isCallExpression(node)) {
    return node.arguments.some((argument) => isFunctionLike(argument));
  }
  if (ts.isParenthesizedExpression(node) || ts.isAsExpression(node)) {
    return isFunctionLike(node.expression);
  }
  return false;
}
