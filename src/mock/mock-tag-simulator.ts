import type { TagStore } from "../uiframework/data/tags/TagStore";

type NumericSimulationState = {
  baseline: number;
  lastSimulated: number | undefined;
};

/**
 * Lightweight type-aware simulator for project tags.
 *
 * It deliberately knows nothing about PLC/device protocols. It only produces
 * candidate values and writes them through TagStore.set(), so the exact same
 * validation/event/subscription pipeline is exercised as with user scripts.
 */
export class BasicMockTagSimulator {
  private readonly tickByProject = new Map<string, number>();
  private readonly numericState = new Map<string, NumericSimulationState>();

  tick(projectId: string, tagStore: TagStore) {
    const tick = (this.tickByProject.get(projectId) ?? 0) + 1;
    this.tickByProject.set(projectId, tick);

    for (const entry of tagStore.listPrimitivePaths()) {
      if (entry.type.kind === "string") continue;

      if (entry.type.kind === "bool") {
        // Stagger boolean transitions so every bool does not flip together.
        const cadence = 9 + (stableHash(entry.path) % 5);
        if ((tick + stableHash(entry.path)) % cadence !== 0) continue;
        tagStore.set(entry.path, entry.value !== true);
        continue;
      }

      const current = typeof entry.value === "number" ? entry.value : 0;
      const stateKey = `${projectId}:${entry.path}`;
      const existing = this.numericState.get(stateKey);
      const state = existing ?? {
        baseline: current,
        lastSimulated: undefined,
      };

      // If a script/user changed the tag since our previous tick, treat that
      // value as the new operating point instead of immediately snapping back.
      if (
        state.lastSimulated !== undefined &&
        !Object.is(current, state.lastSimulated)
      ) {
        state.baseline = current;
      }

      const amplitude = Math.max(
        2,
        Math.min(120, Math.round(Math.max(Math.abs(state.baseline), 25) * 0.08))
      );
      const phase = (stableHash(entry.path) % 31) / 7;
      const wave = Math.sin(tick * 0.42 + phase);
      const next = Math.round(state.baseline + wave * amplitude);

      state.lastSimulated = next;
      this.numericState.set(stateKey, state);
      tagStore.set(entry.path, next);
    }
  }
}

function stableHash(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}
