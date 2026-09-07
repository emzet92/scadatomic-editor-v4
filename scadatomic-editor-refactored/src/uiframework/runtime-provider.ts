import { useEffect } from "react";
import { applyDocumentCommand } from "./core/commands";
import { normalizeUiDocument, type UiDocument } from "./core/document";
import { runtimeSignals } from "./runtime-signals";
import { getWs } from "./websocket";

type RuntimeProviderProps = {
  projectId?: string | undefined;
  setDocument: React.Dispatch<React.SetStateAction<UiDocument>>;
  onScreenUpdated?: () => void;
  onNodeUpdated?: () => void;
};

export function RuntimeProvider({
  projectId,
  setDocument,
  onScreenUpdated,
  onNodeUpdated,
}: RuntimeProviderProps) {
  useEffect(() => {
    const ws = getWs();

    const handleMessage = (event: MessageEvent) => {
      try {
        const payload = JSON.parse(event.data) as Record<string, unknown>;

        if (
          typeof payload.projectId === "string" &&
          projectId &&
          payload.projectId !== projectId
        ) {
          return;
        }

        const messageType =
          typeof payload.type === "string"
            ? payload.type
            : typeof payload.event === "string"
              ? payload.event
              : undefined;

        if (messageType === "screen.publish") {
          const documentInput =
            payload.document ?? payload.tree ?? payload.nodes;

          if (!documentInput) {
            return;
          }

          setDocument(normalizeUiDocument(documentInput));
          onScreenUpdated?.();
          return;
        }

        if (messageType === "node.update") {
          const nodeId = payload.nodeId;
          const property = payload.property;

          if (typeof nodeId !== "string" || typeof property !== "string") {
            return;
          }

          setDocument((current) =>
            applyDocumentCommand(current, {
              type: "node.setProp",
              nodeId,
              property,
              value: payload.value,
            })
          );

          onNodeUpdated?.();
          return;
        }

        const signalTag = payload.source ?? payload.tag;
        if (signalTag !== undefined) {
          runtimeSignals.set(String(signalTag), payload.value);
        }
      } catch (error) {
        console.error("Failed to parse WS message", error, event.data);
      }
    };

    ws.addEventListener("message", handleMessage);
    return () => ws.removeEventListener("message", handleMessage);
  }, [projectId, setDocument, onScreenUpdated, onNodeUpdated]);

  return null;
}
