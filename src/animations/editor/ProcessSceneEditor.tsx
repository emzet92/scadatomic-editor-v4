import type { ProcessScene, ProcessSensor, ProcessZone } from "../../processes";
import {
  AddIcon,
  Box,
  Button,
  DeleteIcon,
  FormField,
  IconButton,
  PanelCard,
  RadioIcon,
  RectangleIcon,
  SectionHeader,
  Select,
  TextInput,
} from "../../shared/ui";

type ProcessSceneEditorProps = {
  scene: ProcessScene;
  onChange: (scene: ProcessScene) => void;
};

export function ProcessSceneEditor({ scene, onChange }: ProcessSceneEditorProps) {
  function updateZone(zoneId: string, update: (zone: ProcessZone) => ProcessZone) {
    onChange({
      ...scene,
      zones: scene.zones.map((zone) => (zone.id === zoneId ? update(zone) : zone)),
    });
  }

  function updateSensor(sensorId: string, update: (sensor: ProcessSensor) => ProcessSensor) {
    onChange({
      ...scene,
      sensors: scene.sensors.map((sensor) => (sensor.id === sensorId ? update(sensor) : sensor)),
    });
  }

  function addZone() {
    const index = scene.zones.length + 1;
    onChange({
      ...scene,
      zones: [
        ...scene.zones,
        {
          id: createEntityId("zone"),
          name: `Zone ${index}`,
          kind: "zone",
          x: 80 + (index - 1) * 30,
          y: 70 + (index - 1) * 25,
          width: 140,
          height: 90,
        },
      ],
    });
  }

  function addSensor() {
    const index = scene.sensors.length + 1;
    onChange({
      ...scene,
      sensors: [
        ...scene.sensors,
        {
          id: createEntityId("sensor"),
          name: `PE-${100 + index}`,
          x: 150 + (index - 1) * 60,
          y: 230,
          triggerRadius: 32,
        },
      ],
    });
  }

  return (
    <PanelCard className="rounded-xl p-4 shadow-sm">
      <SectionHeader
        title="Process scene"
        description="Stations and zones provide process context. Sensors are prototype proximity triggers ready to be replaced by tag bindings."
      />

      <div className="mt-4 space-y-5">
        <section>
          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--editor-text-muted)]">
              <RectangleIcon size={12} /> Zones & stations
            </div>
            <Button size="xs" onClick={addZone}>
              <AddIcon size={11} /> Add zone
            </Button>
          </div>

          <div className="space-y-2">
            {scene.zones.map((zone) => (
              <Box
                key={zone.id}
                className="rounded-lg border border-[var(--editor-border)] bg-[var(--editor-surface-muted)] p-2.5"
              >
                <div className="flex items-center gap-2">
                  <TextInput
                    controlSize="sm"
                    value={zone.name}
                    aria-label="Zone name"
                    onChange={(event) =>
                      updateZone(zone.id, (current) => ({ ...current, name: event.target.value }))
                    }
                  />
                  <IconButton
                    aria-label={`Delete ${zone.name}`}
                    size="icon-xs"
                    variant="danger"
                    onClick={() =>
                      onChange({ ...scene, zones: scene.zones.filter((item) => item.id !== zone.id) })
                    }
                  >
                    <DeleteIcon size={11} />
                  </IconButton>
                </div>

                <div className="mt-2 grid grid-cols-2 gap-2">
                  <FormField label="Kind" compact>
                    <Select
                      value={zone.kind}
                      onChange={(event) =>
                        updateZone(zone.id, (current) => ({
                          ...current,
                          kind: event.target.value === "station" ? "station" : "zone",
                        }))
                      }
                    >
                      <option value="zone">Zone</option>
                      <option value="station">Station</option>
                    </Select>
                  </FormField>
                  <NumericField
                    label="X"
                    value={zone.x}
                    onChange={(x) => updateZone(zone.id, (current) => ({ ...current, x }))}
                  />
                  <NumericField
                    label="Y"
                    value={zone.y}
                    onChange={(y) => updateZone(zone.id, (current) => ({ ...current, y }))}
                  />
                  <NumericField
                    label="Width"
                    min={20}
                    value={zone.width}
                    onChange={(width) =>
                      updateZone(zone.id, (current) => ({ ...current, width: Math.max(20, width) }))
                    }
                  />
                  <NumericField
                    label="Height"
                    min={20}
                    value={zone.height}
                    onChange={(height) =>
                      updateZone(zone.id, (current) => ({ ...current, height: Math.max(20, height) }))
                    }
                  />
                </div>
              </Box>
            ))}
          </div>
        </section>

        <section className="border-t border-[var(--editor-border)] pt-4">
          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--editor-text-muted)]">
              <RadioIcon size={12} /> Sensors
            </div>
            <Button size="xs" onClick={addSensor}>
              <AddIcon size={11} /> Add sensor
            </Button>
          </div>

          <div className="space-y-2">
            {scene.sensors.map((sensor) => (
              <Box
                key={sensor.id}
                className="rounded-lg border border-[var(--editor-border)] bg-[var(--editor-surface-muted)] p-2.5"
              >
                <div className="flex items-center gap-2">
                  <TextInput
                    controlSize="sm"
                    value={sensor.name}
                    aria-label="Sensor name"
                    onChange={(event) =>
                      updateSensor(sensor.id, (current) => ({ ...current, name: event.target.value }))
                    }
                  />
                  <IconButton
                    aria-label={`Delete ${sensor.name}`}
                    size="icon-xs"
                    variant="danger"
                    onClick={() =>
                      onChange({
                        ...scene,
                        sensors: scene.sensors.filter((item) => item.id !== sensor.id),
                      })
                    }
                  >
                    <DeleteIcon size={11} />
                  </IconButton>
                </div>

                <div className="mt-2 grid grid-cols-3 gap-2">
                  <NumericField
                    label="X"
                    value={sensor.x}
                    onChange={(x) => updateSensor(sensor.id, (current) => ({ ...current, x }))}
                  />
                  <NumericField
                    label="Y"
                    value={sensor.y}
                    onChange={(y) => updateSensor(sensor.id, (current) => ({ ...current, y }))}
                  />
                  <NumericField
                    label="Radius"
                    min={8}
                    value={sensor.triggerRadius}
                    onChange={(triggerRadius) =>
                      updateSensor(sensor.id, (current) => ({
                        ...current,
                        triggerRadius: Math.max(8, triggerRadius),
                      }))
                    }
                  />
                </div>
              </Box>
            ))}
          </div>
        </section>
      </div>
    </PanelCard>
  );
}

function NumericField({
  label,
  value,
  min,
  onChange,
}: {
  label: string;
  value: number;
  min?: number;
  onChange: (value: number) => void;
}) {
  return (
    <FormField label={label} compact>
      <TextInput
        controlSize="sm"
        type="number"
        min={min}
        value={value}
        onChange={(event) => {
          const next = Number(event.target.value);
          if (Number.isFinite(next)) onChange(next);
        }}
      />
    </FormField>
  );
}

function createEntityId(prefix: string) {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
