import { Link, useParams } from "react-router-dom";
import type { HandlerRef } from "../../core/document";
import { Checkbox, SectionHeader } from "../ui";

export function EventsEditor({
  nodeId,
  nodeName,
  definitions,
  events,
  setEvent,
  handlerIdPrefix,
}: {
  nodeId: string;
  nodeName: string;
  definitions: Record<string, { label: string; defaultSuffix: string }>;
  events: Record<string, HandlerRef> | undefined;
  setEvent: (
    nodeId: string,
    event: string,
    handler: HandlerRef | null
  ) => void;
  handlerIdPrefix?: string;
}) {
  const { projectId } = useParams();

  return (
    <div className="pt-4 border-t border-[var(--editor-border)] space-y-3">
      <SectionHeader
        title="Events"
        description="Runtime handlers emitted by this component."
      />

      <div className="space-y-3">
        {Object.entries(definitions).map(([eventName, definition]) => {
          const generatedHandlerId = handlerIdPrefix
            ? `${handlerIdPrefix}.${nodeName}.${definition.defaultSuffix}`
            : `${nodeName}.${definition.defaultSuffix}`;
          const handler = events?.[eventName];
          const checked = !!handler;
          const handlerId = handler?.handlerId ?? generatedHandlerId;
          const scriptPath = projectId
            ? `/project/${encodeURIComponent(projectId)}/scripts/${encodeURIComponent(handlerId)}`
            : null;

          return (
            <div
              key={eventName}
              className="flex items-center gap-3 rounded-lg border border-[var(--editor-border)] bg-[var(--editor-surface)] px-3 py-3 transition hover:bg-[var(--editor-accent-soft)] hover:border-[var(--editor-accent-border)]"
            >
              <Checkbox
                checked={checked}
                onChange={(event) => {
                  setEvent(
                    nodeId,
                    eventName,
                    event.target.checked
                      ? { handlerId: generatedHandlerId }
                      : null
                  );
                }}
              />

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <div className="text-sm font-medium text-[var(--editor-text)]">
                    {definition.label}
                  </div>
                  <code className="rounded bg-[var(--editor-surface-muted)] px-1.5 py-0.5 text-[10px] text-[var(--editor-text-muted)]">
                    {toReactEventName(eventName)}
                  </code>
                </div>
                <div className="text-xs text-[var(--editor-text-muted)] truncate">
                  {handlerId}
                </div>
              </div>

              {scriptPath ? (
                <Link
                  data-editor-ignore
                  to={scriptPath}
                  className="shrink-0 text-xs font-medium text-[var(--editor-accent)] hover:underline"
                >
                  Open script
                </Link>
              ) : (
                <span
                  data-editor-ignore
                  className="shrink-0 text-xs text-[var(--editor-text-soft)]"
                  title="Open the editor through /project/:projectId to edit scripts"
                >
                  Save project first
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function toReactEventName(eventName: string) {
  if (eventName.startsWith("on")) return eventName;
  return `on${eventName.charAt(0).toUpperCase()}${eventName.slice(1)}`;
}
