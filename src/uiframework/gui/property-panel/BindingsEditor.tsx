import type { Binding } from "../../core/document";
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
  return (
    <div className="pt-4 border-t border-[var(--editor-border)] space-y-3">
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
