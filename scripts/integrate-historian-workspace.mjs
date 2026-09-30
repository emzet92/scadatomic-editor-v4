import fs from "node:fs";

function updateFile(path, transform) {
  const source = fs.readFileSync(path, "utf8");
  const next = transform(source);
  if (next !== source) {
    fs.writeFileSync(path, next);
    console.log(`updated ${path}`);
  } else {
    console.log(`unchanged ${path}`);
  }
}

updateFile("src/App.tsx", (source) => {
  let next = source;

  if (!next.includes('HistorianWorkspacePage')) {
    const importLine = 'import { HistorianWorkspacePage } from "./designer/features/historian";\n';
    const functionIndex = next.search(/(?:export\s+default\s+)?function\s+App\s*\(/);
    if (functionIndex < 0) throw new Error("Could not find App function in src/App.tsx");
    next = next.slice(0, functionIndex) + importLine + next.slice(functionIndex);
  }

  if (!next.includes('path="/project/:projectId/historian"')) {
    const routes =
      '      <Route path="/project/:projectId/historian" element={<HistorianWorkspacePage view="explorer" />} />\n' +
      '      <Route path="/project/:projectId/historian/config" element={<HistorianWorkspacePage view="config" />} />\n';
    const closeIndex = next.lastIndexOf("</Routes>");
    if (closeIndex < 0) throw new Error("Could not find </Routes> in src/App.tsx");
    const lineStart = next.lastIndexOf("\n", closeIndex) + 1;
    next = next.slice(0, lineStart) + routes + next.slice(lineStart);
  }

  return next;
});

updateFile("src/shared/ui/organisms/WorkspaceHeader.tsx", (source) => {
  let next = source;

  if (!/\bDatabaseIcon\b/.test(next)) {
    const uiImport = next.match(/import\s*\{[\s\S]*?\}\s*from\s*["']\.\.["'];?/);
    if (!uiImport) throw new Error("Could not find shared UI import in WorkspaceHeader.tsx");
    const replacement = uiImport[0].replace(/\{([\s\S]*?)\}/, (_, body) => {
      const trimmed = body.trimEnd();
      const separator = trimmed.trim().length && !trimmed.trim().endsWith(",") ? "," : "";
      return `{${trimmed}${separator}\n  DatabaseIcon,\n}`;
    });
    next = next.replace(uiImport[0], replacement);
  }

  if (!/export type WorkspaceId\s*=[\s\S]*?["']historian["'][\s\S]*?;/.test(next)) {
    next = next.replace(
      /(export type WorkspaceId\s*=)([\s\S]*?);/,
      (_, head, body) => `${head}${body.trimEnd()} | "historian";`,
    );
  }

  if (!next.includes('id: "historian"')) {
    const item =
      '  { id: "historian", label: "Historian", icon: DatabaseIcon, href: ({ projectId }) => projectId ? `/project/${encodeURIComponent(projectId)}/historian` : null },\n';
    const cloudIndex = next.search(/^\s*\{\s*id:\s*["']cloud["']/m);
    if (cloudIndex < 0) throw new Error("Could not find Cloud workspace entry in WorkspaceHeader.tsx");
    const lineStart = next.lastIndexOf("\n", cloudIndex) + 1;
    next = next.slice(0, lineStart) + item + next.slice(lineStart);
  }

  return next;
});

updateFile("src/runtime/runtime-provider.ts", (source) => {
  let next = source;

  if (!next.includes("useRuntimeHistorianRecorder")) {
    const importsEnd = next.search(/\n(?:export\s+)?(?:type|interface|function|const|class)\b/);
    if (importsEnd < 0) throw new Error("Could not locate end of imports in runtime-provider.ts");
    const importLine = 'import { useRuntimeHistorianRecorder } from "./integrations/historian";\n';
    next = next.slice(0, importsEnd + 1) + importLine + next.slice(importsEnd + 1);
  }

  if (!/useRuntimeHistorianRecorder\s*\(\s*projectId\s*\)/.test(next)) {
    const match = /export function RuntimeProvider\s*\([\s\S]*?\)\s*\{/m.exec(next);
    if (!match) throw new Error("Could not find RuntimeProvider function in runtime-provider.ts");
    const insertAt = match.index + match[0].length;
    next = next.slice(0, insertAt) + "\n  useRuntimeHistorianRecorder(projectId);" + next.slice(insertAt);
  }

  return next;
});

updateFile("scripts/check-module-boundaries.mjs", (source) => {
  if (/historian\s*:\s*new Set/.test(source)) return source;

  const start = source.indexOf("const forbidden = {");
  if (start < 0) {
    console.warn("warning: could not find forbidden map; historian boundary rule not inserted");
    return source;
  }
  const end = source.indexOf("\n};", start);
  if (end < 0) {
    console.warn("warning: could not find end of forbidden map; historian boundary rule not inserted");
    return source;
  }

  const line = '  historian: new Set(["designer", "mock", "project", "runtime", "tags", "visualization"]),\n';
  return source.slice(0, end + 1) + line + source.slice(end + 1);
});

console.log("Historian integration complete.");
