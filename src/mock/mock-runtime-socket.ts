import { parseUiDocument, type UiDocument } from "../uiframework/core/document";
import { getMockProjectSnapshot } from "./mock-project-store";
import {
  applyMockRuntimeUiState,
  getMockRuntimeNodeVariant,
} from "./mock-runtime-ui-state";
import { executeMockScript } from "./mock-script-runtime";

type MockWsPayload = Record<string, unknown>;

const CHANNEL_NAME = "scadatomic.mock.runtime.v2";
const SIGNAL_INTERVAL_MS = 650;

class MockRuntimeSocket extends EventTarget {
  readonly readyState = WebSocket.OPEN;

  private readonly channel = createBroadcastChannel();
  private readonly publishedDocuments = new Map<string, UiDocument>();
  private signalTimer: number | null = null;
  private process = {
    levelPercent: 62,
    flowRate: 85,
    running: true,
  };

  constructor() {
    super();

    if (this.channel) {
      this.channel.addEventListener("message", (event) => {
        this.capturePublishedDocument(event.data);
        this.dispatchPayload(event.data);
      });
    }

    this.startRandomSignals();
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
      this.publishedDocuments.set(
        message.projectId,
        structuredClone(parseUiDocument(message.document))
      );
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
    if (payload.type !== "runtime.event") {
      return;
    }

    const projectId = payload.projectId;
    const handlerId = payload.handlerId;
    const sourceNodeId = payload.nodeId;
    const eventName = payload.eventName;

    if (
      typeof projectId !== "string" ||
      typeof handlerId !== "string" ||
      typeof sourceNodeId !== "string" ||
      typeof eventName !== "string"
    ) {
      console.warn("[mock-ws] Invalid runtime.event", payload);
      return;
    }

    executeMockScript(
      {
        projectId,
        handlerId,
        sourceNodeId,
        eventName,
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
          return Object.values(document?.nodes ?? {}).find(
            (node) => node.name === name
          );
        },
        emit: (customEventName, customPayload) => {
          this.handleScriptEvent(customEventName);

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

  private handleScriptEvent(eventName: string) {
    if (eventName === "pump.start") {
      this.process.running = true;
      this.emitProcessSignals();
    }

    if (eventName === "pump.stop") {
      this.process.running = false;
      this.emitProcessSignals();
    }
  }

  private startRandomSignals() {
    if (this.signalTimer !== null) {
      return;
    }

    this.emitSignal("pump.stationName", "Pump Station P-101");
    this.emitProcessSignals();

    this.signalTimer = window.setInterval(() => {
      const levelDelta = randomBetween(-0.65, 0.85);
      this.process.levelPercent = clamp(
        this.process.levelPercent + levelDelta,
        8,
        96
      );

      const targetFlow = this.process.running ? 85 : 0;
      const flowNoise = this.process.running ? randomBetween(-7, 7) : 0;
      const response = (targetFlow - this.process.flowRate) * 0.2;
      this.process.flowRate = Math.max(
        0,
        this.process.flowRate + response + flowNoise
      );

      this.emitProcessSignals();
    }, SIGNAL_INTERVAL_MS);
  }

  private emitProcessSignals() {
    const levelPercent = round(this.process.levelPercent, 1);
    const liters = Math.round(levelPercent * 20);
    const flowRate = round(this.process.flowRate, 1);

    this.emitSignal("tank.levelPercent", `${levelPercent} %`);
    this.emitSignal("tank.levelLiters", `${liters} L`);
    this.emitSignal("pump.flowRate", `${flowRate} m³/h`);
    this.emitSignal("pump.running", this.process.running);
  }

  private emitSignal(source: string, value: unknown) {
    this.dispatchPayload({
      type: "runtime.signal",
      source,
      value,
      timestamp: Date.now(),
    });
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

let socket: MockRuntimeSocket | null = null;

export function getMockRuntimeSocket() {
  socket ??= new MockRuntimeSocket();
  return socket;
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

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function round(value: number, digits: number) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}
