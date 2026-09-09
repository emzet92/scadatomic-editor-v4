import { useEffect } from "react";
import { applyDocumentCommand } from "./core/commands";
import { parseUiDocument, type UiDocument } from "./core/document";
import { runtimeSignals } from "./runtime-signals";
import { getWs } from "./websocket";
import {
  applyMockRuntimeUiState,
  getMockRuntimeNodeProps,
  setMockRuntimeNodeProp,
  setMockRuntimeNodeVariant,
} from "../mock/mock-runtime-ui-state";
import { getComponentVariantProps } from "./component-variants";

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

    if (projectId) {
      setDocument((current) => applyMockRuntimeUiState(projectId, current));
    }

    const handleMessage = (event: Event) => {
      const messageEvent = event as MessageEvent<string>;

      try {
        const payload = JSON.parse(messageEvent.data) as Record<string, unknown>;

        if (
          typeof payload.projectId === "string" &&
          projectId &&
          payload.projectId !== projectId
        ) {
          return;
        }

        if (payload.type === "screen.publish") {
          const publishedDocument = parseUiDocument(payload.document);
          setDocument(
            projectId
              ? applyMockRuntimeUiState(projectId, publishedDocument)
              : publishedDocument
          );
          onScreenUpdated?.();
          return;
        }

        if (payload.type === "node.update") {
          const nodeId = payload.nodeId;
          const property = payload.property;

          if (typeof nodeId !== "string" || typeof property !== "string") {
            return;
          }

          if (projectId) {
            setMockRuntimeNodeProp(projectId, nodeId, property, payload.value);
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

        if (payload.type === "node.variant") {
          const nodeId = payload.nodeId;
          const variantName = payload.variantName;

          if (typeof nodeId !== "string" || typeof variantName !== "string") {
            return;
          }

          if (projectId) {
            setMockRuntimeNodeVariant(projectId, nodeId, variantName);
          }

          setDocument((current) => {
            const node = current.nodes[nodeId];
            if (!node?.variants?.[variantName]) {
              return current;
            }

            const runtimeProps = projectId
              ? getMockRuntimeNodeProps(projectId, nodeId)
              : {};

            return {
              ...current,
              nodes: {
                ...current.nodes,
                [nodeId]: {
                  ...node,
                  props: {
                    ...(node.props ?? {}),
                    ...getComponentVariantProps(node, variantName),
                    ...runtimeProps,
                  },
                },
              },
            };
          });

          onNodeUpdated?.();
          return;
        }

        if (
          payload.type === "runtime.signal" &&
          typeof payload.source === "string"
        ) {
          runtimeSignals.set(payload.source, payload.value);
        }
      } catch (error) {
        console.error(
          "Failed to parse runtime message",
          error,
          messageEvent.data
        );
      }
    };

    ws.addEventListener("message", handleMessage);
    return () => ws.removeEventListener("message", handleMessage);
  }, [projectId, setDocument, onScreenUpdated, onNodeUpdated]);

  return null;
}
