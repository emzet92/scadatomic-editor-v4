import type { Binding, UiDocument, UiNode } from "../../core/document";
import type { RenameNodeResult } from "../../editor-store";
import {
  getComponentDefinitionForInstance,
  getResolvedComponentInstanceProps,
} from "../../reusable-components";
import { ComponentProperties } from "../property-panel/ComponentProperties";
import { BindingsEditor } from "../property-panel/BindingsEditor";
import { VariantsEditor } from "../property-panel/VariantsEditor";
import { PropertyPanelHeader } from "../property-panel/PropertyPanelHeader";
import type { UpdateNode } from "../property-panel/property-panel-types";
import {
  Box,
  BoxIcon,
  BracesIcon,
  Button,
  ExternalLinkIcon
} from "../ui";
import { createInputControls } from "./component-input-controls";

export function ComponentInstancePanel({
  document,
  node,
  updateNode,
  onEditDefinition,
  renameNode,
  setBinding,
  onEditVariant,
}: {
  document: UiDocument;
  node: UiNode;
  updateNode: UpdateNode;
  onEditDefinition: (componentId: string) => void;
  renameNode: (nodeId: string, name: string) => RenameNodeResult;
  setBinding: (nodeId: string, property: string, binding: Binding | null) => void;
  onEditVariant: (nodeId: string, variantName: string) => void;
}) {
  const definition = getComponentDefinitionForInstance(document, node);
  if (!definition) {
    return (
      <Box className="p-4 text-xs text-red-600">Missing component definition.</Box>
    );
  }

  const controls = createInputControls(definition);
  const values = getResolvedComponentInstanceProps(definition, node);

  return (
    <Box data-editor-ignore className="h-full flex flex-col">
      <PropertyPanelHeader key={node.id} node={node} renameNode={renameNode} />

      <Box className="border-b border-[var(--editor-border)] bg-violet-50/40 px-4 py-3">
        <Box className="flex items-center gap-2">
          <Box className="flex size-8 items-center justify-center rounded-md bg-violet-100 text-violet-700">
            <BoxIcon size={15} />
          </Box>
          <Box className="min-w-0 flex-1">
            <Box className="truncate text-xs font-semibold text-violet-800">
              {definition.name}
            </Box>
            <Box className="mt-0.5 truncate text-[10px] text-violet-500">
              Encapsulated component instance
            </Box>
          </Box>
          <Button
            onClick={() => onEditDefinition(definition.id)}
            className="border-violet-200 text-violet-700 hover:bg-violet-50"
          >
            Edit <ExternalLinkIcon size={11} />
          </Button>
        </Box>
      </Box>

      <Box className="flex-1 overflow-auto p-4 space-y-5">
        <section>
          <Box className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--editor-text-muted)]">
            Public properties
          </Box>
          <ComponentProperties
            node={node}
            values={values}
            controls={controls}
            updateNode={updateNode}
            emptyMessage="This component exposes no input properties."
          />

          <BindingsEditor
            node={node}
            definitions={{
              visible: { label: "Visible", valueType: "boolean" },
              ...(Object.keys(node.variants ?? {}).length > 0
                ? { "$variant": { label: "Variant", valueType: "variant" as const } }
                : {}),
            }}
            bindings={node.bindings}
            setBinding={setBinding}
          />

          {Object.keys(node.variants ?? {}).length > 0 ? (
            <VariantsEditor node={node} updateNode={updateNode} onEditVariant={onEditVariant} />
          ) : null}
        </section>

        <section className="border-t border-[var(--editor-border)] pt-4">
          <Box className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[var(--editor-text-muted)]">
            <BracesIcon size={12} /> Public methods
          </Box>
          <Box className="mt-2 space-y-1">
            {Object.entries(definition.methods ?? {})
              .filter(([, method]) => method.visibility === "public")
              .map(([name]) => (
                <Box
                  key={name}
                  className="rounded-md bg-[var(--editor-surface-muted)] px-2.5 py-2 font-mono text-xs"
                >
                  ctx.ui.{node.name}.{name}()
                </Box>
              ))}
            {Object.values(definition.methods ?? {}).every(
              (method) => method.visibility !== "public"
            ) ? (
              <Box className="text-xs text-[var(--editor-text-muted)]">
                No public methods.
              </Box>
            ) : null}
          </Box>
        </section>
      </Box>
    </Box>
  );
}
