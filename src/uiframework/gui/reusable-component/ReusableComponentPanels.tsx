import {
  ArrowLeft,
  Box,
  Braces,
  Check,
  ExternalLink,
  LockKeyhole,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import type {
  Binding,
  ComponentInputType,
  HandlerRef,
  UiComponentDefinition,
  UiDocument,
  UiNode,
} from "../../core/document";
import {
  createComponentInput,
  getComponentDefinitionForInstance,
  getResolvedComponentInstanceProps,
} from "../../reusable-components";
import { getComponentApiPropertyNames } from "../../component-api";
import {
  getComponentDefinition,
  type InspectorControl,
} from "../../registry/component-definitions";
import { ComponentProperties } from "../property-panel/ComponentProperties";
import { VariantsEditor } from "../property-panel/VariantsEditor";
import { VariantPropertiesEditor } from "../property-panel/VariantPropertiesEditor";
import { PropertyPanelHeader } from "../property-panel/PropertyPanelHeader";
import type { RenameNodeResult } from "../../editor-store";
import type { UpdateNode } from "../property-panel/property-panel-types";

export function ComponentInstancePanel({
  document,
  node,
  updateNode,
  onEditDefinition,
  renameNode,
}: {
  document: UiDocument;
  node: UiNode;
  updateNode: UpdateNode;
  onEditDefinition: (componentId: string) => void;
  renameNode: (nodeId: string, name: string) => RenameNodeResult;
}) {
  const definition = getComponentDefinitionForInstance(document, node);
  if (!definition) {
    return <div className="p-4 text-xs text-red-600">Missing component definition.</div>;
  }

  const controls = createInputControls(definition);
  const values = getResolvedComponentInstanceProps(definition, node);

  return (
    <div data-editor-ignore className="h-full flex flex-col">
      <PropertyPanelHeader key={node.id} node={node} renameNode={renameNode} />

      <div className="border-b border-[var(--editor-border)] bg-violet-50/40 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-md bg-violet-100 text-violet-700">
            <Box size={15} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs font-semibold text-violet-800">{definition.name}</div>
            <div className="mt-0.5 truncate text-[10px] text-violet-500">Encapsulated component instance</div>
          </div>
          <button
            type="button"
            onClick={() => onEditDefinition(definition.id)}
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-violet-200 bg-white px-2.5 text-xs font-medium text-violet-700 hover:bg-violet-50"
          >
            Edit <ExternalLink size={11} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-5">
        <section>
          <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--editor-text-muted)]">
            Public properties
          </div>
          <ComponentProperties
            node={node}
            values={values}
            controls={controls}
            updateNode={updateNode}
            emptyMessage="This component exposes no input properties."
          />
        </section>

        <section className="border-t border-[var(--editor-border)] pt-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[var(--editor-text-muted)]">
            <Braces size={12} /> Public methods
          </div>
          <div className="mt-2 space-y-1">
            {Object.entries(definition.methods ?? {})
              .filter(([, method]) => method.visibility === "public")
              .map(([name]) => (
                <div key={name} className="rounded-md bg-[var(--editor-surface-muted)] px-2.5 py-2 font-mono text-xs">
                  ctx.ui.{node.name}.{name}()
                </div>
              ))}
            {Object.values(definition.methods ?? {}).every(
              (method) => method.visibility !== "public"
            ) ? (
              <div className="text-xs text-[var(--editor-text-muted)]">No public methods.</div>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}

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
  const internalNode = definition.nodes[selectedInternalNodeId] ?? definition.nodes[definition.rootId];
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
    updateDefinitionNode(nodeId, (current) => {
      const bindings = { ...(current.bindings ?? {}) };
      if (binding) bindings[property] = binding;
      else delete bindings[property];
      return {
        ...current,
        bindings: Object.keys(bindings).length > 0 ? bindings : undefined,
      };
    });
  };

  const setInternalEvent = (
    nodeId: string,
    eventName: string,
    handler: HandlerRef | null
  ) => {
    updateDefinitionNode(nodeId, (current) => {
      const events = { ...(current.events ?? {}) };
      if (handler) events[eventName] = handler;
      else delete events[eventName];
      return {
        ...current,
        events: Object.keys(events).length > 0 ? events : undefined,
      };
    });
  };

  return (
    <div data-editor-ignore className="h-full flex flex-col">
      <div className="border-b border-[var(--editor-border)] px-4 py-4">
        <button
          type="button"
          onClick={onExit}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--editor-text-muted)] hover:text-[var(--editor-text)]"
        >
          <ArrowLeft size={12} /> Designer
        </button>
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
          <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-[var(--editor-text-muted)]">
            Internal properties
          </div>
          <div className="mb-3 text-[10px] text-[var(--editor-text-muted)]">
            Private implementation · {internalNode?.name ?? "No selection"}
          </div>
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
                  bindingDefinitions={primitiveDefinition?.bindings}
                  setBinding={primitiveDefinition ? setInternalBinding : undefined}
                  eventDefinitions={primitiveDefinition?.events}
                  setEvent={primitiveDefinition ? setInternalEvent : undefined}
                  handlerIdPrefix={`component.${definition.id}`}
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

