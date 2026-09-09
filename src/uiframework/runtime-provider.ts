import { useEffect, useRef } from "react";
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
  onNavigate?: (path: string) => void;
};

export function RuntimeProvider({
  projectId,
  setDocument,
  onScreenUpdated,
  onNodeUpdated,
  onNavigate,
}: RuntimeProviderProps) {
  const onScreenUpdatedRef = useRef(onScreenUpdated);
  const onNodeUpdatedRef = useRef(onNodeUpdated);
  const onNavigateRef = useRef(onNavigate);

  onScreenUpdatedRef.current = onScreenUpdated;
  onNodeUpdatedRef.current = onNodeUpdated;
  onNavigateRef.current = onNavigate;

  // Rehydrate session-scoped runtime UI state only when the runtime/project
  // boundary changes. Do not couple this to render callbacks: they can change
  // identity whenever the active document changes.
  useEffect(() => {
    if (!projectId) return;
    setDocument((current) => applyMockRuntimeUiState(projectId, current));
  }, [projectId, setDocument]);

  // Keep one websocket subscription per project. The latest callbacks are read
  // through refs so document/navigation updates do not tear down and recreate
  // the subscription (and, importantly, do not rehydrate state in a loop).
  useEffect(() => {
    const ws = getWs();

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
          onScreenUpdatedRef.current?.();
          return;
        }

        if (payload.type === "runtime.navigate") {
          if (typeof payload.path === "string") {
            onNavigateRef.current?.(payload.path);
          }
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

          onNodeUpdatedRef.current?.();
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

          onNodeUpdatedRef.current?.();
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
  }, [projectId, setDocument]);

  return null;
}
