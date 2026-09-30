import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const outDir = path.join(root, ".process-test-dist");
const tsc = path.join(root, "node_modules", "typescript", "lib", "tsc.js");

function findTests(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return findTests(full);
    return entry.name.endsWith(".test.js") ? [full] : [];
  });
}

let exitCode = 0;
try {
  fs.rmSync(outDir, { recursive: true, force: true });
  execFileSync(process.execPath, [tsc, "-p", "tsconfig.process-tests.json"], {
    cwd: root,
    stdio: "inherit",
  });
  fs.writeFileSync(path.join(outDir, "package.json"), '{"type":"commonjs"}\n');

  const tests = findTests(path.join(outDir, "tests", "processes"));
  const result = spawnSync(process.execPath, ["--test", ...tests], {
    cwd: root,
    stdio: "inherit",
  });
  exitCode = result.status ?? 1;
} finally {
  fs.rmSync(outDir, { recursive: true, force: true });
}

process.exitCode = exitCode;
