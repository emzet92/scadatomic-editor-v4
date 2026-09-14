import { createTagRuntimeGlobals } from "../../uiframework/data/runtime/TagRuntimeProxy";
import { createIntentId, shadowKey } from "../../execution";
import type {
  MockScriptContext,
  MockScriptExecutionEnvironment,
  MockScriptHost,
} from "./types";

export function createTagGlobals(
  host: MockScriptHost,
  ctx: MockScriptContext,
  environment: MockScriptExecutionEnvironment
) {
  const tagRuntime = host.getTagRuntime();
  return tagRuntime
    ? createTagRuntimeGlobals(
        tagRuntime,
        createTagRuntimeContext(environment, () => ctx)
      )
    : {};
}

export function createTagRuntimeContext(
  environment: MockScriptExecutionEnvironment,
  getContext: () => MockScriptContext | undefined
) {
  return {
    writeSource: { kind: "script" } as const,
    log: (...values: unknown[]) => getContext()?.log(...values),
    emit: (eventName: string, payload?: Record<string, unknown>) =>
      getContext()?.emit(eventName, payload),
    readValue: (path: string, fallback: () => unknown) =>
      environment.collector.readShadow(shadowKey.tag(path), fallback),
    writeValue: (path: string, tagId: string, value: unknown) => {
      environment.collector.setShadow(shadowKey.tag(path), value);
      environment.collector.push({
        id: createIntentId(),
        type: "set-value",
        source: environment.source,
        target: {
          kind: "tag",
          id: tagId,
          path,
        },
        value,
      });
    },
    callMethod: (path: string, tagId: string, methodName: string, args: unknown[]) => {
      environment.collector.push({
        id: createIntentId(),
        type: "call-method",
        source: environment.source,
        target: {
          kind: "method",
          ownerId: tagId,
          method: methodName,
          path,
        },
        args,
        expanded: true,
      });
    },
  };
}

