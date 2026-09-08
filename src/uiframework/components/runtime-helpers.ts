import { sendWsMessage } from "../websocket";

export function sendRuntimeEvent({
  handlerId,
  eventName,
  nodeId,
  projectId,
}: {
  handlerId: string;
  eventName: string;
  nodeId: string;
  projectId?: string | undefined;
}) {
  sendWsMessage({
    type: "runtime.event",
    handlerId,
    eventName,
    nodeId,
    projectId,
  });
}
