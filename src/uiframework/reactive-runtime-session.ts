import {
  BindingRuntime,
  type BindingTargetRuntime,
  type RuntimePropertyBinding,
  type ReactiveEventHandlerBinding,
  type ReactiveChange,
  type ReactivePropertyBinding,
  type TagReactiveRef,
  toReactiveKey,
} from "../reactivity";
import { getMockRuntimeSession } from "../mock/mock-tag-runtime";
import type { Binding, UiComponentDefinition, UiDocument, UiNode } from "./core/document";
import {
  applyComponentInstanceInputs,
  getComponentDefinitionForInstance,
} from "./reusable-components";
import { sendRuntimeEvent } from "./components/runtime-helpers";
import { resolveTagCollection } from "./data/collections/TagCollectionSource";
import { createTagRef } from "./data/collections/TagRef";
import { createRepeatInstanceId, parseRepeatInstanceId } from "./repeat/RepeatRuntime";
import {
  clearProjectReactiveUiState,
  clearReactiveNodeProperty,
  clearReactiveNodeVariant,
  setReactiveNodeProperty,
  setReactiveNodeVariant,
} from "./reactive-ui-state";

class ProjectReactiveUiSession {
  private readonly projectId: string;
  private bindingRuntime: BindingRuntime | undefined;
  private unsubscribeEvents: (() => void) | undefined;

  constructor(projectId: string) {
    this.projectId = projectId;
  }

  configure(document: UiDocument) {
    this.disposeRuntimeOnly();

    const projectRuntime = getMockRuntimeSession(this.projectId, document.data);
    const target = createBindingTarget(this.projectId, document);
    const bindingRuntime = new BindingRuntime(projectRuntime.reactive, target);
    this.bindingRuntime = bindingRuntime;

    for (const runtimeBinding of collectRuntimeBindings(
      document,
      projectRuntime.tags.toReactiveRef.bind(projectRuntime.tags)
    )) {
      bindingRuntime.register(runtimeBinding);
    }

    // Initial evaluation happens during register(). No tag change is required.
    this.unsubscribeEvents = projectRuntime.reactive.subscribeAll((change) => {
      this.dispatchReactiveHandlers(change, document.reactiveEvents ?? {});
    });
  }

  dispose() {
    this.disposeRuntimeOnly();
    clearProjectReactiveUiState(this.projectId);
  }

  private disposeRuntimeOnly() {
    this.bindingRuntime?.dispose();
    this.bindingRuntime = undefined;
    this.unsubscribeEvents?.();
    this.unsubscribeEvents = undefined;
  }

  private dispatchReactiveHandlers(
    change: ReactiveChange,
    handlers: Record<string, ReactiveEventHandlerBinding>
  ) {
    const changedKey = toReactiveKey(change.ref);
    for (const handler of Object.values(handlers)) {
      if (handler.enabled === false || toReactiveKey(handler.ref) !== changedKey) continue;
      if (!matchesEvent(handler.event, change.previousValue, change.value)) continue;

      sendRuntimeEvent({
        handlerId: handler.handlerId,
        eventName: `reactive.${handler.event}`,
        nodeId: `reactive:${handler.id}`,
        projectId: this.projectId,
        payload: {
          previousValue: change.previousValue,
          value: change.value,
          reactiveKey: changedKey,
          path: change.ref.kind === "tag" ? change.ref.path : undefined,
        },
      });
    }
  }
}

const sessions = new Map<string, ProjectReactiveUiSession>();

export function configureProjectReactiveRuntime(
  projectId: string,
  document: UiDocument
) {
  let session = sessions.get(projectId);
  if (!session) {
    session = new ProjectReactiveUiSession(projectId);
    sessions.set(projectId, session);
  }
  session.configure(document);
  return () => {
    if (sessions.get(projectId) !== session) return;
    session?.dispose();
    sessions.delete(projectId);
  };
}

function collectRuntimeBindings(
  document: UiDocument,
  resolveLegacyTag: (path: string) => TagReactiveRef | undefined
): RuntimePropertyBinding[] {
  const output: RuntimePropertyBinding[] = [];

  for (const node of Object.values(document.nodes)) {
    collectNodeBindings(node, node.id, resolveLegacyTag, output);
    if (node.type === "ComponentInstance") {
      collectComponentInstanceBindings(
        document,
        node,
        node.id,
        resolveLegacyTag,
        output,
        new Set<string>()
      );
    }
    collectRepeatContainerBindings(
      document,
      node,
      undefined,
      resolveLegacyTag,
      output,
      new Set<string>()
    );
  }

  return output;
}

