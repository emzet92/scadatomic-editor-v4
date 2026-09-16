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
import { NodePropertiesEditor } from "./NodePropertiesEditor";
import { VariantsEditor } from "./VariantsEditor";
import { VariantPropertiesEditor } from "./VariantPropertiesEditor";
import { RepeatBehaviorEditor } from "../repeat/RepeatBehaviorEditor";
import {
  BackIcon,
  Badge,
  Box,
  BoxIcon,
  Button,
  PaletteIcon,
  PanelSection,
  StarIcon
} from "../ui";

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
  const setPageLayout = useEditorStore((state) => state.setPageLayout);
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
      <Box data-editor-ignore className="h-full flex flex-col">
        <Box className="border-b border-[var(--editor-border)] bg-[var(--editor-surface)] px-4 py-4">
          <Button variant="ghost" size="xs" onClick={onExitComponentMode} className="-ml-2">
            <BackIcon size={13} /> Designer
          </Button>

          <Box className="mt-3 flex items-start gap-2">
            <Box className="flex size-8 shrink-0 items-center justify-center rounded-md bg-violet-50 text-violet-700">
              <PaletteIcon size={15} />
            </Box>
            <Box className="min-w-0 flex-1">
              <Box className="truncate text-sm font-semibold text-[var(--editor-text)]">
                {node.name}.{componentMode.variantName}
              </Box>
              <Box className="mt-0.5 truncate font-mono text-[10px] text-[var(--editor-text-muted)]">
                ctx.ui.{node.name}.variant.{componentMode.variantName}()
              </Box>
            </Box>
            {node.defaultVariant === componentMode.variantName ? (
              <Badge variant="warning" icon={<StarIcon size={8} fill="currentColor" />}>
                default
              </Badge>
            ) : null}
          </Box>
        </Box>

        <Box className="flex-1 overflow-auto p-4 space-y-6">
          <VariantPropertiesEditor
            node={node}
            variantName={componentMode.variantName}
            updateNode={updateNode}
            onEditVariant={onEditVariant}
          />
        </Box>
      </Box>
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
        setBinding={setBinding}
        onEditVariant={onEditVariant}
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
    <Box data-editor-ignore className="h-full flex flex-col">
      <PropertyPanelHeader
        key={node.id}
        node={node}
        renameNode={renameNode}
      />

      <Box className="flex-1 overflow-auto p-4 space-y-6">
        {node.type === "Page" && page ? (
          <PageSettingsEditor
            document={document}
            page={page}
            node={node}
            updateNode={updateNode}
            isStartPage={page.id === document.startPageId}
            onSetStartPage={() => setStartPage(page.id)}
            onSetLayout={(layoutId) => setPageLayout(page.id, layoutId)}
          />
        ) : null}

        {definition ? (
          <NodePropertiesEditor
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
          <Box className="text-xs text-amber-700">
            No component definition for {node.type}.
          </Box>
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
          <PanelSection divided>
            <Box className="flex items-start justify-between gap-3">
              <Box>
                <Box className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--editor-text-muted)]">
                  <BoxIcon size={12} /> Component
                </Box>
                <Box className="mt-1 text-[10px] text-[var(--editor-text-muted)]">
                  Encapsulate this subtree behind a public API.
                </Box>
              </Box>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  const componentId = createReusableComponent(node.id);
                  if (componentId) onEditComponentDefinition(componentId);
                }}
              >
                Create component
              </Button>
            </Box>
          </PanelSection>
        ) : null}

      </Box>
    </Box>
  );
}
