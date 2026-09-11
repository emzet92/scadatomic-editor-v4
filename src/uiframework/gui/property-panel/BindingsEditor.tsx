import type { Binding, ComponentInputDefinition } from "../../core/document";
import { flattenTagValues } from "../../data/runtime/UdtRuntime";
import { useEditorStore } from "../../editor-store";
import { FormField, SectionHeader, TextInput } from "../ui";

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
  const absolutePaths = flattenTagValues(projectData ?? { udts: {}, tags: {} }).map(([path]) => path);
  const relativePaths = Object.entries(componentInputs ?? {}).flatMap(([inputName, input]) => {
    if (input.type !== "tagRef") return [];
    const udt = projectData?.udts[input.udtId];
    if (!udt) return [];
    return collectUdtFieldPaths(projectData?.udts ?? {}, inputName, udt.id);
  });
  const knownTagPaths = [...absolutePaths, ...relativePaths];
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
        const value = current?.kind === "tag"
          ? current.path
          : current?.kind === "tagRef"
            ? `${current.input}${current.path ? `.${current.path}` : ""}`
            : "";

        return (
          <FormField key={property} label={`${definition.label} · ${property}`}>
            <TextInput
              type="text"
              list={dataListId}
              value={value}
              placeholder={relativePaths[0] ?? "Pump1.speed"}
              onChange={(event) => {
                const path = event.target.value.trim();
                setBinding(nodeId, property, parseBinding(path, componentInputs));
              }}
            />
          </FormField>
        );
      })}
    </div>
  );
}

function parseBinding(
  path: string,
  componentInputs: Record<string, ComponentInputDefinition> | undefined
): Binding | null {
  if (!path) return null;
  const [root, ...tail] = path.split(".").filter(Boolean);
  const input = root ? componentInputs?.[root] : undefined;
  if (root && input?.type === "tagRef") {
    return { kind: "tagRef", input: root, path: tail.join(".") };
  }
  return { kind: "tag", path };
}

function collectUdtFieldPaths(
  udts: import("../../data/tags/TagDefinition").ProjectData["udts"],
  prefix: string,
  udtId: string,
  visited = new Set<string>()
): string[] {
  if (visited.has(udtId)) return [];
  const definition = udts[udtId];
  if (!definition) return [];
  const nextVisited = new Set(visited);
  nextVisited.add(udtId);

  return definition.fields.flatMap((field) => {
    const path = `${prefix}.${field.name}`;
    return field.type.kind === "udt"
      ? [path, ...collectUdtFieldPaths(udts, path, field.type.udtId, nextVisited)]
      : [path];
  });
}
