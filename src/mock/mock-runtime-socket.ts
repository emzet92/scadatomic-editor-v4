import {
  parseUiDocument,
  type UiComponentDefinition,
  type UiDocument,
  type UiNode,
} from "../uiframework/core/document";
import { buildNavigationTree } from "../uiframework/navigation/navigation";
import { getMockProjectSnapshot } from "./mock-project-store";
import {
  applyMockRuntimeUiState,
  getMockRuntimeNodeProps,
  getMockRuntimeNodeVariant,
} from "./mock-runtime-ui-state";
import {
  executeMockScript,
  type MockRuntimeComponentScope,
} from "./mock-script-runtime";
import {
  getMockTagStore,
  replaceMockTagStoreData,
} from "./mock-tag-runtime";
import { MockDriverRuntime } from "./mock-driver-runtime";
import { findTagFieldRefByPath } from "../uiframework/data/tags/TagFieldRef";
import { persistTagValueToSession } from "./mock-tag-session-state";

type MockWsPayload = Record<string, unknown>;

const CHANNEL_NAME = "scadatomic.mock.runtime.v2";

class MockRuntimeSocket extends EventTarget {
  readonly readyState = WebSocket.OPEN;

  private readonly channel = createBroadcastChannel();
  private readonly publishedDocuments = new Map<string, UiDocument>();
  private readonly driverRuntime = new MockDriverRuntime();
  private readonly tagEventBridges = new Map<string, () => void>();

  constructor() {
    super();

    if (this.channel) {
      this.channel.addEventListener("message", (event) => {
        this.capturePublishedDocument(event.data);
        this.handleDriverControl(event.data);
        this.dispatchPayload(event.data);
      });
    }
  }

  send(serializedPayload: string) {
    let payload: MockWsPayload;

    try {
      payload = JSON.parse(serializedPayload) as MockWsPayload;
    } catch {
      console.warn("[mock-ws] Ignoring invalid JSON", serializedPayload);
      return;
    }

    this.capturePublishedDocument(payload);
    this.handleOutgoingPayload(payload);
    this.dispatchPayload(payload);
    this.channel?.postMessage(payload);
  }

  private capturePublishedDocument(payload: unknown) {
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      return;
    }

    const message = payload as MockWsPayload;
    if (message.type !== "screen.publish" || typeof message.projectId !== "string") {
      return;
    }

    try {
      const document = structuredClone(parseUiDocument(message.document));
      this.publishedDocuments.set(message.projectId, document);
      const tagStore = replaceMockTagStoreData(message.projectId, document.data);
      this.driverRuntime.configureExisting(message.projectId, document.data);
      this.ensureTagEventBridge(message.projectId, tagStore);
    } catch (error) {
      console.warn("[mock-ws] Ignoring invalid published document", error);
    }
  }

  private getProjectDocument(projectId: string): UiDocument | undefined {
    const document =
      this.publishedDocuments.get(projectId) ??
      getMockProjectSnapshot(projectId)?.tree;

    return document ? applyMockRuntimeUiState(projectId, document) : undefined;
  }

  private handleOutgoingPayload(payload: MockWsPayload) {
    if (this.handleDriverControl(payload)) return;
    if (payload.type !== "runtime.event") {
      return;
    }

    const projectId = payload.projectId;
    const handlerId = payload.handlerId;
    const sourceNodeId = payload.nodeId;
    const eventName = payload.eventName;
    const pageId = typeof payload.pageId === "string" ? payload.pageId : undefined;

    if (
      typeof projectId !== "string" ||
      typeof handlerId !== "string" ||
      typeof sourceNodeId !== "string" ||
      typeof eventName !== "string"
    ) {
      console.warn("[mock-ws] Invalid runtime.event", payload);
      return;
    }

    const projectDocument = this.getProjectDocument(projectId);
    const tagStore = getMockTagStore(projectId, projectDocument?.data);
    this.ensureTagEventBridge(projectId, tagStore);

    executeMockScript(
      {
        projectId,
        handlerId,
        sourceNodeId,
        eventName,
        pageId,
      },
      {
        setNodeProp: (nodeId, property, value) => {
          this.emitMockResponse({
            type: "node.update",
            projectId,
            nodeId,
            property,
            value,
            timestamp: Date.now(),
          });
        },
        getNodeProps: (nodeId) => getMockRuntimeNodeProps(projectId, nodeId),
        setNodeVariant: (nodeId, variantName) => {
          this.emitMockResponse({
            type: "node.variant",
            projectId,
            nodeId,
            variantName,
            timestamp: Date.now(),
          });
        },
        getNodeVariant: (nodeId) =>
          getMockRuntimeNodeVariant(projectId, nodeId),
        resolveUiNode: (name) => {
          const document = this.getProjectDocument(projectId);
          if (!document) return undefined;

          const page = pageId ? document.pages[pageId] : undefined;
          if (!page) {
            return Object.values(document.nodes).find((node) => node.name === name);
          }

          return findNodeByNameInSubtree(document, page.rootId, name);
        },
        resolveComponentDefinition: (componentDefinitionId) => {
          const document = this.getProjectDocument(projectId);
          return document?.components?.[componentDefinitionId];
        },
        resolveComponentScopeForRuntimeNode: (runtimeNodeId) => {
          const document = this.getProjectDocument(projectId);
          return document
            ? resolveComponentScopeForRuntimeNode(document, runtimeNodeId)
            : undefined;
        },
        getTagStore: () => tagStore,
        getNavigationTree: () => {
          const document = this.getProjectDocument(projectId);
          return document ? buildNavigationTree(document) : [];
        },
        navigateTo: (path) => {
          this.emitMockResponse({
            type: "runtime.navigate",
            projectId,
            path,
            timestamp: Date.now(),
          });
        },
        emit: (customEventName, customPayload) => {
          this.emitMockResponse({
            type: "runtime.custom-event",
            projectId,
            sourceNodeId,
            eventName: customEventName,
            payload: customPayload ?? {},
            timestamp: Date.now(),
          });
        },
      }
    );

    console.info("[mock-ws] runtime.event", payload);
  }

  private handleDriverControl(payload: unknown) {
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) return false;
    const message = payload as MockWsPayload;
    if (
      message.type !== "driver.start" &&
      message.type !== "driver.stop" &&
      message.type !== "driver.configure"
    ) return false;
    if (typeof message.projectId !== "string" || typeof message.driver !== "string") {
      return true;
    }

    if (message.type === "driver.stop") {
      this.driverRuntime.stop(message.projectId, message.driver);
      return true;
    }

    const data = message.data && typeof message.data === "object"
      ? (message.data as import("../uiframework/data/tags/TagDefinition").ProjectData)
      : this.getProjectDocument(message.projectId)?.data;

    const tagStore = getMockTagStore(message.projectId, data);
    this.ensureTagEventBridge(message.projectId, tagStore);

    if (message.type === "driver.start") {
      this.driverRuntime.start(message.projectId, message.driver, data);
    } else {
      this.driverRuntime.configure(message.projectId, message.driver, data);
    }
    return true;
  }

  ensureTagEventBridge(
    projectId: string,
    tagStore: ReturnType<typeof getMockTagStore>
  ) {
    if (this.tagEventBridges.has(projectId)) return;

    const unsubscribe = tagStore.subscribe("*", (tagEvent) => {
      const data = tagStore.snapshot();
      const resolved = findTagFieldRefByPath(data, tagEvent.path);
      if (resolved) {
        persistTagValueToSession(projectId, resolved.ref, tagEvent.newValue);
      }

      // Tag changes are the canonical runtime event now. The pre-tag
      // The legacy signal transport and prototype process events are removed.
      this.emitMockResponse({
        ...tagEvent,
        projectId,
        timestamp: Date.now(),
      });
    });
    this.tagEventBridges.set(projectId, unsubscribe);
  }

  private emitMockResponse(payload: MockWsPayload) {
    this.dispatchPayload(payload);
    this.channel?.postMessage(payload);
  }

  private dispatchPayload(payload: unknown) {
    this.dispatchEvent(
      new MessageEvent("message", {
        data: JSON.stringify(payload),
      })
    );
  }
}