function collectNodeBindings(
  node: UiNode,
  runtimeNodeId: string,
  resolveLegacyTag: (path: string) => TagReactiveRef | undefined,
  output: RuntimePropertyBinding[]
) {
  for (const [property, persisted] of Object.entries(node.bindings ?? {})) {
    const reactiveBinding = normalizeBinding(persisted, resolveLegacyTag);
    if (!reactiveBinding) continue;
    output.push({
      ...reactiveBinding,
      // The persisted id identifies the binding definition. Runtime scoped
      // instances need a distinct id so two Pump instances do not share cache.
      id: `${runtimeNodeId}:${property}:${reactiveBinding.id}`,
      target: { componentId: runtimeNodeId, property },
    });
  }
}

function collectComponentInstanceBindings(
  document: UiDocument,
  instance: UiNode,
  runtimeInstanceId: string,
  resolveLegacyTag: (path: string) => TagReactiveRef | undefined,
  output: RuntimePropertyBinding[],
  definitionStack: Set<string>
) {
  const definition = getComponentDefinitionForInstance(document, instance);
  if (!definition || definitionStack.has(definition.id)) return;

  const nextStack = new Set(definitionStack);
  nextStack.add(definition.id);
  const componentDocument = applyComponentInstanceInputs(document, definition, instance);

  for (const internalNode of Object.values(componentDocument.nodes)) {
    const runtimeNodeId = `${runtimeInstanceId}::${internalNode.id}`;
    collectNodeBindings(internalNode, runtimeNodeId, resolveLegacyTag, output);

    if (internalNode.type === "ComponentInstance") {
      collectComponentInstanceBindings(
        componentDocument,
        internalNode,
        runtimeNodeId,
        resolveLegacyTag,
        output,
        nextStack
      );
    }
    collectRepeatContainerBindings(
      componentDocument,
      internalNode,
      runtimeInstanceId,
      resolveLegacyTag,
      output,
      nextStack
    );
  }
}

function collectRepeatContainerBindings(
  document: UiDocument,
  container: UiNode,
  runtimeScopePrefix: string | undefined,
  resolveLegacyTag: (path: string) => TagReactiveRef | undefined,
  output: RuntimePropertyBinding[],
  definitionStack: Set<string>
) {
  const behavior = container.contentBehavior;
  if (container.type !== "Container" || behavior?.kind !== "repeat") return;

  const definition = document.components?.[behavior.template.componentDefinitionId];
  if (!definition || definitionStack.has(definition.id)) return;
  const input = definition.inputs?.[behavior.template.inputName];
  if (!input || input.type !== "tagRef" || input.udtId !== behavior.source.udtId) return;

  for (const ref of resolveTagCollection(document.data, behavior.source)) {
    const tag = document.data?.tags[ref.tagId];
    if (!tag) continue;
    const tagRef = createTagRef(tag);
    if (!tagRef) continue;

    // Keep this id algorithm identical to Renderer.renderRepeatedChildren().
    const syntheticId = createRepeatInstanceId(container.id, ref.tagId, definition.id);
    const runtimeInstanceId = runtimeScopePrefix
      ? `${runtimeScopePrefix}::${syntheticId}`
      : syntheticId;
    const syntheticNode: UiNode = {
      id: syntheticId,
      name: `${definition.name}_${tag.name}`,
      type: "ComponentInstance",
      componentDefinitionId: definition.id,
      props: { [behavior.template.inputName]: tagRef },
    };
    const syntheticDocument: UiDocument = {
      ...document,
      nodes: { ...document.nodes, [syntheticId]: syntheticNode },
    };

    collectComponentInstanceBindings(
      syntheticDocument,
      syntheticNode,
      runtimeInstanceId,
      resolveLegacyTag,
      output,
      definitionStack
    );
  }
}

