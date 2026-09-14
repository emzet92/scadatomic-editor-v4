import type { Intent, RuntimeEffects } from "../../execution";
import { TypeRegistry } from "../../uiframework/data/types/TypeRegistry";
import {
  clearMockSessionState,
  deleteMockSessionValue,
  setMockSessionValue,
} from "../mock-session-state";
import type { MockScriptEvent, MockScriptHost } from "./types";
import { closeProjectModal, openProjectModal } from "../../uiframework/modal-runtime-state";

/** Compatibility adapter: Executor is the only caller of these legacy effects. */
export function createMockRuntimeEffects(
  event: MockScriptEvent,
  host: MockScriptHost
): RuntimeEffects {
  return {
    setValue(target, value) {
      const tagRuntime = host.getTagRuntime();
      if (!tagRuntime) throw new Error(`Tag runtime is unavailable for ${target.path}.`);
      const owner = tagRuntime.listTags().find((tag) => tag.id === target.id);
      if (!owner) throw new Error(`Tag ${target.id} no longer exists (${target.path}).`);
      const result = tagRuntime.write(target.path, value, { kind: "script" });
      if (!result.ok) throw new TypeError(result.error);
    },
    setProperty(target, value) {
      host.setNodeProp(target.componentId, target.property, value);
    },
    setVariant(target, variantName) {
      host.setNodeVariant(target.componentId, variantName);
    },
    emitEvent(intentEvent, payload) {
      host.emit(intentEvent.eventName, payload);
    },
    openModal(target, payload) {
      openProjectModal(event.projectId, target.modalId, payload);
    },
    closeModal(target, payload) {
      closeProjectModal(event.projectId, target.modalId, payload);
    },
    navigate(path) {
      host.navigateTo(path);
    },
    setState(key, value) {
      setMockSessionValue(event.projectId, key, value);
    },
    deleteState(key) {
      deleteMockSessionValue(event.projectId, key);
    },
    clearState() {
      clearMockSessionState(event.projectId);
    },
    callMethod(target) {
      throw new Error(
        `Deferred runtime method execution is not registered: ${target.path ?? target.ownerId}.${target.method}`
      );
    },
  };
}

export function validateMockRuntimeIntent(intent: Intent, host: MockScriptHost): void {
  if (intent.type !== "set-value") return;
  const tagRuntime = host.getTagRuntime();
  if (!tagRuntime) throw new TypeError(`Tag runtime is unavailable for ${intent.target.path}.`);
  const resolved = tagRuntime.store.resolve(intent.target.path);
  if (!resolved) throw new TypeError(`Unknown tag path: ${intent.target.path}`);
  if (resolved.tag.id !== intent.target.id) {
    throw new TypeError(`Tag reference changed before execution: ${intent.target.path}.`);
  }
  if (resolved.type.kind === "udt") {
    throw new TypeError(`Cannot assign an entire UDT value: ${intent.target.path}`);
  }
  if (!TypeRegistry.validate(resolved.type, intent.value)) {
    throw new TypeError(
      `Invalid ${TypeRegistry.getDisplayName(resolved.type)} value for ${intent.target.path}.`
    );
  }
}