function PublicInputsEditor({
  projectDocument,
  definition,
  selectedNode,
  updateDefinition,
}: {
  projectDocument: UiDocument;
  definition: UiComponentDefinition;
  selectedNode: UiNode | undefined;
  updateDefinition: (
    updater: (definition: UiComponentDefinition) => UiComponentDefinition
  ) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [property, setProperty] = useState("");
  const [type, setType] = useState<ComponentInputType>("string");
  const [error, setError] = useState<string | null>(null);
  const properties = useMemo(
    () =>
      selectedNode
        ? getComponentApiPropertyNames(selectedNode, projectDocument)
        : [],
    [selectedNode, projectDocument]
  );

  function beginAdd() {
    const first = properties[0] ?? "";
    setAdding(true);
    setProperty(first);
    setName(first);
    setType(inferTypeFromProperty(first));
    setError(null);
  }

  function addInput() {
    if (!selectedNode) return;
    try {
      const input = createComponentInput(
        definition,
        selectedNode,
        property,
        name,
        type
      );
      const inputName = name.trim();
      updateDefinition((current) => ({
        ...current,
        inputs: {
          ...(current.inputs ?? {}),
          [inputName]: input,
        },
      }));
      setAdding(false);
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to expose input.");
    }
  }

  function removeInput(inputName: string) {
    updateDefinition((current) => {
      const inputs = { ...(current.inputs ?? {}) };
      delete inputs[inputName];
      return {
        ...current,
        inputs: Object.keys(inputs).length ? inputs : undefined,
      };
    });
  }

  return (
    <section>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-[var(--editor-text-muted)]">
            Public inputs
          </div>
          <div className="mt-1 text-[10px] text-[var(--editor-text-muted)]">
            Only these properties are visible on component instances.
          </div>
        </div>
        {!adding ? (
          <button
            type="button"
            disabled={!selectedNode || properties.length === 0}
            onClick={beginAdd}
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[var(--editor-border)] px-2.5 text-xs font-medium hover:bg-[var(--editor-surface-muted)] disabled:opacity-40"
          >
            <Plus size={12} /> Expose
          </button>
        ) : null}
      </div>

      <div className="mt-3 space-y-1.5">
        {Object.entries(definition.inputs ?? {}).map(([inputName, input]) => (
          <div key={inputName} className="group flex items-center gap-2 rounded-lg border border-[var(--editor-border)] px-2.5 py-2">
            <div className="min-w-0 flex-1">
              <div className="font-mono text-xs font-medium">{inputName}</div>
              <div className="mt-0.5 truncate text-[9px] text-[var(--editor-text-muted)]">
                {input.type} → {definition.nodes[input.target.nodeId]?.name ?? "?"}.{input.target.property}
              </div>
            </div>
            <button
              type="button"
              onClick={() => removeInput(inputName)}
              className="flex size-7 items-center justify-center rounded text-zinc-300 opacity-0 hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
              title="Remove public input"
            >
              <Trash2 size={12} />
            </button>
          </div>
        ))}
      </div>

      {adding ? (
        <div className="mt-3 rounded-lg border border-violet-200 bg-violet-50/50 p-3 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <label className="space-y-1">
              <span className="text-[9px] font-semibold uppercase tracking-wide text-zinc-400">API name</span>
              <input
                autoFocus
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  setError(null);
                }}
                className="h-8 w-full rounded border border-zinc-200 bg-white px-2 font-mono text-xs outline-none focus:border-violet-400"
              />
            </label>
            <label className="space-y-1">
              <span className="text-[9px] font-semibold uppercase tracking-wide text-zinc-400">Type</span>
              <select
                value={type}
                onChange={(event) => setType(event.target.value as ComponentInputType)}
                className="h-8 w-full rounded border border-zinc-200 bg-white px-2 text-xs outline-none focus:border-violet-400"
              >
                <option value="string">String</option>
                <option value="number">Number</option>
                <option value="boolean">Boolean</option>
                <option value="color">Color</option>
                <option value="tag">Tag</option>
              </select>
            </label>
          </div>

          <label className="block space-y-1">
            <span className="text-[9px] font-semibold uppercase tracking-wide text-zinc-400">Maps to</span>
            <select
              value={property}
              onChange={(event) => {
                const next = event.target.value;
                setProperty(next);
                if (!name) setName(next);
                setType(inferTypeFromProperty(next));
              }}
              className="h-8 w-full rounded border border-zinc-200 bg-white px-2 font-mono text-xs outline-none focus:border-violet-400"
            >
              {properties.map((prop) => (
                <option key={prop} value={prop}>
                  {selectedNode?.name}.{prop}
                </option>
              ))}
            </select>
          </label>

          {error ? <div className="text-[10px] text-red-600">{error}</div> : null}

          <div className="flex justify-end gap-1.5 pt-1">
            <button
              type="button"
              onClick={() => setAdding(false)}
              className="flex size-8 items-center justify-center rounded text-zinc-400 hover:bg-white"
            >
              <X size={12} />
            </button>
            <button
              type="button"
              onClick={addInput}
              className="inline-flex h-8 items-center gap-1.5 rounded bg-violet-600 px-3 text-xs font-medium text-white hover:bg-violet-500"
            >
              <Check size={12} /> Expose input
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function createInputControls(
  definition: UiComponentDefinition
): Record<string, InspectorControl> {
  return Object.fromEntries(
    Object.entries(definition.inputs ?? {}).map(([name, input]) => [
      name,
      inputTypeToControl(input.type),
    ])
  );
}

function inputTypeToControl(type: ComponentInputType): InspectorControl {
  switch (type) {
    case "number":
      return { kind: "number" };
    case "boolean":
      return { kind: "toggle" };
    case "color":
      return { kind: "color" };
    case "tag":
    case "string":
    default:
      return { kind: "text" };
  }
}

function inferTypeFromProperty(property: string): ComponentInputType {
  if (/color/i.test(property)) return "color";
  if (/tag/i.test(property)) return "tag";
  return "string";
}
