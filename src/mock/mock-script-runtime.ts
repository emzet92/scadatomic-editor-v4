import {
  Executor,
  ExecutionPlanner,
  IntentCollector,
  publishExecutionPlan,
  publishExecutionTrace,
  type IntentSource,
} from "../execution";
import { getMockScript } from "./mock-script-store";
import {
  createComponentApi,
  createInputsApi,
  createInternalUiApi,
} from "./script-runtime/component-api";
import { createScriptContext } from "./script-runtime/context-factory";
import { createTagGlobals } from "./script-runtime/tag-api";
import { executeJavaScriptSource } from "./script-runtime/javascript-executor";
import {
  createMockRuntimeEffects,
  validateMockRuntimeIntent,
} from "./script-runtime/runtime-effects-adapter";
import type {
  MockScriptEvent,
  MockScriptExecutionEnvironment,
  MockScriptHost,
  UiComponentScriptApi,
} from "./script-runtime/types";

export type {
  MockRuntimeComponentScope,
  MockScriptContext,
  MockScriptEvent,
  MockScriptHost,
  MockScriptAppApi,
  MockScriptInputsApi,
  MockScriptInternalApi,
  MockScriptNavigationApi,
  MockScriptNavigationNodeApi,
  MockScriptUiApi,
  UiComponentScriptApi,
  UiComponentVariantScriptApi,
} from "./script-runtime/types";

/**
 * Handler orchestration only.
 *
 * JavaScript computes decisions and collects intents. Side effects are committed
 * only after planning, through Executor -> RuntimeEffects.
 */
export function executeMockScript(
  event: MockScriptEvent,
  host: MockScriptHost
): void {
  const script = getMockScript(event.projectId, event.handlerId);
  const collector = new IntentCollector();
  const source: IntentSource = {
    projectId: event.projectId,
    handlerId: event.handlerId,
    scriptId: event.handlerId,
    sourceNodeId: event.sourceNodeId,
    eventName: event.eventName,
  };
  const environment: MockScriptExecutionEnvironment = { collector, source };
  const ownerScope = host.resolveComponentScopeForRuntimeNode(event.sourceNodeId);
  const selfRef: { current: UiComponentScriptApi | undefined } = {
    current: undefined,
  };
  const ctx = createScriptContext(event, host, environment, () =>
    ownerScope && selfRef.current
      ? createInputsApi(ownerScope.definition, selfRef.current)
      : undefined
  );
  const self = ownerScope
    ? createComponentApi(
        ownerScope.instance,
        host,
        event.projectId,
        () => ctx,
        environment,
        {
          runtimeNodeId: ownerScope.runtimeInstanceId,
          includePrivateMethods: true,
        }
      )
    : undefined;
  selfRef.current = self;
  const internal = ownerScope
    ? createInternalUiApi(
        ownerScope.definition,
        ownerScope.runtimeInstanceId,
        host,
        event.projectId,
        () => ctx,
        environment
      )
    : undefined;

  try {
    executeJavaScriptSource({
      code: script.code,
      ctx,
      self,
      internal,
      args: [],
      globals: createTagGlobals(host, ctx, environment),
      sourceUrl: `scadatomic://${encodeURIComponent(event.projectId)}/scripts/${encodeURIComponent(event.handlerId)}.js`,
    });
  } catch (error) {
    collector.discard();
    console.error(`[mock-script-runtime] Handler ${event.handlerId} failed`, error);
    host.emit("script.error", {
      handlerId: event.handlerId,
      sourceNodeId: event.sourceNodeId,
      message: error instanceof Error ? error.message : String(error),
    });
    return;
  }

  const intents = collector.takeIntents();
  let graph;
  try {
    graph = new ExecutionPlanner().plan(intents, {
      source,
      validateIntent: (intent) => validateMockRuntimeIntent(intent, host),
    });
  } catch (error) {
    console.error(
      `[mock-script-runtime] Handler ${event.handlerId} planning failed`,
      error
    );
    host.emit("execution.planning-error", {
      handlerId: event.handlerId,
      sourceNodeId: event.sourceNodeId,
      message: error instanceof Error ? error.message : String(error),
    });
    return;
  }

  const execution = {
    executionId: graph.executionId,
    projectId: event.projectId,
    handlerId: event.handlerId,
    eventName: event.eventName,
    sourceNodeId: event.sourceNodeId,
    scriptId: event.handlerId,
    intents,
    graph,
    createdAt: Date.now(),
  };

  publishExecutionPlan(execution);
  publishExecutionTrace(execution);
  void new Executor()
    .execute(graph, createMockRuntimeEffects(event, host))
    .then((result) => {
      publishExecutionTrace({ ...execution, result });
      if (result.status !== "success") {
        host.emit("execution.error", {
          handlerId: event.handlerId,
          sourceNodeId: event.sourceNodeId,
          executionId: graph.executionId,
          status: result.status,
        });
      }
    })
    .catch((error) => {
      console.error(`[mock-script-runtime] Execution ${graph.executionId} failed`, error);
      host.emit("execution.error", {
        handlerId: event.handlerId,
        sourceNodeId: event.sourceNodeId,
        executionId: graph.executionId,
        message: error instanceof Error ? error.message : String(error),
      });
    });
}
