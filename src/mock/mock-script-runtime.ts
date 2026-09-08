import { getMockScript } from "./mock-script-store";

export type MockScriptEvent = {
  projectId: string;
  handlerId: string;
  sourceNodeId: string;
  eventName: string;
  payload?: Record<string, unknown> | undefined;
};

export type MockScriptHost = {
  setNodeProp(nodeId: string, property: string, value: unknown): void;
  emit(eventName: string, payload?: Record<string, unknown>): void;
};

export type MockScriptContext = {
  projectId: string;
  handlerId: string;
  sourceNodeId: string;
  eventName: string;
  payload: Record<string, unknown>;
  ui: {
    setProp(nodeId: string, property: string, value: unknown): void;
    setColor(nodeId: string, color: string): void;
  };
  emit(eventName: string, payload?: Record<string, unknown>): void;
  random: {
    color(): string;
    number(min?: number, max?: number): number;
  };
  log(...args: unknown[]): void;
};

/**
 * Prototype-only JavaScript execution.
 *
 * This deliberately executes trusted local developer code with new Function.
 * It is not a sandbox and must not be used for untrusted production scripts.
 */
export function executeMockScript(
  event: MockScriptEvent,
  host: MockScriptHost
): void {
  const script = getMockScript(event.projectId, event.handlerId);
  const ctx = createContext(event, host);

  try {
    const execute = new Function(
      "ctx",
      `"use strict";\n${script.code}\n//# sourceURL=scadatomic://${encodeURIComponent(event.projectId)}/scripts/${encodeURIComponent(event.handlerId)}.js`
    ) as (context: MockScriptContext) => unknown;

    execute(ctx);
  } catch (error) {
    console.error(
      `[mock-script-runtime] Handler ${event.handlerId} failed`,
      error
    );

    host.emit("script.error", {
      handlerId: event.handlerId,
      sourceNodeId: event.sourceNodeId,
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

function createContext(
  event: MockScriptEvent,
  host: MockScriptHost
): MockScriptContext {
  return Object.freeze({
    projectId: event.projectId,
    handlerId: event.handlerId,
    sourceNodeId: event.sourceNodeId,
    eventName: event.eventName,
    payload: Object.freeze({ ...(event.payload ?? {}) }),
    ui: Object.freeze({
      setProp(nodeId: string, property: string, value: unknown) {
        host.setNodeProp(nodeId, property, value);
      },
      setColor(nodeId: string, color: string) {
        host.setNodeProp(nodeId, "backgroundColor", color);
      },
    }),
    emit(eventName: string, payload?: Record<string, unknown>) {
      host.emit(eventName, payload);
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
}

function randomColor() {
  const value = Math.floor(Math.random() * 0x1000000);
  return `#${value.toString(16).padStart(6, "0")}`;
}
