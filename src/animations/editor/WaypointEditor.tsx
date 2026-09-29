import type { AnimationPath, AnimationWaypoint, ProcessObjectState } from "../../processes";
import {
  DEFAULT_PROCESS_OBJECT_STATE,
  getProcessStateAppearance,
  processStateAppearances,
  resolveWaypointChanges,
} from "../../processes";
import {
  AddIcon,
  Box,
  Button,
  Checkbox,
  ColorPickerInput,
  DeleteIcon,
  FormField,
  IconButton,
  PanelCard,
  SectionHeader,
  Select,
  TextInput,
} from "../../shared/ui";

const PROCESS_STATES = Object.keys(processStateAppearances) as ProcessObjectState[];

type WaypointEditorProps = {
  path: AnimationPath;
  selectedWaypointId: string | null;
  onSelectedWaypointIdChange: (waypointId: string) => void;
  onChange: (path: AnimationPath) => void;
};

export function WaypointEditor({
  path,
  selectedWaypointId,
  onSelectedWaypointIdChange,
  onChange,
}: WaypointEditorProps) {
  const selectedIndex = Math.max(
    0,
    path.points.findIndex((point) => point.id === selectedWaypointId),
  );

  function updateWaypoint(
    waypointId: string,
    update: (waypoint: AnimationWaypoint) => AnimationWaypoint,
  ) {
    onChange({
      ...path,
      points: path.points.map((point) => (point.id === waypointId ? update(point) : point)),
    });
  }

  function addWaypoint() {
    const insertionIndex = Math.min(selectedIndex + 1, path.points.length);
    const previous = path.points[insertionIndex - 1];
    const next = path.points[insertionIndex];
    const waypoint: AnimationWaypoint = {
      id: createWaypointId(),
      x: coordinateBetween(previous?.x, next?.x, 100),
      y: coordinateBetween(previous?.y, next?.y, 0),
    };
    const points = [...path.points];
    points.splice(insertionIndex, 0, waypoint);
    onChange({ ...path, points });
    onSelectedWaypointIdChange(waypoint.id);
  }

  function removeWaypoint(waypointId: string) {
    if (path.points.length <= 2) return;

    const index = path.points.findIndex((point) => point.id === waypointId);
    if (index < 0) return;

    const points = path.points.filter((point) => point.id !== waypointId);
    const nextSelection = points[Math.min(index, points.length - 1)];
    onChange({ ...path, points });
    if (nextSelection) onSelectedWaypointIdChange(nextSelection.id);
  }

  return (
    <PanelCard className="rounded-xl p-4 shadow-sm">
      <SectionHeader
        title="Waypoints"
        description="Drag points on the canvas or edit coordinates precisely. State changes apply exactly when a waypoint is reached."
        action={
          <Button size="xs" onClick={addWaypoint}>
            <AddIcon size={12} /> Add waypoint
          </Button>
        }
      />

      <div className="mt-4 space-y-2">
        {path.points.map((waypoint, index) => {
          const selected = waypoint.id === selectedWaypointId;
          const resolved = resolveWaypointChanges(path, index);
          const effectiveState = resolved.objectState ?? DEFAULT_PROCESS_OBJECT_STATE;
          const effectiveAppearance = getProcessStateAppearance(effectiveState);
          const effectiveColor = resolved.boxColor ?? effectiveAppearance.color;
          const localState = waypoint.changes?.objectState;
          const localColor = waypoint.changes?.boxColor;

          return (
            <Box
              key={waypoint.id}
              className={`rounded-xl border p-3 transition ${
                selected
                  ? "border-[var(--editor-accent)] bg-[var(--editor-accent-soft)]/40"
                  : "border-[var(--editor-border)] bg-[var(--editor-surface-muted)]"
              }`}
            >
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onSelectedWaypointIdChange(waypoint.id)}
                  className="flex min-w-0 flex-1 items-center gap-2 text-left"
                >
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-white text-[9px] font-semibold text-[var(--editor-accent)] shadow-sm">
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[11px] font-semibold text-[var(--editor-text)]">
                    Waypoint {index + 1}
                  </span>
                  <span className="truncate text-[9px] text-[var(--editor-text-soft)]">
                    {effectiveAppearance.label}
                  </span>
                  <span
                    className="size-3 shrink-0 rounded-full border border-black/10"
                    style={{ backgroundColor: effectiveColor }}
                    title={`${effectiveAppearance.label} · ${effectiveColor}`}
                  />
                </button>
                <IconButton
                  aria-label={`Delete waypoint ${index + 1}`}
                  size="icon-xs"
                  variant="danger"
                  disabled={path.points.length <= 2}
                  onClick={() => removeWaypoint(waypoint.id)}
                >
                  <DeleteIcon size={11} />
                </IconButton>
              </div>

              {selected ? (
                <div className="mt-3 space-y-3 border-t border-[var(--editor-border)] pt-3">
                  <div className="grid grid-cols-2 gap-2">
                    <FormField label="X" compact>
                      <TextInput
                        controlSize="sm"
                        type="number"
                        value={waypoint.x}
                        onChange={(event) => {
                          const x = Number(event.target.value);
                          if (Number.isFinite(x)) {
                            updateWaypoint(waypoint.id, (current) => ({ ...current, x }));
                          }
                        }}
                      />
                    </FormField>
                    <FormField label="Y" compact>
                      <TextInput
                        controlSize="sm"
                        type="number"
                        value={waypoint.y}
                        onChange={(event) => {
                          const y = Number(event.target.value);
                          if (Number.isFinite(y)) {
                            updateWaypoint(waypoint.id, (current) => ({ ...current, y }));
                          }
                        }}
                      />
                    </FormField>
                  </div>

                  <div className="space-y-2 rounded-lg border border-[var(--editor-border)] bg-white/70 p-2.5">
                    <label className="flex cursor-pointer items-center gap-2 text-[10px] font-medium text-[var(--editor-text-muted)]">
                      <Checkbox
                        checked={localState !== undefined}
                        onChange={(event) =>
                          updateWaypoint(waypoint.id, (current) =>
                            withWaypointChange(
                              current,
                              "objectState",
                              event.target.checked ? effectiveState : undefined,
                            ),
                          )
                        }
                      />
                      Change process state at this waypoint
                    </label>

                    {localState !== undefined ? (
                      <FormField label="Product state" compact>
                        <Select
                          value={localState}
                          onChange={(event) =>
                            updateWaypoint(waypoint.id, (current) =>
                              withWaypointChange(
                                current,
                                "objectState",
                                event.target.value as ProcessObjectState,
                              ),
                            )
                          }
                        >
                          {PROCESS_STATES.map((state) => (
                            <option key={state} value={state}>
                              {processStateAppearances[state].label}
                            </option>
                          ))}
                        </Select>
                      </FormField>
                    ) : (
                      <div className="text-[9px] leading-4 text-[var(--editor-text-soft)]">
                        Inherits <strong>{effectiveAppearance.label}</strong> from the previous state transition.
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 rounded-lg border border-[var(--editor-border)] bg-white/70 p-2.5">
                    <label className="flex cursor-pointer items-center gap-2 text-[10px] font-medium text-[var(--editor-text-muted)]">
                      <Checkbox
                        checked={localColor !== undefined}
                        onChange={(event) =>
                          updateWaypoint(waypoint.id, (current) =>
                            withWaypointChange(
                              current,
                              "boxColor",
                              event.target.checked ? effectiveColor : undefined,
                            ),
                          )
                        }
                      />
                      Override state color
                    </label>

                    {localColor !== undefined ? (
                      <ColorPickerInput
                        compact
                        ariaLabel={`Box color at waypoint ${index + 1}`}
                        value={localColor}
                        onChange={(color) =>
                          updateWaypoint(waypoint.id, (current) =>
                            withWaypointChange(current, "boxColor", color),
                          )
                        }
                      />
                    ) : (
                      <div className="text-[9px] leading-4 text-[var(--editor-text-soft)]">
                        Uses semantic color <strong>{effectiveColor}</strong>. Keep this off when state should control presentation.
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </Box>
          );
        })}
      </div>
    </PanelCard>
  );
}

function withWaypointChange<K extends keyof NonNullable<AnimationWaypoint["changes"]>>(
  waypoint: AnimationWaypoint,
  key: K,
  value: NonNullable<AnimationWaypoint["changes"]>[K] | undefined,
): AnimationWaypoint {
  const next: AnimationWaypoint = { ...waypoint };

  if (value !== undefined) {
    next.changes = { ...waypoint.changes, [key]: value };
    return next;
  }

  if (!waypoint.changes) return next;
  const changes = { ...waypoint.changes };
  delete changes[key];

  if (Object.keys(changes).length > 0) next.changes = changes;
  else delete next.changes;

  return next;
}

function coordinateBetween(from: number | undefined, to: number | undefined, fallbackDelta: number) {
  if (from !== undefined && to !== undefined) return Math.round((from + to) / 2);
  if (from !== undefined) return from + fallbackDelta;
  if (to !== undefined) return to - fallbackDelta;
  return fallbackDelta;
}

function createWaypointId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `waypoint-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
