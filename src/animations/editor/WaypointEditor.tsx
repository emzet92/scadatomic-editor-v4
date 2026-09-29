import type { AnimationPath, AnimationWaypoint } from "../model/animation-path";
import { resolveWaypointChanges } from "../model/waypoint-changes";
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
  TextInput,
} from "../../shared/ui";

const DEFAULT_BOX_COLOR = "#4f46e5";

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

  function updateWaypoint(waypointId: string, update: (waypoint: AnimationWaypoint) => AnimationWaypoint) {
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

  function setBoxColorChange(waypoint: AnimationWaypoint, color: string | undefined) {
    updateWaypoint(waypoint.id, (current) => withBoxColorChange(current, color));
  }

  return (
    <PanelCard className="rounded-xl p-4 shadow-sm">
      <SectionHeader
        title="Waypoints"
        description="Pozycja definiuje trasę. Changes są stosowane dokładnie po osiągnięciu waypointa."
        action={
          <Button size="xs" onClick={addWaypoint}>
            <AddIcon size={12} /> Add waypoint
          </Button>
        }
      />

      <div className="mt-4 space-y-2">
        {path.points.map((waypoint, index) => {
          const selected = waypoint.id === selectedWaypointId;
          const localColor = waypoint.changes?.boxColor;
          const effectiveColor = resolveWaypointChanges(path, index).boxColor ?? DEFAULT_BOX_COLOR;

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
                  <span
                    className="size-3 shrink-0 rounded-full border border-black/10"
                    style={{ backgroundColor: effectiveColor }}
                    title={`Effective box color: ${effectiveColor}`}
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

                  <div className="space-y-2">
                    <label className="flex cursor-pointer items-center gap-2 text-[10px] font-medium text-[var(--editor-text-muted)]">
                      <Checkbox
                        checked={localColor !== undefined}
                        onChange={(event) =>
                          setBoxColorChange(waypoint, event.target.checked ? effectiveColor : undefined)
                        }
                      />
                      Change box color at this waypoint
                    </label>

                    {localColor !== undefined ? (
                      <ColorPickerInput
                        compact
                        ariaLabel={`Box color at waypoint ${index + 1}`}
                        value={localColor}
                        onChange={(color) => setBoxColorChange(waypoint, color)}
                      />
                    ) : (
                      <div className="rounded-lg border border-dashed border-[var(--editor-border)] px-2.5 py-2 text-[9px] text-[var(--editor-text-soft)]">
                        Inherits {effectiveColor} from the previous waypoint change.
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

function withBoxColorChange(
  waypoint: AnimationWaypoint,
  color: string | undefined,
): AnimationWaypoint {
  const next: AnimationWaypoint = { ...waypoint };

  if (color !== undefined) {
    next.changes = { ...waypoint.changes, boxColor: color };
    return next;
  }

  if (!waypoint.changes) return next;
  const changes = { ...waypoint.changes };
  delete changes.boxColor;

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
