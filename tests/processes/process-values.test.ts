import assert from "node:assert/strict";
import { test } from "node:test";
import { normalizeProcessProgress, resolveProcessObjectState } from "../../src/processes/domain/process-values";

test("progress binding normalizes and clamps raw values", () => {
  const binding = { tagPath: "Line.Position", inputMin: 20, inputMax: 120 };
  assert.equal(normalizeProcessProgress(20, binding), 0);
  assert.equal(normalizeProcessProgress(70, binding), 0.5);
  assert.equal(normalizeProcessProgress(200, binding), 1);
  assert.equal(normalizeProcessProgress("70", binding), undefined);
});

test("state binding supports semantic values and explicit PLC mappings", () => {
  assert.equal(resolveProcessObjectState("inspection", { tagPath: "State" }), "inspection");
  assert.equal(resolveProcessObjectState("NOK", {
    tagPath: "State",
    mapping: { NOK: "rejected" },
  }), "rejected");
  assert.equal(resolveProcessObjectState("unknown", { tagPath: "State" }), undefined);
});
