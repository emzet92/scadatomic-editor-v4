import type { ComponentInputType, UiComponentDefinition } from "../../core/document";
import type { InspectorControl } from "../../registry/component-definitions";

export function createInputControls(
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