function normalizeBinding(
  binding: Binding,
  resolveLegacyTag: (path: string) => TagReactiveRef | undefined
): ReactivePropertyBinding | undefined {
  if (binding.kind === "reactive") return binding;
  if (binding.kind === "tag") {
    const ref = resolveLegacyTag(binding.path);
    if (!ref) return undefined;
    return {
      kind: "reactive",
      id: `legacy:${toReactiveKey(ref)}`,
      dependencies: [ref],
      expression: { type: "ref", ref },
      enabled: true,
    };
  }
  // Relative TagRef bindings are resolved into absolute tag bindings while a
  // reusable component instance is materialized. They remain a compatibility
  // path until reactive bindings are made instance-scope aware.
  return undefined;
}

function createBindingTarget(
  projectId: string,
  document: UiDocument
): BindingTargetRuntime {
  return {
    apply(binding, value) {
      validateTarget(document, binding, value);
      if (binding.target.property === "$variant") {
        setReactiveNodeVariant(projectId, binding.target.componentId, String(value));
        return;
      }
      setReactiveNodeProperty(
        projectId,
        binding.target.componentId,
        binding.target.property,
        value
      );
    },
    clear(binding) {
      if (binding.target.property === "$variant") {
        clearReactiveNodeVariant(projectId, binding.target.componentId);
      } else {
        clearReactiveNodeProperty(
          projectId,
          binding.target.componentId,
          binding.target.property
        );
      }
    },
    validate(binding, value) {
      validateTarget(document, binding, value);
    },
  };
}

function validateTarget(
  document: UiDocument,
  binding: RuntimePropertyBinding,
  value: unknown
) {
  const node = findRuntimeTargetNode(document, binding.target.componentId);
  if (!node) throw new Error(`Binding target ${binding.target.componentId} no longer exists.`);

  if (binding.target.property === "$variant") {
    if (typeof value !== "string" || !node.variants?.[value]) {
      throw new TypeError(`Unknown variant ${String(value)} for ${node.name}.`);
    }
    return;
  }

  if (binding.target.property === "visible" || binding.target.property === "enabled") {
    if (typeof value !== "boolean") {
      throw new TypeError(`${binding.target.property} binding must evaluate to boolean.`);
    }
  }
}

function findRuntimeTargetNode(document: UiDocument, nodeId: string): UiNode | undefined {
  const direct = document.nodes[nodeId];
  if (direct) return direct;

  const parts = nodeId.split("::").filter(Boolean);
  if (parts.length < 2) return undefined;

  let definition = resolveRuntimeScopeDefinition(document, parts[0]!);
  if (!definition) return undefined;

  for (let index = 1; index < parts.length; index += 1) {
    const segment = parts[index]!;
    const isLast = index === parts.length - 1;

    const repeatedDefinition = resolveRepeatDefinition(document, segment);
    if (repeatedDefinition) {
      if (isLast) return undefined;
      definition = repeatedDefinition;
      continue;
    }

    const nested: UiNode | undefined = definition.nodes[segment];
    if (!nested) return undefined;
    if (isLast) return nested;
    if (nested.type !== "ComponentInstance" || !nested.componentDefinitionId) {
      return undefined;
    }
    const nestedDefinition: UiComponentDefinition | undefined =
      document.components?.[nested.componentDefinitionId];
    if (!nestedDefinition) return undefined;
    definition = nestedDefinition;
  }

  return undefined;
}

function resolveRuntimeScopeDefinition(
  document: UiDocument,
  segment: string
): UiComponentDefinition | undefined {
  const repeated = resolveRepeatDefinition(document, segment);
  if (repeated) return repeated;

  const instance = document.nodes[segment];
  if (instance?.type !== "ComponentInstance" || !instance.componentDefinitionId) {
    return undefined;
  }
  return document.components?.[instance.componentDefinitionId];
}

function resolveRepeatDefinition(
  document: UiDocument,
  segment: string
): UiComponentDefinition | undefined {
  const repeat = parseRepeatInstanceId(segment);
  return repeat ? document.components?.[repeat.componentDefinitionId] : undefined;
}

function matchesEvent(
  event: ReactiveEventHandlerBinding["event"],
  previousValue: unknown,
  value: unknown
) {
  if (event === "value-changed") return !Object.is(previousValue, value);
  if (event === "rising-edge") return previousValue === false && value === true;
  return previousValue === true && value === false;
}
