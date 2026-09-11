import {
  getMockRuntimeSocket,
  sendMockWsMessage,
} from "../mock/mock-runtime-socket";

/**
 * Development runtime transport.
 *
 * The API intentionally matches the old websocket module. Browser tabs mirror
 * messages through BroadcastChannel, while one project authority owns drivers
 * and canonical tag readback. Runtime-preview handlers remain local clients and
 * send PLC-like tag write requests through this transport.
 */
export function getWs() {
  return getMockRuntimeSocket();
}

export function sendWsMessage(payload: unknown) {
  sendMockWsMessage(payload);
}
