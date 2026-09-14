import type { ComponentTagReactiveRef } from "../../../reactivity";
import type { Binding, ComponentInputDefinition } from "../../core/document";
import type { ProjectData } from "../../data/tags/TagDefinition";
import { flattenTagValues } from "../../data/runtime/UdtRuntime";

export function getKnownBindingPaths(
  projectData: ProjectData | undefined,
  componentInputs: Record<string, ComponentInputDefinition> | undefined,
) {
  const absolutePaths = flattenTagValues(projectData ?? { udts: {}, tags: {} }).map(
    ([path]) => path,
  );
  const relativePaths = Object.entries(componentInputs ?? {}).flatMap(
    ([inputName, input]) => {
      if (input.type !== "tagRef") return [];
      const udt = projectData?.udts[input.udtId];
      if (!udt) return [];
      return collectUdtFieldPaths(projectData?.udts ?? {}, inputName, udt.id);
    },
  );

  return {
    absolutePaths,
    relativePaths,
    all: [...absolutePaths, ...relativePaths],
  };
}

export function parseBindingPath(
  path: string,
  componentInputs: Record<string, ComponentInputDefinition> | undefined,
): Binding | null {
  if (!path) return null;
  const [root, ...tail] = path.split(".").filter(Boolean);
  const input = root ? componentInputs?.[root] : undefined;
  if (root && input?.type === "tagRef") {
    return { kind: "tagRef", input: root, path: tail.join(".") };
  }
  return { kind: "tag", path };
}

export function formatBindingPath(binding: Binding | undefined) {
  if (!binding) return "";
  if (binding.kind === "reactive") {
    const dependency = binding.dependencies.find(
      (ref) => ref.kind === "tag" || ref.kind === "component-tag"
    );
    return dependency?.path ?? "";
  }
  return binding.kind === "tag"
    ? binding.path
    : `${binding.input}${binding.path ? `.${binding.path}` : ""}`;
}

export function createComponentTagReactiveRef(
  path: string,
  projectData: ProjectData | undefined,
  componentInputs: Record<string, ComponentInputDefinition> | undefined,
): ComponentTagReactiveRef | undefined {
  const [inputName, ...segments] = path.split(".").filter(Boolean);
  if (!inputName || segments.length === 0) return undefined;
  const input = componentInputs?.[inputName];
  if (!input || input.type !== "tagRef" || !projectData) return undefined;

  let udtId = input.udtId;
  const fieldIds: string[] = [];
  for (const segment of segments) {
    const definition = projectData.udts[udtId];
    const field = definition?.fields.find((candidate) => candidate.name === segment);
    if (!field) return undefined;
    fieldIds.push(field.id);
    if (field.type.kind === "udt") {
      udtId = field.type.udtId;
    } else if (segment !== segments[segments.length - 1]) {
      return undefined;
    }
  }

  return {
    kind: "component-tag",
    input: inputName,
    fieldIds,
    path,
  };
}

function collectUdtFieldPaths(
  udts: ProjectData["udts"],
  prefix: string,
  udtId: string,
  visited = new Set<string>(),
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
