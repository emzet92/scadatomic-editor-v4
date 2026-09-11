import {
  parseUiDocument,
  type UiComponentDefinition,
  type UiDocument,
  type UiNode,
} from "../uiframework/core/document";
import { buildNavigationTree } from "../uiframework/navigation/navigation";
import { getPageLayout } from "../uiframework/core/page-layouts";
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
  configureMockRuntimeProjectData,
  getMockRuntimeSession,
  getMockTagStore,
  hasMockRuntimeSession,
  replaceMockTagStoreData,
} from "./mock-tag-runtime";
import { MockDriverRuntime } from "./mock-driver-runtime";
import { findTagFieldRefByPath } from "../uiframework/data/tags/TagFieldRef";
import type { ProjectData } from "../uiframework/data/tags/TagDefinition";
import type { TagWriteSource } from "../uiframework/data/tags/TagEvents";
import { TagRuntime } from "../uiframework/data/runtime/TagRuntime";
import { parseRepeatInstanceId } from "../uiframework/repeat/RepeatRuntime";
import { createTagRef } from "../uiframework/data/collections/TagRef";
import { persistTagValueToSession } from "./mock-tag-session-state";
import {
  isMockRuntimeAuthority,
  subscribeMockRuntimeAuthority,
} from "./mock-runtime-authority";

type MockWsPayload = Record<string, unknown>;

const CHANNEL_NAME = "scadatomic.mock.runtime.v4";
const MAX_SEEN_MESSAGES = 2_048;

/**
 * Browser-side transport for the local mock runtime.
 *
 * Each browser tab owns one socket, but only one tab per project is allowed to
 * be the I/O authority. Runtime-preview tabs execute UI handlers locally while
 * tag writes are forwarded to the authority. The authority owns drivers and
 * broadcasts canonical tag readback to every client.
 */
class MockRuntimeSocket extends EventTarget {
  readonly readyState = WebSocket.OPEN;

  private readonly channel = createBroadcastChannel();
  private readonly publishedDocuments = new Map<string, UiDocument>();
  private readonly driverRuntime = new MockDriverRuntime();
  private readonly tagEventBridges = new Map<string, () => void>();
  private readonly authoritySubscriptions = new Map<string, () => void>();
  private readonly clientTagRuntimes = new Map<string, TagRuntime>();
  private readonly seenWriteRequests = new Set<string>();
  private readonly seenWriteRequestOrder: string[] = [];
  private readonly seenReadbacks = new Set<string>();
  private readonly seenReadbackOrder: string[] = [];