function findNodeByNameInSubtree(
  document: UiDocument,
  rootId: string,
  name: string
) {
  const stack = [rootId];
  const visited = new Set<string>();
  let match: UiNode | undefined;

  while (stack.length > 0) {
    const nodeId = stack.pop();
    if (!nodeId || visited.has(nodeId)) continue;
    visited.add(nodeId);

    const node = document.nodes[nodeId];
    if (!node) continue;
    if (node.name === name) {
      if (match && match.id !== node.id) {
        throw new Error(
          `Ambiguous scene component name “${name}”. Names must be unique inside a page scope.`
        );
      }
      match = node;
    }
    stack.push(...(node.children ?? []));
  }

  return match;
}

function resolveComponentScopeForRuntimeNode(
  document: UiDocument,
  runtimeNodeId: string
): MockRuntimeComponentScope | undefined {
  const parts = runtimeNodeId.split("::").filter(Boolean);
  if (parts.length < 2) return undefined;

  let instance = document.nodes[parts[0]!];
  if (instance?.type !== "ComponentInstance" || !instance.componentDefinitionId) {
    return undefined;
  }

  let definition: UiComponentDefinition | undefined =
    document.components?.[instance.componentDefinitionId];
  if (!definition) return undefined;

  const runtimeInstanceParts = [instance.id];

  // The last segment is the source runtime node. Every preceding segment after
  // the page-level instance must therefore be a nested ComponentInstance.
  for (const localNodeId of parts.slice(1, -1)) {
    const nestedInstance: UiNode | undefined = definition.nodes[localNodeId];
    if (
      nestedInstance?.type !== "ComponentInstance" ||
      !nestedInstance.componentDefinitionId
    ) {
      return undefined;
    }

    const nestedDefinition: UiComponentDefinition | undefined =
      document.components?.[nestedInstance.componentDefinitionId];
    if (!nestedDefinition) return undefined;

    instance = nestedInstance;
    definition = nestedDefinition;
    runtimeInstanceParts.push(nestedInstance.id);
  }

  return {
    instance,
    definition,
    runtimeInstanceId: runtimeInstanceParts.join("::"),
  };
}

let socket: MockRuntimeSocket | null = null;

export function getMockRuntimeSocket() {
  socket ??= new MockRuntimeSocket();
  return socket;
}

export function ensureMockTagRuntimeBridge(
  projectId: string,
  data?: import("../uiframework/data/tags/TagDefinition").ProjectData
) {
  const runtimeSocket = getMockRuntimeSocket();
  const tagStore = getMockTagStore(projectId, data);
  runtimeSocket.ensureTagEventBridge(projectId, tagStore);
  return tagStore;
}

export function sendMockWsMessage(payload: unknown) {
  getMockRuntimeSocket().send(JSON.stringify(payload));
}

function createBroadcastChannel() {
  if (!("BroadcastChannel" in window)) {
    return null;
  }

  return new BroadcastChannel(CHANNEL_NAME);
}
