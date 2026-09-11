import { ArrowLeft, Box, Palette, Star } from "lucide-react";
import { useEditorStore } from "../../editor-store";
import { getPageByRootId, type UiDocument } from "../../core/document";
import type {
  ComponentDefinitionEditorMode,
  ComponentEditorMode,
} from "../../editor/component-mode";

export type {
  ComponentDefinitionEditorMode,
  ComponentEditorMode,
} from "../../editor/component-mode";
import {
  ComponentDefinitionPanel,
  ComponentInstancePanel,
} from "../reusable-component/ReusableComponentPanels";
import { getComponentDefinition } from "../../registry/component-definitions";
import { PropertyPanelEmpty } from "./PropertyPanelEmpty";
import { PropertyPanelHeader } from "./PropertyPanelHeader";
import { PropertyPanelNodeNotFound } from "./PropertyPanelNodeNotFound";
import { MultiSelectionPanel } from "./MultiSelectionPanel";
import { PageSettingsEditor } from "./PageSettingsEditor";
import { ComponentProperties } from "./ComponentProperties";
import { VariantsEditor } from "./VariantsEditor";
import { VariantPropertiesEditor } from "./VariantPropertiesEditor";
import { RepeatBehaviorEditor } from "../repeat/RepeatBehaviorEditor";

type Props = {
  document: UiDocument;
  componentMode?: ComponentEditorMode | null;
  componentDefinitionMode?: ComponentDefinitionEditorMode | null;
  onEditVariant: (nodeId: string, variantName: string) => void;
  onEditComponentDefinition: (componentId: string) => void;
  onEditComponentDefinitionVariant: (
    componentId: string,
    nodeId: string,
    variantName: string
  ) => void;
  onExitComponentMode: () => void;
};

export function PropertyPanel({
  document,
  componentMode = null,
  componentDefinitionMode = null,
  onEditVariant,
  onEditComponentDefinition,
  onEditComponentDefinitionVariant,
  onExitComponentMode,
}: Props) {
  const selectedNodeId = useEditorStore((state) => state.selectedNodeId);
  const selectedNodeIds = useEditorStore((state) => state.selectedNodeIds);
  const updateNode = useEditorStore((state) => state.updateNode);
  const renameNode = useEditorStore((state) => state.renameNode);
  const setBinding = useEditorStore((state) => state.setBinding);
  const setEvent = useEditorStore((state) => state.setEvent);
  const setStartPage = useEditorStore((state) => state.setStartPage);
  const createReusableComponent = useEditorStore(
    (state) => state.createReusableComponent
  );
  const createReusableComponentFromSelection = useEditorStore(
    (state) => state.createReusableComponentFromSelection
  );
  const updateComponentDefinition = useEditorStore(
    (state) => state.updateComponentDefinition
  );
  const updateComponentDefinitionNode = useEditorStore(
    (state) => state.updateComponentDefinitionNode
  );

  if (componentDefinitionMode) {
    const definition = document.components?.[componentDefinitionMode.componentId];
    if (!definition) return <PropertyPanelNodeNotFound />;

    return (
      <ComponentDefinitionPanel
        projectDocument={document}
        definition={definition}
        selectedInternalNodeId={componentDefinitionMode.selectedInternalNodeId}
        updateDefinition={(updater) =>
          updateComponentDefinition(definition.id, updater)
        }
        updateDefinitionNode={(nodeId, updater) =>
          updateComponentDefinitionNode(definition.id, nodeId, updater)
        }
        editingVariantName={componentDefinitionMode.variantName}
        onEditVariant={(nodeId, variantName) =>
          onEditComponentDefinitionVariant(
            definition.id,
            nodeId,
            variantName
          )
        }
        onExit={onExitComponentMode}
      />
    );
  }

  if (componentMode) {
    const node = document.nodes[componentMode.nodeId];
    const variant = node?.variants?.[componentMode.variantName];

    if (!node || !variant) {
      return <PropertyPanelNodeNotFound />;
    }

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
          <VariantPropertiesEditor
            node={node}
            variantName={componentMode.variantName}
            updateNode={updateNode}
            onEditVariant={onEditVariant}
          />
        </div>
      </div>
    );
  }

  if (selectedNodeIds.length > 1) {
    return (
      <MultiSelectionPanel
        document={document}
        selectedNodeIds={selectedNodeIds}
        onCreateComponent={() => {
          const componentId = createReusableComponentFromSelection(
            selectedNodeIds
          );
          if (componentId) onEditComponentDefinition(componentId);
        }}
      />
    );
  }

  if (!selectedNodeId) {
    return <PropertyPanelEmpty />;
  }

  const node = document.nodes[selectedNodeId];

  if (!node) {
    return <PropertyPanelNodeNotFound />;
  }

  if (node.type === "ComponentInstance") {
    return (
      <ComponentInstancePanel
        document={document}
        node={node}
        updateNode={updateNode}
        onEditDefinition={onEditComponentDefinition}
        renameNode={renameNode}
      />
    );
  }

  const page = node.type === "Page" ? getPageByRootId(document, node.id) : undefined;
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
        {node.type === "Page" ? (
          <PageSettingsEditor
            node={node}
            updateNode={updateNode}
            isStartPage={page?.id === document.startPageId}
            onSetStartPage={page ? () => setStartPage(page.id) : undefined}
          />
        ) : null}

        {definition ? (
          <ComponentProperties
            node={node}
            values={resolvedProps}
            controls={definition.inspector}
            updateNode={updateNode}
            bindingDefinitions={definition.bindings}
            setBinding={setBinding}
            eventDefinitions={definition.events}
            setEvent={setEvent}
          />
        ) : (
          <div className="text-xs text-amber-700">
            No component definition for {node.type}.
          </div>
        )}

        {node.type === "Container" ? (
          <RepeatBehaviorEditor document={document} node={node} updateNode={updateNode} />
        ) : null}

        {node.type !== "Page" ? (
          <VariantsEditor
            node={node}
            updateNode={updateNode}
            onEditVariant={onEditVariant}
          />
        ) : null}

        {node.id !== document.rootId ? (
          <section className="border-t border-[var(--editor-border)] pt-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--editor-text-muted)]">
                  <Box size={12} /> Component
                </div>
                <div className="mt-1 text-[10px] text-[var(--editor-text-muted)]">
                  Encapsulate this subtree behind a public API.
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  const componentId = createReusableComponent(node.id);
                  if (componentId) onEditComponentDefinition(componentId);
                }}
                className="inline-flex h-8 items-center gap-1.5 rounded-md border border-violet-200 bg-violet-50 px-2.5 text-xs font-medium text-violet-700 hover:bg-violet-100"
              >
                Create component
              </button>
            </div>
          </section>
        ) : null}

      </div>
    </div>
  );
}
