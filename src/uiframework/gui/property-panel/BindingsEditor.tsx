import type { Binding, ComponentInputDefinition } from "../../core/document";
import { useEditorStore } from "../../editor-store";
import { FormField, SectionHeader, TextInput } from "../ui";
import {
  formatBindingPath,
  getKnownBindingPaths,
  parseBindingPath,
} from "./binding-paths";

export function BindingsEditor({
  nodeId,
  definitions,
  bindings,
  setBinding,
  componentInputs,
}: {
  nodeId: string;
  definitions: Record<string, { label: string }>;
  bindings: Record<string, Binding> | undefined;
  setBinding: (
    nodeId: string,
    property: string,
    binding: Binding | null
  ) => void;
  componentInputs?: Record<string, ComponentInputDefinition> | undefined;
}) {
  const projectData = useEditorStore((state) => state.document.data);
  const { all: knownTagPaths, relativePaths } = getKnownBindingPaths(
    projectData,
    componentInputs,
  );
  const dataListId = `tag-paths-${nodeId}`;

  return (
    <div className="pt-4 border-t border-[var(--editor-border)] space-y-3">
      <datalist id={dataListId}>
        {knownTagPaths.map((path) => <option key={path} value={path} />)}
      </datalist>
      <SectionHeader
        title="Bindings"
        description={relativePaths.length > 0
          ? "Bind to project tags or a public TagRef input, e.g. pump.rpm."
          : "Bind component properties to runtime tags."}
      />

      {Object.entries(definitions).map(([property, definition]) => {
        const current = bindings?.[property];
        const value = formatBindingPath(current);

        return (
          <FormField key={property} label={`${definition.label} · ${property}`}>
            <TextInput
              type="text"
              list={dataListId}
              value={value}
              placeholder={relativePaths[0] ?? "Pump1.speed"}
              onChange={(event) => {
                const path = event.target.value.trim();
                setBinding(nodeId, property, parseBindingPath(path, componentInputs));
              }}
            />
          </FormField>
        );
      })}
    </div>
  );
}
