import type {
  MockScriptContext,
  MockScriptInternalApi,
  UiComponentScriptApi,
} from "./types";

/** Trusted prototype executor. Production must replace this with a sandbox. */
export function executeJavaScriptSource({
  code,
  ctx,
  self,
  internal,
  args,
  globals = {},
  sourceUrl,
}: {
  code: string;
  ctx: MockScriptContext;
  self: UiComponentScriptApi | undefined;
  internal?: MockScriptInternalApi | undefined;
  args: unknown[];
  globals?: Record<string, unknown> | undefined;
  sourceUrl: string;
}) {
  const reserved = new Set(["ctx", "self", "internal", "args", "App"]);
  const globalEntries = Object.entries(globals).filter(
    ([name]) => /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(name) && !reserved.has(name)
  );
  const globalNames = globalEntries.map(([name]) => name);
  const globalValues = globalEntries.map(([, value]) => value);

  if (internal) {
    const execute = new Function(
      "ctx",
      "self",
      "internal",
      "args",
      "App",
      ...globalNames,
      `"use strict";\n${code}\n//# sourceURL=${sourceUrl}`
    ) as (...values: unknown[]) => unknown;
    return execute(ctx, self, internal, args, ctx.app, ...globalValues);
  }

  const execute = new Function(
    "ctx",
    "self",
    "args",
    "App",
    ...globalNames,
    `"use strict";\n${code}\n//# sourceURL=${sourceUrl}`
  ) as (...values: unknown[]) => unknown;
  return execute(ctx, self, args, ctx.app, ...globalValues);
}
