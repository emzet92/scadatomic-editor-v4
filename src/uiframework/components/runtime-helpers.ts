import { sendWsMessage } from "../websocket";

export function sendRuntimeEvent({
  handlerId,
  eventName,
  nodeId,
  projectId,
  pageId,
  payload,
}: {
  handlerId: string;
  eventName: string;
  nodeId: string;
  projectId?: string | undefined;
  pageId?: string | undefined;
  payload?: Record<string, unknown> | undefined;
}) {
  sendWsMessage({
    type: "runtime.event",
    handlerId,
    eventName,
    nodeId,
    projectId,
    pageId,
    payload,
  });
}
