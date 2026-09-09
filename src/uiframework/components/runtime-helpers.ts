import { sendWsMessage } from "../websocket";

export function sendRuntimeEvent({
  handlerId,
  eventName,
  nodeId,
  projectId,
  pageId,
}: {
  handlerId: string;
  eventName: string;
  nodeId: string;
  projectId?: string | undefined;
  pageId?: string | undefined;
}) {
  sendWsMessage({
    type: "runtime.event",
    handlerId,
    eventName,
    nodeId,
    projectId,
    pageId,
  });
}
