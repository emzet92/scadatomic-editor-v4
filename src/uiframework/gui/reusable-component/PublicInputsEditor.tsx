import { Check, Plus, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";
import type {
  ComponentInputDefinition,
  ComponentInputType,
  UiComponentDefinition,
  UiDocument,
  UiNode,
} from "../../core/document";
import { setOptionalRecordEntry } from "../../core/optional-record";
import {
  listComponentInputTargets,
  selectComponentInputTarget,
} from "../../reusable-component-input-targets";
import {
  createComponentInput,
  getComponentInputTargetType,
  inferInputType,
} from "../../reusable-components";
import {
  Button,
  FormField,
  IconButton,
  PanelCard,
  SectionHeader,
  Select,
  TextInput,
} from "../ui";

export function PublicInputsEditor({
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
  const [targetNodeId, setTargetNodeId] = useState("");
  const [property, setProperty] = useState("");
  const [type, setType] = useState<ComponentInputType>("string");
  const [error, setError] = useState<string | null>(null);

  const targetNodes = useMemo(
    () => listComponentInputTargets(definition, projectDocument),
    [definition, projectDocument]
  );
  const targetNodeEntry = targetNodes.find(
    (entry) => entry.node.id === targetNodeId
  );

  function resolveType(node: UiNode, propertyName: string) {
    return (
      getComponentInputTargetType(projectDocument, node, propertyName) ??
      inferInputType(propertyName, undefined)
    );
  }

  function selectTarget(nodeId: string, nextProperty?: string) {
    const selection = selectComponentInputTarget(
      targetNodes,
      nodeId,
      nextProperty
    );
    if (!selection) return;

    setTargetNodeId(selection.target.node.id);
    setProperty(selection.property);
    if (!name) setName(selection.property);
    setType(resolveType(selection.target.node, selection.property));
    setError(null);
  }

  function beginAdd() {
    const first =
      targetNodes.find((entry) => entry.node.id === selectedNode?.id) ??
      targetNodes[0];
    if (!first) return;

    const firstProperty = first.properties[0];
    if (!firstProperty) return;

    setAdding(true);
    setTargetNodeId(first.node.id);
    setProperty(firstProperty);
    setName(firstProperty);
    setType(resolveType(first.node, firstProperty));
    setError(null);
  }

  function addInput() {
    if (!targetNodeEntry) return;

    try {
      const input = createComponentInput(
        definition,
        targetNodeEntry.node,
        property,
        name,
        type,
        projectDocument
      );
      const inputName = name.trim();

      updateDefinition((current) => ({
        ...current,
        inputs: setOptionalRecordEntry<ComponentInputDefinition>(
          current.inputs,
          inputName,
          input
        ),
      }));
      setAdding(false);
      setError(null);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Failed to expose input."
      );
    }
  }

  function removeInput(inputName: string) {
    updateDefinition((current) => ({
      ...current,
      inputs: setOptionalRecordEntry<ComponentInputDefinition>(
        current.inputs,
        inputName,
        null
      ),
    }));
  }

  return (
    <section>
      <SectionHeader
        title="Public inputs"
        description="Only these properties are visible on component instances."
        action={
          !adding ? (
            <Button disabled={targetNodes.length === 0} onClick={beginAdd}>
              <Plus size={12} /> Expose
            </Button>
          ) : null
        }
      />

      <div className="mt-3 space-y-1.5">
        {Object.entries(definition.inputs ?? {}).map(([inputName, input]) => (
          <div
            key={inputName}
            className="group flex items-center gap-2 rounded-lg border border-[var(--editor-border)] px-2.5 py-2"
          >
            <div className="min-w-0 flex-1">
              <div className="font-mono text-xs font-medium">{inputName}</div>
              <div className="mt-0.5 truncate text-[9px] text-[var(--editor-text-muted)]">
                {input.type} → {definition.nodes[input.target.nodeId]?.name ?? "?"}.
                {input.target.property}
              </div>
            </div>
            <IconButton
              variant="danger"
              aria-label={`Remove ${inputName} public input`}
              onClick={() => removeInput(inputName)}
              className="opacity-0 group-hover:opacity-100"
              title="Remove public input"
            >
              <Trash2 size={12} />
            </IconButton>
          </div>
        ))}
      </div>

      {adding ? (
        <PanelCard accent className="mt-3 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <FormField label="API name" compact>
              <TextInput
                autoFocus
                controlSize="sm"
                mono
                value={name}
                invalid={!!error}
                onChange={(event) => {
                  setName(event.target.value);
                  setError(null);
                }}
              />
            </FormField>
            <FormField label="Type" compact>
              <Select
                controlSize="sm"
                value={type}
                onChange={(event) =>
                  setType(event.target.value as ComponentInputType)
                }
              >
                <option value="string">String</option>
                <option value="number">Number</option>
                <option value="boolean">Boolean</option>
                <option value="color">Color</option>
                <option value="tag">Tag</option>
              </Select>
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <FormField label="Maps to component" compact>
              <Select
                controlSize="sm"
                mono
                value={targetNodeId}
                onChange={(event) => selectTarget(event.target.value)}
              >
                {targetNodes.map(({ node }) => (
                  <option key={node.id} value={node.id}>
                    {node.name}
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField label="Property" compact>
              <Select
                controlSize="sm"
                mono
                value={property}
                onChange={(event) => {
                  if (!targetNodeEntry) return;
                  selectTarget(targetNodeEntry.node.id, event.target.value);
                }}
              >
                {(targetNodeEntry?.properties ?? []).map((prop) => (
                  <option key={prop} value={prop}>
                    {prop}
                  </option>
                ))}
              </Select>
            </FormField>
          </div>

          {error ? <div className="text-[10px] text-red-600">{error}</div> : null}

          <div className="flex justify-end gap-1.5 pt-1">
            <IconButton
              aria-label="Cancel exposing input"
              onClick={() => setAdding(false)}
              title="Cancel"
            >
              <X size={12} />
            </IconButton>
            <Button variant="primary" onClick={addInput}>
              <Check size={12} /> Expose input
            </Button>
          </div>
        </PanelCard>
      ) : null}
    </section>
  );
}
