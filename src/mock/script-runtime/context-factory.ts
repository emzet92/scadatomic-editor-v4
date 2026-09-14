import { createTagRuntimeProxy } from "../../uiframework/data/runtime/TagRuntimeProxy";
import { createIntentId, shadowKey } from "../../execution";
import { getMockSessionValue } from "../mock-session-state";
import { createUiApi } from "./component-api";
import { createNavigationApi } from "./navigation-api";
import { createTagRuntimeContext } from "./tag-api";
import type {
  MockScriptContext,
  MockScriptEvent,
  MockScriptExecutionEnvironment,
  MockScriptHost,
  MockScriptInputsApi,
} from "./types";

export function createScriptContext(
  event: MockScriptEvent,
  host: MockScriptHost,
  environment: MockScriptExecutionEnvironment,
  getInputs?: () => MockScriptInputsApi | undefined
): MockScriptContext {
  const ui = createUiApi(host, event.projectId, () => ctx, environment);
  const nav = createNavigationApi(host, environment);
  const tagRuntime = host.getTagRuntime();
  const contextRef: { current?: MockScriptContext } = {};
  const stateWrites = new Map<string, { deleted: boolean; value?: unknown }>();
  let stateCleared = false;
  const tags = tagRuntime
    ? createTagRuntimeProxy(tagRuntime, createTagRuntimeContext(environment, () => contextRef.current))
    : undefined;

  const ctx: MockScriptContext = Object.freeze({
    projectId: event.projectId,
    handlerId: event.handlerId,
    sourceNodeId: event.sourceNodeId,
    eventName: event.eventName,
    payload: Object.freeze({ ...(event.payload ?? {}) }),
    get inputs() {
      return getInputs?.();
    },
    state: Object.freeze({
      get<T>(key: string, fallback?: T) {
        const local = stateWrites.get(key);
        if (local) return local.deleted ? fallback : local.value;
        if (stateCleared) return fallback;
        return getMockSessionValue(event.projectId, key, fallback);
      },
      set(key: string, value: unknown) {
        stateWrites.set(key, { deleted: false, value });
        environment.collector.setShadow(shadowKey.state(event.projectId, key), value);
        environment.collector.push({
          id: createIntentId(),
          type: "state-set",
          source: environment.source,
          key,
          value,
        });
      },
      delete(key: string) {
        stateWrites.set(key, { deleted: true });
        environment.collector.deleteShadow(shadowKey.state(event.projectId, key));
        environment.collector.push({
          id: createIntentId(),
          type: "state-delete",
          source: environment.source,
          key,
        });
      },
      clear() {
        stateCleared = true;
        stateWrites.clear();
        environment.collector.clearShadow(`state:${event.projectId}:`);
        environment.collector.push({
          id: createIntentId(),
          type: "state-clear",
          source: environment.source,
        });
      },
    }),
    ui,
    nav,
    ...(tags ? { tags } : {}),
    navigateTo(path: string) {
      environment.collector.push({
        id: createIntentId(),
        type: "navigate",
        source: environment.source,
        path,
      });
    },
    emit(eventName: string, payload?: Record<string, unknown>) {
      environment.collector.push({
        id: createIntentId(),
        type: "emit-event",
        source: environment.source,
        event: {
          kind: "event",
          ownerId: event.sourceNodeId,
          eventName,
        },
        ...(payload ? { payload } : {}),
      });
    },
    random: Object.freeze({
      color: randomColor,
      number(min = 0, max = 1) {
        const low = Math.min(min, max);
        const high = Math.max(min, max);
        return low + Math.random() * (high - low);
      },
    }),
    log(...args: unknown[]) {
      console.log(`[script:${event.handlerId}]`, ...args);
    },
  });
  contextRef.current = ctx;

  return ctx;
}

function randomColor() {
  const value = Math.floor(Math.random() * 0x1000000);
  return `#${value.toString(16).padStart(6, "0")}`;
}
