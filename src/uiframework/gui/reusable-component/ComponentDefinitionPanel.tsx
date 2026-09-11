import { ArrowLeft, Box, LockKeyhole } from "lucide-react";
import type {
  Binding,
  HandlerRef,
  UiComponentDefinition,
  UiDocument,
  UiNode,
} from "../../core/document";
import { setOptionalRecordEntry } from "../../core/optional-record";
import {
  getComponentDefinitionForInstance,
  getResolvedComponentInstanceProps,
} from "../../reusable-components";
import { getComponentDefinition } from "../../registry/component-definitions";
import { ComponentProperties } from "../property-panel/ComponentProperties";
import type { UpdateNode } from "../property-panel/property-panel-types";
import { VariantPropertiesEditor } from "../property-panel/VariantPropertiesEditor";
import { VariantsEditor } from "../property-panel/VariantsEditor";
import { Button, SectionHeader } from "../ui";
import { createInputControls } from "./component-input-controls";
import { PublicInputsEditor } from "./PublicInputsEditor";

export function ComponentDefinitionPanel({
  projectDocument,
  definition,
  selectedInternalNodeId,
  updateDefinition,
  updateDefinitionNode,
  editingVariantName,
  onEditVariant,
  onExit,
}: {
  projectDocument: UiDocument;
  definition: UiComponentDefinition;
  selectedInternalNodeId: string;
  updateDefinition: (
    updater: (definition: UiComponentDefinition) => UiComponentDefinition
  ) => void;
  updateDefinitionNode: (nodeId: string, updater: (node: UiNode) => UiNode) => void;
  editingVariantName?: string | undefined;
  onEditVariant: (nodeId: string, variantName: string) => void;
  onExit: () => void;
}) {
  const internalNode =
    definition.nodes[selectedInternalNodeId] ?? definition.nodes[definition.rootId];
  const primitiveDefinition = internalNode
    ? getComponentDefinition(internalNode.type)
    : undefined;
  const nestedDefinition = internalNode
    ? getComponentDefinitionForInstance(projectDocument, internalNode)
    : undefined;
  const internalControls = nestedDefinition
    ? createInputControls(nestedDefinition)
    : primitiveDefinition?.inspector;
  const internalValues = internalNode
    ? nestedDefinition
      ? getResolvedComponentInstanceProps(nestedDefinition, internalNode)
      : {
          ...(primitiveDefinition?.defaults ?? {}),
          ...(internalNode.props ?? {}),
        }
    : {};

  const updateInternalNode: UpdateNode = (nodeId, updater) => {
    updateDefinitionNode(nodeId, updater);
  };

  const setInternalBinding = (
    nodeId: string,
    property: string,
    binding: Binding | null
  ) => {
    updateDefinitionNode(nodeId, (current) => ({
      ...current,
      bindings: setOptionalRecordEntry(current.bindings, property, binding),
    }));
  };

  const setInternalEvent = (
    nodeId: string,
    eventName: string,
    handler: HandlerRef | null
  ) => {
    updateDefinitionNode(nodeId, (current) => ({
      ...current,
      events: setOptionalRecordEntry(current.events, eventName, handler),
    }));
  };

  return (
    <div data-editor-ignore className="h-full flex flex-col">
      <div className="border-b border-[var(--editor-border)] px-4 py-4">
        <Button variant="ghost" size="xs" onClick={onExit} className="-ml-2">
          <ArrowLeft size={12} /> Designer
        </Button>
        <div className="mt-3 flex items-start gap-2">
          <div className="flex size-8 items-center justify-center rounded-md bg-violet-50 text-violet-700">
            <Box size={15} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold">{definition.name}</div>
            <div className="mt-0.5 flex items-center gap-1 text-[10px] text-violet-600">
              <LockKeyhole size={10} /> Encapsulated component definition
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-6">
        <PublicInputsEditor
          projectDocument={projectDocument}
          definition={definition}
          selectedNode={internalNode}
          updateDefinition={updateDefinition}
        />

        <section className="border-t border-[var(--editor-border)] pt-5">
          <SectionHeader
            title="Internal properties"
            description={`Private implementation · ${internalNode?.name ?? "No selection"}`}
            className="mb-3"
          />
          {internalNode && internalControls ? (
            editingVariantName && primitiveDefinition ? (
              <VariantPropertiesEditor
                node={internalNode}
                variantName={editingVariantName}
                updateNode={updateInternalNode}
                onEditVariant={onEditVariant}
              />
            ) : (
              <>
                <ComponentProperties
                  node={internalNode}
                  values={internalValues}
                  controls={internalControls}
                  updateNode={updateInternalNode}
                  {...(primitiveDefinition?.bindings
                    ? {
                        bindingDefinitions: primitiveDefinition.bindings,
                        setBinding: setInternalBinding,
                        componentInputs: definition.inputs,
                      }
                    : {})}
                  {...(primitiveDefinition?.events
                    ? {
                        eventDefinitions: primitiveDefinition.events,
                        setEvent: setInternalEvent,
                        handlerIdPrefix: `component.${definition.id}`,
                      }
                    : {})}
                />

                {primitiveDefinition ? (
                  <VariantsEditor
                    node={internalNode}
                    updateNode={updateInternalNode}
                    onEditVariant={onEditVariant}
                  />
                ) : null}
              </>
            )
          ) : (
            <div className="text-xs text-[var(--editor-text-muted)]">
              Select an internal component to edit its properties.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
