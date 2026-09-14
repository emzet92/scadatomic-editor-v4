import type {
  Binding,
  HandlerRef,
  UiComponentDefinition,
  UiNode,
} from "../../core/document";
import type {
  ComponentDefinition,
  InspectorControl,
} from "../../registry/component-definitions";
import { ButtonLayoutEditor } from "./ButtonLayoutEditor";
import { ComponentProperties } from "./ComponentProperties";
import { ContainerLayoutEditor } from "./ContainerLayoutEditor";
import type { UpdateNode } from "./property-panel-types";

const BUTTON_LAYOUT_CONTROL_KEYS = new Set([
  "paddingX",
  "paddingY",
  "marginX",
  "marginY",
  "borderRadius",
]);

const CONTAINER_LAYOUT_CONTROL_KEYS = new Set([
  "padding",
  "gap",
  "columns",
  "display",
  "gridMode",
  "minColumnWidth",
  "minRowHeight",
  "gridRowMode",
  "gridItemAlignment",
  "borderRadius",
]);

/**
 * One property surface for primitive nodes in both the Page designer and the
 * reusable-component designer. Container layout is intentionally handled here
 * so there is no second/raw inspector path that can drift from the main grid UX.
 */
export function NodePropertiesEditor({
  node,
  values,
  controls,
  updateNode,
  bindingDefinitions,
  setBinding,
  eventDefinitions,
  setEvent,
  handlerIdPrefix,
  emptyMessage,
  componentInputs,
}: {
  node: UiNode;
  values: Record<string, unknown>;
  controls: Record<string, InspectorControl>;
  updateNode: UpdateNode;
  bindingDefinitions?: ComponentDefinition["bindings"];
  setBinding?: (
    nodeId: string,
    property: string,
    binding: Binding | null
  ) => void;
  eventDefinitions?: ComponentDefinition["events"];
  setEvent?: (
    nodeId: string,
    event: string,
    handler: HandlerRef | null
  ) => void;
  handlerIdPrefix?: string;
  emptyMessage?: string;
  componentInputs?: UiComponentDefinition["inputs"];
}) {
  const resolvedControls =
    node.type === "Container"
      ? omitControls(controls, CONTAINER_LAYOUT_CONTROL_KEYS)
      : node.type === "Button"
        ? omitControls(controls, BUTTON_LAYOUT_CONTROL_KEYS)
        : controls;

  const resolvedBindingDefinitions = {
    ...(bindingDefinitions ?? {}),
    ...(Object.keys(node.variants ?? {}).length > 0
      ? {
          "$variant": {
            label: "Variant",
            valueType: "variant" as const,
            description: "Drive the visual variant from runtime state.",
          },
        }
      : {}),
  };

  return (
    <div className="space-y-5">
      {node.type === "Container" ? (
        <ContainerLayoutEditor node={node} updateNode={updateNode} />
      ) : null}

      {node.type === "Button" ? (
        <ButtonLayoutEditor node={node} updateNode={updateNode} />
      ) : null}

      <ComponentProperties
        node={node}
        values={values}
        controls={resolvedControls}
        updateNode={updateNode}
        {...(Object.keys(resolvedBindingDefinitions).length > 0
          ? { bindingDefinitions: resolvedBindingDefinitions }
          : {})}
        {...(setBinding ? { setBinding } : {})}
        {...(eventDefinitions ? { eventDefinitions } : {})}
        {...(setEvent ? { setEvent } : {})}
        {...(handlerIdPrefix ? { handlerIdPrefix } : {})}
        {...(emptyMessage ? { emptyMessage } : {})}
        {...(componentInputs ? { componentInputs } : {})}
      />
    </div>
  );
}

function omitControls<T extends Record<string, unknown>>(
  controls: T,
  omittedKeys: ReadonlySet<string>
) {
  return Object.fromEntries(
    Object.entries(controls).filter(([key]) => !omittedKeys.has(key))
  ) as T;
}
