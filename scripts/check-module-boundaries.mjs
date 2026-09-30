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

const processLayerRules = {
  domain: new Set(["domain"]),
  application: new Set(["application", "domain"]),
  infrastructure: new Set(["infrastructure", "application", "domain"]),
  runtime: new Set(["runtime", "domain"]),
  react: new Set(["react", "application", "domain"]),
  components: new Set(["components", "react", "runtime", "application", "domain"]),
};

// Adapter layers may integrate with selected top-level modules. Core process
// layers stay independent from Designer/runtime/project implementations.
const processExternalRules = {
  domain: new Set(),
  application: new Set(),
  infrastructure: new Set(),
  runtime: new Set(),
  react: new Set(),
  components: new Set(),
};


const alarmLayerRules = {
  domain: new Set(["domain"]),
  engine: new Set(["engine", "domain"]),
  application: new Set(["application", "engine", "domain"]),
  infrastructure: new Set(["infrastructure", "application", "domain"]),
  react: new Set(["react", "application", "domain"]),
  components: new Set(["components", "react", "application", "domain"]),
  testing: new Set(["testing", "engine", "domain"]),
};

const alarmExternalRules = {
  domain: new Set(),
  engine: new Set(),
  application: new Set(),
  infrastructure: new Set(),
  react: new Set(),
  components: new Set(),
  testing: new Set(),
};

const stateMachineLayerRules = {
  domain: new Set(["domain"]),
  engine: new Set(["engine", "domain"]),
  application: new Set(["application", "engine", "domain"]),
  infrastructure: new Set(["infrastructure", "application", "domain"]),
  simulation: new Set(["simulation", "engine", "domain"]),
  react: new Set(["react", "application", "domain"]),
  components: new Set(["components", "simulation", "application", "engine", "domain"]),
  pages: new Set(["pages", "components", "react", "application", "domain"]),
};

const stateMachineExternalRules = {
  domain: new Set(),
  engine: new Set(),
  application: new Set(),
  infrastructure: new Set(),
  simulation: new Set(),
  react: new Set(),
  components: new Set(["shared"]),
  pages: new Set(["shared", "project", "tags"]),
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
  const isProcessModule = sourceModule === "processes";
  const isAlarmModule = sourceModule === "alarms";
  const isStateMachineModule = sourceModule === "state-machines";
  if (!blocked && !isProcessModule && !isAlarmModule && !isStateMachineModule) continue;

  const source = fs.readFileSync(file, "utf8");
  for (const match of source.matchAll(importPattern)) {
    const specifier = match[1];
    if (!specifier?.startsWith(".")) continue;

    const target = path.resolve(path.dirname(file), specifier);
    if (!target.startsWith(srcRoot + path.sep)) continue;
    const targetModule = topModule(target);

    if (isStateMachineModule) {
      const sourceRel = path.relative(path.join(srcRoot, "state-machines"), file);
      const sourceLayer = sourceRel.split(path.sep)[0];
      const allowedLayers = stateMachineLayerRules[sourceLayer];
      const allowedExternalModules = stateMachineExternalRules[sourceLayer];
      if (!allowedLayers || !allowedExternalModules) continue;

      if (targetModule === "state-machines") {
        const targetRel = path.relative(path.join(srcRoot, "state-machines"), target);
        const targetLayer = targetRel.split(path.sep)[0];
        if (!allowedLayers.has(targetLayer)) {
          violations.push(`${path.relative(process.cwd(), file)} crosses state-machine layer ${sourceLayer} -> ${targetLayer} via ${specifier}`);
        }
      } else if (!allowedExternalModules.has(targetModule)) {
        violations.push(`${path.relative(process.cwd(), file)} imports external module ${targetModule} from state-machine layer ${sourceLayer} via ${specifier}`);
      }
      continue;
    }

    if (isAlarmModule) {
      const sourceRel = path.relative(path.join(srcRoot, "alarms"), file);
      const sourceLayer = sourceRel.split(path.sep)[0];
      const allowedLayers = alarmLayerRules[sourceLayer];
      const allowedExternalModules = alarmExternalRules[sourceLayer];
      if (!allowedLayers || !allowedExternalModules) continue;

      if (targetModule === "alarms") {
        const targetRel = path.relative(path.join(srcRoot, "alarms"), target);
        const targetLayer = targetRel.split(path.sep)[0];
        if (!allowedLayers.has(targetLayer)) {
          violations.push(`${path.relative(process.cwd(), file)} crosses alarm layer ${sourceLayer} -> ${targetLayer} via ${specifier}`);
        }
      } else if (!allowedExternalModules.has(targetModule)) {
        violations.push(`${path.relative(process.cwd(), file)} imports external module ${targetModule} from alarm layer ${sourceLayer} via ${specifier}`);
      }
      continue;
    }

    if (isProcessModule) {
      const sourceRel = path.relative(path.join(srcRoot, "processes"), file);
      const sourceLayer = sourceRel.split(path.sep)[0];
      const allowedLayers = processLayerRules[sourceLayer];
      const allowedExternalModules = processExternalRules[sourceLayer];

      // Public barrel (src/processes/index.ts) is the composition/export surface
      // and intentionally exposes all process layers.
      if (!allowedLayers || !allowedExternalModules) continue;

      if (targetModule === "processes") {
        const targetRel = path.relative(path.join(srcRoot, "processes"), target);
        const targetLayer = targetRel.split(path.sep)[0];
        if (!allowedLayers.has(targetLayer)) {
          violations.push(
            `${path.relative(process.cwd(), file)} crosses process layer ${sourceLayer} -> ${targetLayer} via ${specifier}`,
          );
        }
      } else if (!allowedExternalModules.has(targetModule)) {
        violations.push(
          `${path.relative(process.cwd(), file)} imports external module ${targetModule} from process layer ${sourceLayer} via ${specifier}`,
        );
      }
      continue;
    }

    if (blocked?.has(targetModule)) {
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
