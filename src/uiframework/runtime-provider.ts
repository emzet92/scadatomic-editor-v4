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
import { hydrateRuntimeTagState } from "./runtime-tag-bridge";

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

  useEffect(() => {
    onScreenUpdatedRef.current = onScreenUpdated;
    onNodeUpdatedRef.current = onNodeUpdated;
    onNavigateRef.current = onNavigate;
  }, [onNavigate, onNodeUpdated, onScreenUpdated]);

  // Rehydrate only session-scoped UI overrides here. Tag signal hydration is
  // performed at explicit project-load / publish boundaries, outside React
  // state updaters, because runtimeSignals synchronously notifies subscribers.
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
          if (projectId) {
            hydrateRuntimeTagState(projectId, publishedDocument.data);
          }
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

          setDocument((current) => {
            if (!current.nodes[nodeId] && nodeId.includes("::")) {
              // Scoped reusable-component internals live in definition trees,
              // not document.nodes. Runtime state is already persisted above;
              // force a lightweight repaint so RenderNode can re-resolve it.
              return { ...current };
            }

            return applyDocumentCommand(current, {
              type: "node.setProp",
              nodeId,
              property,
              value: payload.value,
            });
          });

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

            // Internal reusable-component runtime nodes use the scoped
            // "instanceId::internalNodeId" id. They do not live in
            // document.nodes, but the runtime variant store already changed;
            // return a shallow document snapshot so RenderPage can re-read the
            // scoped variant and repaint that private node only.
            if (!node) {
              return nodeId.includes("::") ? { ...current } : current;
            }

            if (!node.variants?.[variantName]) {
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

        if (payload.type === "tag.snapshot" && Array.isArray(payload.values)) {
          for (const item of payload.values) {
            if (!item || typeof item !== "object" || Array.isArray(item)) continue;
            const entry = item as Record<string, unknown>;
            if (typeof entry.path === "string") {
              runtimeSignals.set(entry.path, entry.value);
            }
          }
          return;
        }

        if (
          payload.type === "tag.changed" &&
          typeof payload.path === "string"
        ) {
          runtimeSignals.set(payload.path, payload.newValue);
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
