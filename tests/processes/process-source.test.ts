import assert from "node:assert/strict";
import { test } from "node:test";
import {
  exactProcessSource,
  processSourceMatchesChange,
  projectDefaultProcessSource,
  resolveProcessSource,
  type ProcessDefinitionReader,
} from "../../src/processes/application/ProcessSource";
import { createProcessDefinition, type ProcessDefinition } from "../../src/processes/domain/process-definition";

function definition(id: string, projectId: string): ProcessDefinition {
  return createProcessDefinition({
    id,
    projectId,
    name: id,
    path: { id: `${id}-path`, name: id, points: [] },
    scene: { zones: [], sensors: [] },
    playback: { durationSeconds: 1, loopMode: "loop" },
    bindings: {},
  });
}

test("exact source never falls back to the project default", async () => {
  const fallback = definition("latest", "demo");
  const reader: ProcessDefinitionReader = {
    async get() { return null; },
    async getDefault() { return fallback; },
  };

  const resolved = await resolveProcessSource(reader, exactProcessSource("missing"));
  assert.equal(resolved, null);
});

test("project-default source resolves the current project default", async () => {
  const latest = definition("latest", "demo");
  const reader: ProcessDefinitionReader = {
    async get() { throw new Error("exact lookup must not be used"); },
    async getDefault(projectId) {
      assert.equal(projectId, "demo");
      return latest;
    },
  };

  const resolved = await resolveProcessSource(reader, projectDefaultProcessSource("demo"));
  assert.equal(resolved?.id, "latest");
});

test("change invalidation follows the explicit lookup policy", () => {
  const exact = exactProcessSource("process-a");
  assert.equal(processSourceMatchesChange(exact, { processId: "process-a", projectId: "demo" }), true);
  assert.equal(processSourceMatchesChange(exact, { processId: "process-b", projectId: "demo" }), false);

  const projectDefault = projectDefaultProcessSource("demo");
  assert.equal(processSourceMatchesChange(projectDefault, { processId: "process-b", projectId: "demo" }), true);
  assert.equal(processSourceMatchesChange(projectDefault, { processId: "process-b", projectId: "other" }), false);
});
