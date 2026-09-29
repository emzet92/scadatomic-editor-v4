import type { ProjectData } from "../../tags/model/TagDefinition";
import { listPrimitiveTagFieldRefs } from "../../tags/model/TagFieldRef";
import type { ProcessScene, ProcessTagBindings } from "../../processes";
import {
  Box,
  FormField,
  PanelCard,
  SectionHeader,
  Select,
  TextInput,
} from "../../shared/ui";

export function ProcessBindingsEditor({
  data,
  scene,
  bindings,
  onChange,
}: {
  data: ProjectData | null;
  scene: ProcessScene;
  bindings: ProcessTagBindings;
  onChange: (bindings: ProcessTagBindings) => void;
}) {
  const fields = data ? listPrimitiveTagFieldRefs(data) : [];
  const numericFields = fields.filter((field) => field.type.kind === "int");
  const stateFields = fields.filter((field) => field.type.kind === "string");
  const boolFields = fields.filter((field) => field.type.kind === "bool");

  return (
    <PanelCard className="rounded-xl p-4 shadow-sm">
      <SectionHeader
        title="Tag bindings"
        description="Bindings są częścią procesu. Animator czyta je z izolowanej sesji symulatora, runtime z własnego runtime signal API."
      />

      {!data ? (
        <Box className="mt-4 rounded-lg border border-dashed border-[var(--editor-border)] px-3 py-3 text-[10px] text-[var(--editor-text-muted)]">
          Open Animations from a project to bind project tags.
        </Box>
      ) : (
        <div className="mt-4 space-y-4">
          <div className="space-y-2">
            <FormField label="Progress tag" description="Numeric tag mapped to normalized 0..1 animation progress.">
              <Select
                value={bindings.progress?.tagPath ?? ""}
                onChange={(event) => {
                  const tagPath = event.target.value;
                  onChange({
                    ...bindings,
                    ...(tagPath
                      ? {
                          progress: {
                            tagPath,
                            inputMin: bindings.progress?.inputMin ?? 0,
                            inputMax: bindings.progress?.inputMax ?? 100,
                          },
                        }
                      : { progress: undefined }),
                  });
                }}
              >
                <option value="">— playback clock —</option>
                {numericFields.map((field) => (
                  <option key={field.path} value={field.path}>{field.path}</option>
                ))}
              </Select>
            </FormField>

            {bindings.progress ? (
              <div className="grid grid-cols-2 gap-2">
                <FormField label="Input min" compact>
                  <TextInput
                    controlSize="sm"
                    type="number"
                    value={bindings.progress.inputMin}
                    onChange={(event) => {
                      const value = Number(event.target.value);
                      if (!Number.isFinite(value)) return;
                      onChange({
                        ...bindings,
                        progress: { ...bindings.progress!, inputMin: value },
                      });
                    }}
                  />
                </FormField>
                <FormField label="Input max" compact>
                  <TextInput
                    controlSize="sm"
                    type="number"
                    value={bindings.progress.inputMax}
                    onChange={(event) => {
                      const value = Number(event.target.value);
                      if (!Number.isFinite(value)) return;
                      onChange({
                        ...bindings,
                        progress: { ...bindings.progress!, inputMax: value },
                      });
                    }}
                  />
                </FormField>
              </div>
            ) : null}
          </div>

          <FormField
            label="Object state tag"
            description="String values raw / processing / inspection / passed / rejected override waypoint state."
          >
            <Select
              value={bindings.objectState?.tagPath ?? ""}
              onChange={(event) => {
                const tagPath = event.target.value;
                onChange({
                  ...bindings,
                  ...(tagPath
                    ? { objectState: { tagPath } }
                    : { objectState: undefined }),
                });
              }}
            >
              <option value="">— waypoint state —</option>
              {stateFields.map((field) => (
                <option key={field.path} value={field.path}>{field.path}</option>
              ))}
            </Select>
          </FormField>

          {scene.sensors.length > 0 ? (
            <div className="space-y-2 border-t border-[var(--editor-border)] pt-3">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-[var(--editor-text-muted)]">
                Sensor tags
              </div>
              {scene.sensors.map((sensor) => {
                const binding = bindings.sensors?.[sensor.id];
                return (
                  <FormField key={sensor.id} label={sensor.name} compact>
                    <Select
                      value={binding?.tagPath ?? ""}
                      onChange={(event) => {
                        const tagPath = event.target.value;
                        const sensors = { ...(bindings.sensors ?? {}) };
                        if (tagPath) sensors[sensor.id] = { tagPath, activeValue: true };
                        else delete sensors[sensor.id];
                        onChange({
                          ...bindings,
                          ...(Object.keys(sensors).length > 0 ? { sensors } : { sensors: undefined }),
                        });
                      }}
                    >
                      <option value="">— geometric detection —</option>
                      {boolFields.map((field) => (
                        <option key={field.path} value={field.path}>{field.path}</option>
                      ))}
                    </Select>
                  </FormField>
                );
              })}
            </div>
          ) : null}
        </div>
      )}
    </PanelCard>
  );
}
