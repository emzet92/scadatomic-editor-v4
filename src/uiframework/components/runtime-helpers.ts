import { sendWsMessage } from "../websocket";

export function sendRuntimeEvent({
  event,
  nodeId,
  projectId,
}: {
  event: string;
  nodeId: string;
  projectId?: string | undefined;
}) {
  sendWsMessage({
    type: "runtime.event",
    event,
    nodeId,
    projectId,
  });
}
