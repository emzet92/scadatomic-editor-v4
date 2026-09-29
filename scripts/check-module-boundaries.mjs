import fs from "node:fs";
import path from "node:path";

const srcRoot = path.resolve("src");
const codeExtensions = new Set([".ts", ".tsx", ".js", ".jsx"]);

// Hard architectural rules. These are intentionally conservative: they protect
// domain/core modules from drifting back toward the Designer application layer.
const forbidden = {
  shared: new Set(["animations", "assets", "processes", "design-system", "designer", "fleet", "mock", "project", "reactivity", "reporting", "runtime", "scripting", "tags", "visualization"]),
  "design-system": new Set(["animations", "designer", "mock", "processes", "project", "runtime", "tags", "visualization"]),
  tags: new Set(["animations", "designer", "mock", "processes", "project", "runtime", "visualization"]),
  reactivity: new Set(["animations", "designer", "mock", "processes", "project", "runtime", "visualization"]),
  visualization: new Set(["designer", "mock"]),
  fleet: new Set(["animations", "designer", "mock", "processes", "project", "reactivity", "runtime", "scripting", "tags", "visualization"]),
};

const importPattern = /(?:from\s+|import\s*\(\s*|import\s+)["']([^"']+)["']/g;
const violations = [];

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

function topModule(file) {
  const rel = path.relative(srcRoot, file);
  return rel.split(path.sep)[0];
}

for (const file of walk(srcRoot)) {
  if (!codeExtensions.has(path.extname(file))) continue;
  const sourceModule = topModule(file);
  const blocked = forbidden[sourceModule];
  if (!blocked) continue;

  const source = fs.readFileSync(file, "utf8");
  for (const match of source.matchAll(importPattern)) {
    const specifier = match[1];
    if (!specifier?.startsWith(".")) continue;

    const target = path.resolve(path.dirname(file), specifier);
    if (!target.startsWith(srcRoot + path.sep)) continue;
    const targetModule = topModule(target);

    if (sourceModule === "processes") {
      const sourceRel = path.relative(path.join(srcRoot, "processes"), file);
      const sourceLayer = sourceRel.split(path.sep)[0];
      const allowedLayers = processLayerRules[sourceLayer];
      if (allowedLayers) {
        const targetRel = path.relative(path.join(srcRoot, "processes"), target);
        const targetInsideProcesses = !targetRel.startsWith(`..${path.sep}`) && targetRel !== "..";
        const targetLayer = targetInsideProcesses ? targetRel.split(path.sep)[0] : null;
        if (!targetLayer || !allowedLayers.has(targetLayer)) {
          violations.push(
            `${path.relative(process.cwd(), file)} crosses process layer ${sourceLayer} -> ${targetModule}/${targetLayer ?? "external"} via ${specifier}`,
          );
        }
      }
    }

    if (blocked.has(targetModule)) {
      violations.push(
        `${path.relative(process.cwd(), file)} imports ${targetModule} via ${specifier}`,
      );
    }
  }
}

if (violations.length > 0) {
  console.error("Module boundary violations:\n");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log("Module boundaries: OK");
