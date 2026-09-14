import { createIntentId } from "../../execution";
import type { UiModal } from "../../uiframework/core/document";
import type {
  MockScriptExecutionEnvironment,
  MockScriptModalApi,
  MockScriptModalsApi,
} from "./types";

export function createModalApi(
  modals: UiModal[],
  environment: MockScriptExecutionEnvironment
): MockScriptModalsApi {
  const target: Record<string, MockScriptModalApi> = {};

  for (const modal of modals) {
    target[modal.name] = Object.freeze({
      open(payload?: Record<string, unknown>) {
        environment.collector.push({
          id: createIntentId(),
          type: "modal-open",
          source: environment.source,
          target: { kind: "modal", modalId: modal.id, name: modal.name },
          ...(payload ? { payload } : {}),
        });
      },
      close(payload?: Record<string, unknown>) {
        environment.collector.push({
          id: createIntentId(),
          type: "modal-close",
          source: environment.source,
          target: { kind: "modal", modalId: modal.id, name: modal.name },
          ...(payload ? { payload } : {}),
        });
      },
    });
  }

  return new Proxy(Object.freeze(target), {
    get(current, property) {
      if (typeof property !== "string") return undefined;
      const value = current[property];
      if (!value) throw new Error(`Unknown modal: ${property}`);
      return value;
    },
  });
}
