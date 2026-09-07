import {
  getMockRuntimeSocket,
  sendMockWsMessage,
} from "../mock/mock-runtime-socket";

/**
 * Development runtime transport.
 *
 * This intentionally looks like the old websocket module to its callers, but
 * it never opens a real network connection. Random process values are emitted
 * locally and publish/runtime events are mirrored between browser tabs via
 * BroadcastChannel when available.
 */
export function getWs() {
  return getMockRuntimeSocket();
}

export function sendWsMessage(payload: unknown) {
  sendMockWsMessage(payload);
}