  constructor() {
    super();

    if (this.channel) {
      this.channel.addEventListener("message", (event) => {
        this.capturePublishedDocument(event.data, true);
        this.handleIncomingAuthorityRequest(event.data);
        if (this.applyRemoteTagReadback(event.data)) {
          this.dispatchPayload(event.data);
        }
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

    this.capturePublishedDocument(payload, false);

    if (payload.type === "tag.write.request") {
      this.handleOutgoingTagWriteRequest(payload);
    } else {
      this.handleOutgoingPayload(payload);
    }

    this.dispatchPayload(payload);
    this.channel?.postMessage(payload);
  }

  /** Runtime-side tag facade: local readback cache + remote driver writes. */
  getTagRuntime(projectId: string, data?: ProjectData) {
    if (isMockRuntimeAuthority(projectId)) {
      return getMockRuntimeSession(projectId, data).tags;
    }

    const cached = this.clientTagRuntimes.get(projectId);
    if (cached) return cached;

    const tagStore = getMockTagStore(projectId, data);
    const runtime = new TagRuntime(tagStore, {
      writePath: (path, value, requestedBy) => {
        this.send(
          JSON.stringify({
            type: "tag.write.request",
            requestId: createMessageId(),
            projectId,
            path,
            value,
            requestedBy,
            timestamp: Date.now(),
          })
        );
        // PLC-like writes are asynchronous: success here means the request was
        // accepted by the transport. The authoritative readback arrives as
        // tag.changed and becomes the new process-image value.
        return { ok: true };
      },
    });
    this.clientTagRuntimes.set(projectId, runtime);
    return runtime;
  }

  private capturePublishedDocument(payload: unknown, fromBroadcast: boolean) {
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

      // Every tab gets a readback cache initialized from the same project
      // snapshot. Only the authority may start/configure source drivers or
      // bridge TagStore events back onto the transport.
      const tagStore = hasMockRuntimeSession(message.projectId)
        ? configureMockRuntimeProjectData(message.projectId, document.data).tagStore
        : replaceMockTagStoreData(message.projectId, document.data);
      if (isMockRuntimeAuthority(message.projectId)) {
        this.driverRuntime.configureExisting(message.projectId, document.data);
        this.ensureTagEventBridge(message.projectId, tagStore);
      } else if (fromBroadcast) {
        this.channel?.postMessage({
          type: "tag.snapshot.request",
          requestId: createMessageId(),
          projectId: message.projectId,
          timestamp: Date.now(),
        });
      }
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

          const pageNode = findNodeByNameInSubtree(document, page.rootId, name);
          if (pageNode) return pageNode;

          const layout = getPageLayout(document, page);
          return layout
            ? findNodeByNameInSubtree(document, layout.rootId, name)
            : undefined;
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
        getTagRuntime: () => this.getTagRuntime(projectId, projectDocument?.data),
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

  private handleIncomingAuthorityRequest(payload: unknown) {
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) return;
    const message = payload as MockWsPayload;

    if (message.type === "tag.write.request") {
      this.handleTagWriteRequest(message);
      return;
    }

    if (message.type === "tag.snapshot.request") {
      this.handleTagSnapshotRequest(message);
      return;
    }

    this.handleDriverControl(message);
  }

  private handleOutgoingTagWriteRequest(payload: MockWsPayload) {
    // Runtime clients never self-promote to I/O authority on a write. The
    // Designer-owned host behaves like the PLC/edge runtime and remains the
    // single owner of source drivers.
    this.handleTagWriteRequest(payload);
  }

  private handleTagWriteRequest(payload: MockWsPayload) {
    const projectId = payload.projectId;
    const path = payload.path;
    if (typeof projectId !== "string" || typeof path !== "string") return;
    if (!isMockRuntimeAuthority(projectId)) return;

    const requestId = typeof payload.requestId === "string" ? payload.requestId : undefined;
    if (requestId && !this.rememberMessage(requestId, this.seenWriteRequests, this.seenWriteRequestOrder)) {
      return;
    }

    const document = this.getProjectDocument(projectId);
    const session = getMockRuntimeSession(projectId, document?.data);
    this.ensureTagEventBridge(projectId, session.tagStore);

    const requestedBy = parseTagWriteSource(payload.requestedBy);
    const result = session.tags.write(path, payload.value, requestedBy);
    if (!result.ok) {
      this.emitMockResponse({
        type: "tag.write.rejected",
        projectId,
        requestId: payload.requestId,
        path,
        error: result.error,
        timestamp: Date.now(),
      });
    }
  }


  private handleTagSnapshotRequest(payload: MockWsPayload) {
    const projectId = payload.projectId;
    if (typeof projectId !== "string" || !isMockRuntimeAuthority(projectId)) return;

    const document = this.getProjectDocument(projectId);
    const tagStore = getMockTagStore(projectId, document?.data);
    this.ensureTagEventBridge(projectId, tagStore);
    this.emitMockResponse({
      type: "tag.snapshot",
      projectId,
      requestId: payload.requestId,
      values: tagStore.listPrimitivePaths().map((entry) => ({
        path: entry.path,
        value: entry.value,
      })),
      timestamp: Date.now(),
    });
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

    if (!isMockRuntimeAuthority(message.projectId)) return true;

    if (message.type === "driver.stop") {
      this.driverRuntime.stop(message.projectId, message.driver);
      return true;
    }

    const data = message.data && typeof message.data === "object"
      ? (message.data as ProjectData)
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

  private applyRemoteTagReadback(payload: unknown) {
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) return true;
    const message = payload as MockWsPayload;
    if (typeof message.projectId !== "string" || isMockRuntimeAuthority(message.projectId)) {
      return true;
    }

    if (message.type === "tag.changed" && typeof message.eventId === "string") {
      if (!this.rememberMessage(message.eventId, this.seenReadbacks, this.seenReadbackOrder)) return false;
    }

    const data = this.getProjectDocument(message.projectId)?.data;
    const tagStore = getMockTagStore(message.projectId, data);

    if (message.type === "tag.snapshot" && Array.isArray(message.values)) {
      for (const item of message.values) {
        if (!item || typeof item !== "object" || Array.isArray(item)) continue;
        const entry = item as Record<string, unknown>;
        if (typeof entry.path !== "string") continue;
        const result = tagStore.set(entry.path, entry.value, {
          source: { kind: "session", id: "authority-snapshot" },
        });
        if (!result.ok) {
          console.warn("[mock-ws] Ignoring invalid tag snapshot entry", entry, result.error);
        }
      }
      return true;
    }

    if (message.type !== "tag.changed" || typeof message.path !== "string") return true;

    const source = parseTagWriteSource(message.source);
    const result = tagStore.set(message.path, message.newValue, { source });
    if (!result.ok) {
      console.warn("[mock-ws] Ignoring invalid remote tag readback", message, result.error);
    }
    return true;
  }

  ensureTagEventBridge(
    projectId: string,
    tagStore: ReturnType<typeof getMockTagStore>
  ) {
    if (!isMockRuntimeAuthority(projectId) || this.tagEventBridges.has(projectId)) return;

    this.ensureAuthorityLifecycle(projectId);
    const unsubscribe = tagStore.subscribe("*", (tagEvent) => {
      // A stale/lost authority must never continue publishing process values.
      if (!isMockRuntimeAuthority(projectId)) return;

      const data = tagStore.snapshot();
      const resolved = findTagFieldRefByPath(data, tagEvent.path);
      if (resolved) {
        persistTagValueToSession(projectId, resolved.ref, tagEvent.newValue);
      }

      this.emitMockResponse({
        ...tagEvent,
        eventId: createMessageId(),
        projectId,
        timestamp: Date.now(),
      });
    });
    this.tagEventBridges.set(projectId, unsubscribe);
  }

  private ensureAuthorityLifecycle(projectId: string) {
    if (this.authoritySubscriptions.has(projectId)) return;
    const unsubscribe = subscribeMockRuntimeAuthority(projectId, (isAuthority) => {
      if (isAuthority) return;

      // Losing the lease is a hard runtime boundary. Stale drivers must stop
      // immediately; otherwise every authority handoff leaves another timer
      // running in the background and eventually starves the browser thread.
      this.driverRuntime.disposeProject(projectId);
      this.tagEventBridges.get(projectId)?.();
      this.tagEventBridges.delete(projectId);
    });
    this.authoritySubscriptions.set(projectId, unsubscribe);
  }

  private rememberMessage(id: string, set: Set<string>, order: string[]) {
    if (set.has(id)) return false;
    set.add(id);
    order.push(id);
    while (order.length > MAX_SEEN_MESSAGES) {
      const oldest = order.shift();
      if (oldest) set.delete(oldest);
    }
    return true;
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

function parseTagWriteSource(value: unknown): TagWriteSource {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { kind: "script" };
  }
  const source = value as Record<string, unknown>;
  const kind = source.kind;
  if (
    kind !== "user" &&
    kind !== "script" &&
    kind !== "simulation" &&
    kind !== "driver" &&
    kind !== "session"
  ) {
    return { kind: "script" };
  }
  return typeof source.id === "string" ? { kind, id: source.id } : { kind };
}

function createMessageId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2)}`;
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

  const rootRuntimeId = parts[0]!;
  let instance = document.nodes[rootRuntimeId];
  if (!instance) {
    const repeat = parseRepeatInstanceId(rootRuntimeId);
    if (repeat) {
      const container = document.nodes[repeat.containerId];
      const behavior = container?.contentBehavior;
      const tag = document.data?.tags[repeat.tagId];
      const tagRef = tag ? createTagRef(tag) : undefined;
      if (
        behavior?.kind === "repeat" &&
        behavior.template.componentDefinitionId === repeat.componentDefinitionId &&
        tag &&
        tagRef
      ) {
        instance = {
          id: rootRuntimeId,
          name: `repeat_${tag.name}`,
          type: "ComponentInstance",
          componentDefinitionId: repeat.componentDefinitionId,
          props: { [behavior.template.inputName]: tagRef },
        };
      }
    }
  }
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

export function getMockTransportTagRuntime(
  projectId: string,
  data?: import("../uiframework/data/tags/TagDefinition").ProjectData
) {
  return getMockRuntimeSocket().getTagRuntime(projectId, data);
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
