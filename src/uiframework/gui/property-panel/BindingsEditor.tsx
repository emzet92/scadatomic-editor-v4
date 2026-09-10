import type { Binding } from "../../core/document";
import { flattenTagValues } from "../../data/runtime/UdtRuntime";
import { useEditorStore } from "../../editor-store";
import { FormField, SectionHeader, TextInput } from "../ui";

export function BindingsEditor({
  nodeId,
  definitions,
  bindings,
  setBinding,
}: {
  nodeId: string;
  definitions: Record<string, { label: string }>;
  bindings: Record<string, Binding> | undefined;
  setBinding: (
    nodeId: string,
    property: string,
    binding: Binding | null
  ) => void;
}) {
  const projectData = useEditorStore((state) => state.document.data);
  const knownTagPaths = flattenTagValues(projectData ?? { udts: {}, tags: {} }).map(([path]) => path);
  const dataListId = `tag-paths-${nodeId}`;

  return (
    <div className="pt-4 border-t border-[var(--editor-border)] space-y-3">
      <datalist id={dataListId}>
        {knownTagPaths.map((path) => <option key={path} value={path} />)}
      </datalist>
      <SectionHeader
        title="Bindings"
        description="Bind component properties to runtime tags."
      />

      {Object.entries(definitions).map(([property, definition]) => {
        const current = bindings?.[property];
        const value = current?.kind === "tag" ? current.path : "";

        return (
          <FormField
            key={property}
            label={`${definition.label} · ${property}`}
          >
            <TextInput
              type="text"
              list={dataListId}
              value={value}
              placeholder="pump.speed"
              onChange={(event) => {
                const path = event.target.value.trim();
                setBinding(
                  nodeId,
                  property,
                  path ? { kind: "tag", path } : null
                );
              }}
            />
          </FormField>
        );
      })}
    </div>
  );
}
