import type { UiDocument, UiNode } from "../../core/document";
import type { UpdateNode } from "../property-panel/property-panel-types";
import { FormField, PanelCard, SectionHeader, Select } from "../ui";

export function RepeatBehaviorEditor({
  document,
  node,
  updateNode,
}: {
  document: UiDocument;
  node: UiNode;
  updateNode: UpdateNode;
}) {
  const behavior = node.contentBehavior;
  const mode = behavior?.kind === "repeat" ? "repeat" : "static";
  const udts = Object.values(document.data?.udts ?? {});
  const selectedUdtId = behavior?.kind === "repeat" ? behavior.source.udtId : udts[0]?.id ?? "";
  const templates = getCompatibleTemplates(document, selectedUdtId);
  const selectedTemplate = behavior?.kind === "repeat"
    ? templates.find((entry) => entry.definition.id === behavior.template.componentDefinitionId)
    : templates[0];
  const selectedInputName = behavior?.kind === "repeat"
    ? behavior.template.inputName
    : selectedTemplate?.inputs[0] ?? "";

  function setRepeat(nextUdtId: string, preferredComponentId?: string, preferredInputName?: string) {
    const compatible = getCompatibleTemplates(document, nextUdtId);
    const template = compatible.find((entry) => entry.definition.id === preferredComponentId) ?? compatible[0];
    const inputName = template?.inputs.includes(preferredInputName ?? "")
      ? preferredInputName!
      : template?.inputs[0];
    if (!template || !inputName) return;

    updateNode(node.id, (current) => ({
      ...current,
      contentBehavior: {
        kind: "repeat",
        source: { kind: "tagsByUdt", udtId: nextUdtId },
        template: {
          componentDefinitionId: template.definition.id,
          inputName,
        },
      },
    }));
  }

  return (
    <section className="border-t border-[var(--editor-border)] pt-5">
      <SectionHeader
        title="Content"
        description="Render static children or repeat a reusable component for project tags."
      />
      <PanelCard className="mt-3 space-y-3">
        <FormField label="Mode">
          <Select
            value={mode}
            onChange={(event) => {
              if (event.target.value === "static") {
                updateNode(node.id, (current) => ({ ...current, contentBehavior: { kind: "static" } }));
                return;
              }
              if (selectedUdtId) setRepeat(selectedUdtId);
            }}
          >
            <option value="static">Static</option>
            <option value="repeat" disabled={udts.length === 0}>Repeat tags</option>
          </Select>
        </FormField>

        {mode === "repeat" ? (
          <>
            <FormField label="Data source">
              <Select value="tagsByUdt" disabled>
                <option value="tagsByUdt">Tags by UDT</option>
              </Select>
            </FormField>
            <FormField label="UDT">
              <Select
                value={selectedUdtId}
                onChange={(event) => setRepeat(event.target.value)}
              >
                {udts.map((udt) => <option key={udt.id} value={udt.id}>{udt.name}</option>)}
              </Select>
            </FormField>
            <FormField label="Template">
              <Select
                value={selectedTemplate?.definition.id ?? ""}
                onChange={(event) => setRepeat(selectedUdtId, event.target.value)}
              >
                {templates.length === 0 ? <option value="">No compatible components</option> : null}
                {templates.map(({ definition }) => (
                  <option key={definition.id} value={definition.id}>{definition.name}</option>
                ))}
              </Select>
            </FormField>
            <FormField label="Bind item to">
              <Select
                value={selectedInputName}
                onChange={(event) => setRepeat(selectedUdtId, selectedTemplate?.definition.id, event.target.value)}
              >
                {(selectedTemplate?.inputs ?? []).map((inputName) => (
                  <option key={inputName} value={inputName}>{inputName}</option>
                ))}
              </Select>
            </FormField>
            {templates.length === 0 ? (
              <div className="text-[10px] text-amber-700">
                Create a user component with a public TagRef input for this UDT first.
              </div>
            ) : null}
          </>
        ) : null}
      </PanelCard>
    </section>
  );
}

function getCompatibleTemplates(document: UiDocument, udtId: string) {
  return Object.values(document.components ?? {})
    .map((definition) => ({
      definition,
      inputs: Object.entries(definition.inputs ?? {})
        .filter(([, input]) => input.type === "tagRef" && input.udtId === udtId)
        .map(([name]) => name),
    }))
    .filter((entry) => entry.inputs.length > 0)
    .sort((left, right) => left.definition.name.localeCompare(right.definition.name));
}
