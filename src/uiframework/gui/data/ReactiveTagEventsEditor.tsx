import type { ReactiveEventType } from "../../../reactivity";
import { tagFieldRefKey, type TagFieldRef } from "../../data/tags/TagFieldRef";
import { useEditorStore } from "../../editor-store";
import {
  Box,
  Button,
  Checkbox,
  FormField,
  LinkIcon,
  PanelCard,
  RadioIcon,
  TextInput
} from "../ui";

const EVENTS: Array<{ type: ReactiveEventType; label: string; suffix: string }> = [
  { type: "value-changed", label: "Value changed", suffix: "Changed" },
  { type: "rising-edge", label: "Rising edge", suffix: "RisingEdge" },
  { type: "falling-edge", label: "Falling edge", suffix: "FallingEdge" },
];

export function ReactiveTagEventsEditor({
  target,
  path,
  projectId,
}: {
  target: TagFieldRef;
  path: string;
  projectId?: string | undefined;
}) {
  const reactiveEvents = useEditorStore((state) => state.document.reactiveEvents);
  const setReactiveEventHandler = useEditorStore((state) => state.setReactiveEventHandler);

  return (
    <PanelCard className="space-y-3">
      <Box>
        <Box className="flex items-center gap-2 text-sm font-semibold text-[var(--editor-text)]">
          <RadioIcon size={14} /> Reactive events
        </Box>
        <p className="mt-1 text-xs text-[var(--editor-text-muted)]">
          Bindings synchronize UI without scripts. Use these listeners only when a tag change should execute logic.
        </p>
      </Box>

      <Box className="space-y-2">
        {EVENTS.map((event) => {
          const id = reactiveEventId(target, event.type);
          const current = reactiveEvents?.[id];
          const handlerId = current?.handlerId ?? defaultHandlerId(path, event.suffix);
          const enabled = Boolean(current);
          const href = projectId
            ? `/project/${encodeURIComponent(projectId)}/scripts/${encodeURIComponent(handlerId)}`
            : undefined;

          return (
            <Box
              key={event.type}
              className="rounded-2xl border border-[var(--editor-border)] bg-[var(--editor-surface-muted)]/50 p-3"
            >
              <Box className="flex items-center gap-3">
                <Checkbox
                  checked={enabled}
                  onChange={(input) => {
                    if (!input.target.checked) {
                      setReactiveEventHandler(id, null);
                      return;
                    }
                    setReactiveEventHandler(id, {
                      id,
                      ref: { kind: "tag", ref: target, path },
                      event: event.type,
                      handlerId,
                      enabled: true,
                    });
                  }}
                />
                <Box className="min-w-0 flex-1">
                  <Box className="text-xs font-semibold text-[var(--editor-text)]">{event.label}</Box>
                  <Box className="text-[10px] text-[var(--editor-text-muted)]">{path}</Box>
                </Box>
                {enabled && href ? (
                  <Button
                    size="xs"
                    variant="text"
                    onClick={() => window.location.assign(href)}
                    title="Open handler"
                  >
                    <LinkIcon size={11} /> Edit
                  </Button>
                ) : null}
              </Box>

              {enabled ? (
                <FormField label="Handler" compact className="mt-3">
                  <TextInput
                    mono
                    value={handlerId}
                    onChange={(input) => {
                      setReactiveEventHandler(id, {
                        ...current!,
                        handlerId: input.target.value,
                      });
                    }}
                  />
                </FormField>
              ) : null}
            </Box>
          );
        })}
      </Box>
    </PanelCard>
  );
}

function reactiveEventId(ref: TagFieldRef, event: ReactiveEventType) {
  return `tag-event:${tagFieldRefKey(ref)}:${event}`;
}

function defaultHandlerId(path: string, suffix: string) {
  const safePath = path.replace(/[^A-Za-z0-9_.-]/g, "_");
  return `tag.${safePath}.${suffix}`;
}
