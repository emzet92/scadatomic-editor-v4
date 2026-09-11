import type {
  Binding,
  HandlerRef,
  UiNode,
} from "../../core/document";
import type {
  ComponentDefinition,
  InspectorControl,
} from "../../registry/component-definitions";
import { BindingsEditor } from "./BindingsEditor";
import { EventsEditor } from "./EventsEditor";
import { PropsEditor } from "./PropsEditor";
import type { UpdateNode } from "./property-panel-types";

/**
 * Shared property surface for every editable component node.
 *
 * The registry remains the source of truth for visual properties, bindings and
 * events. This component only renders that metadata against the supplied node
 * mutation functions, so the exact same inspector is used on a Page node and
 * on a private node inside a reusable component definition.
 */
export function ComponentProperties({
  node,
  values,
  controls,
  updateNode,
  bindingDefinitions,
  setBinding,
  eventDefinitions,
  setEvent,
  handlerIdPrefix,
  emptyMessage = "This component exposes no editable properties.",
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
  /** Optional scope for generated handler ids used by private definition nodes. */
  handlerIdPrefix?: string;
  emptyMessage?: string;
  componentInputs?: import("../../core/document").UiComponentDefinition["inputs"];
}) {
  const hasControls = Object.keys(controls).length > 0;

  return (
    <div className="space-y-5">
      {hasControls ? (
        <PropsEditor
          nodeId={node.id}
          values={values}
          controls={controls}
          updateNode={updateNode}
        />
      ) : (
        <div className="rounded-lg border border-dashed border-[var(--editor-border)] p-3 text-xs text-[var(--editor-text-muted)]">
          {emptyMessage}
        </div>
      )}

      {bindingDefinitions && setBinding ? (
        <BindingsEditor
          nodeId={node.id}
          definitions={bindingDefinitions}
          bindings={node.bindings}
          setBinding={setBinding}
          componentInputs={componentInputs}
        />
      ) : null}

      {eventDefinitions && setEvent ? (
        <EventsEditor
          nodeId={node.id}
          nodeName={node.name}
          definitions={eventDefinitions}
          events={node.events}
          setEvent={setEvent}
          {...(handlerIdPrefix ? { handlerIdPrefix } : {})}
        />
      ) : null}
    </div>
  );
}
