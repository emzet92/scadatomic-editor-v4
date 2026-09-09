import { ArrowLeft, Palette, Star } from "lucide-react";
import { getComponentVariantProps } from "../../component-variants";
import { useEditorStore } from "../../editor-store";
import type { UiDocument, UiNode } from "../../core/document";
import { getComponentDefinition } from "../../registry/component-definitions";
import { BindingsEditor } from "./BindingsEditor";
import { EventsEditor } from "./EventsEditor";
import { PropertyPanelEmpty } from "./PropertyPanelEmpty";
import { PropertyPanelHeader } from "./PropertyPanelHeader";
import { PropertyPanelNodeNotFound } from "./PropertyPanelNodeNotFound";
import { PropsEditor } from "./PropsEditor";
import { VariantsEditor } from "./VariantsEditor";
import type { UpdateNode } from "./property-panel-types";

export type ComponentEditorMode = {
  nodeId: string;
  variantName: string;
};

type Props = {
  document: UiDocument;
  componentMode?: ComponentEditorMode | null;
  onEditVariant: (nodeId: string, variantName: string) => void;
  onExitComponentMode: () => void;
};

export function PropertyPanel({
  document,
  componentMode = null,
  onEditVariant,
  onExitComponentMode,
}: Props) {
  const selectedNodeId = useEditorStore((state) => state.selectedNodeId);
  const updateNode = useEditorStore((state) => state.updateNode);
  const renameNode = useEditorStore((state) => state.renameNode);
  const setBinding = useEditorStore((state) => state.setBinding);
  const setEvent = useEditorStore((state) => state.setEvent);

  if (componentMode) {
    const node = document.nodes[componentMode.nodeId];
    const variant = node?.variants?.[componentMode.variantName];

    if (!node || !variant) {
      return <PropertyPanelNodeNotFound />;
    }

    const definition = getComponentDefinition(node.type);
    const variantValues = {
      ...(definition?.defaults ?? {}),
      ...getComponentVariantProps(node, componentMode.variantName),
    };

    const updateVariantNode: UpdateNode = (nodeId, updater) => {
      updateNode(nodeId, (currentNode) => {
        const currentVariant = currentNode.variants?.[componentMode.variantName];
        if (!currentVariant) {
          return currentNode;
        }

        const syntheticNode: UiNode = {
          ...currentNode,
          props: { ...currentVariant.props },
          defaultVariant: undefined,
        };
        const updated = updater(syntheticNode);

        return {
          ...currentNode,
          variants: {
            ...(currentNode.variants ?? {}),
            [componentMode.variantName]: {
              props: { ...(updated.props ?? {}) },
            },
          },
        };
      });
    };

    return (
      <div data-editor-ignore className="h-full flex flex-col">
        <div className="border-b border-[var(--editor-border)] bg-[var(--editor-surface)] px-4 py-4">
          <button
            type="button"
            onClick={onExitComponentMode}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--editor-text-muted)] transition hover:text-[var(--editor-text)]"
          >
            <ArrowLeft size={13} /> Designer
          </button>

          <div className="mt-3 flex items-start gap-2">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-violet-50 text-violet-700">
              <Palette size={15} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-[var(--editor-text)]">
                {node.name}.{componentMode.variantName}
              </div>
              <div className="mt-0.5 truncate font-mono text-[10px] text-[var(--editor-text-muted)]">
                ctx.ui.{node.name}.variant.{componentMode.variantName}()
              </div>
            </div>
            {node.defaultVariant === componentMode.variantName ? (
              <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-1.5 py-1 text-[9px] font-semibold uppercase tracking-wide text-amber-700">
                <Star size={8} fill="currentColor" /> default
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-6">
          {definition ? (
            <PropsEditor
              nodeId={node.id}
              values={variantValues}
              controls={definition.inspector}
              updateNode={updateVariantNode}
            />
          ) : (
            <div className="text-xs text-amber-700">
              No component definition for {node.type}.
            </div>
          )}

          <VariantsEditor
            node={node}
            updateNode={updateNode}
            onEditVariant={onEditVariant}
          />
        </div>
      </div>
    );
  }

  if (!selectedNodeId) {
    return <PropertyPanelEmpty />;
  }

  const node = document.nodes[selectedNodeId];

  if (!node) {
    return <PropertyPanelNodeNotFound />;
  }

  const definition = getComponentDefinition(node.type);
  const resolvedProps = {
    ...(definition?.defaults ?? {}),
    ...(node.props ?? {}),
  };

  return (
    <div data-editor-ignore className="h-full flex flex-col">
      <PropertyPanelHeader
        key={node.id}
        node={node}
        renameNode={renameNode}
      />

      <div className="flex-1 overflow-auto p-4 space-y-6">
        {definition ? (
          <PropsEditor
            nodeId={node.id}
            values={resolvedProps}
            controls={definition.inspector}
            updateNode={updateNode}
          />
        ) : (
          <div className="text-xs text-amber-700">
            No component definition for {node.type}.
          </div>
        )}

        <VariantsEditor
          node={node}
          updateNode={updateNode}
          onEditVariant={onEditVariant}
        />

        {definition?.bindings && (
          <BindingsEditor
            nodeId={node.id}
            definitions={definition.bindings}
            bindings={node.bindings}
            setBinding={setBinding}
          />
        )}

        {definition?.events && (
          <EventsEditor
            nodeId={node.id}
            nodeName={node.name}
            definitions={definition.events}
            events={node.events}
            setEvent={setEvent}
          />
        )}
      </div>
    </div>
  );
}
