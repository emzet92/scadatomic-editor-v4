import { useEffect, useRef } from "react";
import {
  getMockRuntimeNodeProps,
  getMockRuntimeNodeVariant,
} from "../../mock/mock-runtime-ui-state";
import { getComponentVariantProps } from "../component-variants";
import type { UiDocument, UiNode } from "../core/document";
import {
  closeProjectModal,
  getProjectModalSnapshot,
  useProjectModalRevision,
} from "../modal-runtime-state";
import {
  getReactiveNodeProps,
  getReactiveNodeVariant,
} from "../reactive-ui-state";
import { RenderNode } from "../Renderer";
import { runtimeRegistry } from "../registry/runtime-registry";
import { sendRuntimeEvent } from "../components/runtime-helpers";

export function RuntimeModalLayer({
  projectId,
  document,
  pageId,
}: {
  projectId: string;
  document: UiDocument;
  pageId: string;
}) {
  useProjectModalRevision(projectId);
  const snapshot = getProjectModalSnapshot(projectId);
  const seenTransitions = useRef(new Set<string>());

  useEffect(() => {
    for (const transition of snapshot.transitions) {
      if (seenTransitions.current.has(transition.id)) continue;
      seenTransitions.current.add(transition.id);
      const modal = document.modals?.[transition.modalId];
      const root = modal ? document.nodes[modal.rootId] : undefined;
      const handler = root?.events?.[transition.type];
      if (!modal || !root || !handler) continue;
      sendRuntimeEvent({
        handlerId: handler.handlerId,
        eventName: transition.type,
        nodeId: root.id,
        projectId,
        pageId,
        payload: transition.payload,
      });
    }
  }, [document, pageId, projectId, snapshot.transitions]);

  const topEntry = snapshot.open.at(-1);
  const topModal = topEntry ? document.modals?.[topEntry.modalId] : undefined;
  const topRoot = topModal ? document.nodes[topModal.rootId] : undefined;

  useEffect(() => {
    if (!topEntry || !topModal || !topRoot) return undefined;
    const closeOnEscape = topRoot.props?.closeOnEscape !== false;
    if (!closeOnEscape) return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      closeProjectModal(projectId, topModal.id, { reason: "escape" });
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [projectId, topEntry, topModal, topRoot]);

  const openEntries = snapshot.open
    .map((entry) => ({ entry, modal: document.modals?.[entry.modalId] }))
    .filter(
      (item): item is {
        entry: (typeof snapshot.open)[number];
        modal: NonNullable<typeof item.modal>;
      } => !!item.modal
    );

  if (openEntries.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[1000] pointer-events-none">
      {openEntries.map(({ modal }, index) => {
        const root = document.nodes[modal.rootId];
        if (!root) return null;
        const isTop = index === openEntries.length - 1;
        const closeOnBackdrop = root.props?.closeOnBackdrop !== false;
        return (
          <div
            key={modal.id}
            className="absolute inset-0 flex items-center justify-center bg-black/45 p-6 pointer-events-auto"
            style={{ zIndex: 1000 + index }}
            onMouseDown={(event) => {
              if (!isTop || !closeOnBackdrop || event.target !== event.currentTarget) return;
              closeProjectModal(projectId, modal.id, { reason: "backdrop" });
            }}
          >
              <RenderNode
                id={modal.rootId}
                document={{ ...document, rootId: modal.rootId }}
                registry={runtimeRegistry}
                decorateComponentInternals
                resolveNode={(node, context) =>
                  resolveRuntimeNode(projectId, node, context.componentInstanceId)
                }
                decorateProps={(node, context) => {
                  const runtimeNodeId = context.componentInstanceId
                    ? `${context.componentInstanceId}::${node.id}`
                    : node.id;
                  const base = {
                    "data-node-id": runtimeNodeId,
                    "data-scadatomic-type": node.type,
                  };
                  if (node.type === "Text" || node.type === "Chart") {
                    return { ...base, runtimeBindings: node.bindings };
                  }
                  if (node.type === "Button") {
                    return {
                      ...base,
                      runtimeEvents: node.events,
                      runtimeProjectId: projectId,
                      runtimePageId: pageId,
                    };
                  }
                  return base;
                }}
              />
          </div>
        );
      })}
    </div>
  );
}

function resolveRuntimeNode(
  projectId: string,
  node: UiNode,
  componentInstanceId?: string
): UiNode {
  const runtimeNodeId = componentInstanceId
    ? `${componentInstanceId}::${node.id}`
    : node.id;
  const runtimeProps = getMockRuntimeNodeProps(projectId, runtimeNodeId);
  const reactiveProps = getReactiveNodeProps(projectId, runtimeNodeId);
  const requestedVariant =
    getReactiveNodeVariant(projectId, runtimeNodeId) ??
    getMockRuntimeNodeVariant(projectId, runtimeNodeId);
  const variantName =
    requestedVariant && node.variants?.[requestedVariant]
      ? requestedVariant
      : node.defaultVariant;
  const variantProps = getComponentVariantProps(node, variantName);
  const normalizedReactive = normalizeReactiveProps(
    { ...(node.props ?? {}), ...variantProps, ...runtimeProps },
    reactiveProps
  );

  if (
    Object.keys(runtimeProps).length === 0 &&
    Object.keys(reactiveProps).length === 0 &&
    Object.keys(variantProps).length === 0
  ) {
    return node;
  }

  return {
    ...node,
    props: {
      ...(node.props ?? {}),
      ...variantProps,
      ...runtimeProps,
      ...normalizedReactive,
    },
  };
}

function normalizeReactiveProps(
  baseProps: Record<string, unknown>,
  reactiveProps: Record<string, unknown>
) {
  const next = { ...reactiveProps };
  if (Object.prototype.hasOwnProperty.call(next, "enabled")) {
    next.disabled = !next.enabled;
    delete next.enabled;
  }
  if (Object.prototype.hasOwnProperty.call(next, "visible")) {
    const visible = Boolean(next.visible);
    const baseStyle = isRecord(baseProps.style) ? baseProps.style : {};
    const reactiveStyle = isRecord(next.style) ? next.style : {};
    next.style = {
      ...baseStyle,
      ...reactiveStyle,
      ...(visible ? {} : { display: "none" }),
    };
    delete next.visible;
  }
  return next;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}
