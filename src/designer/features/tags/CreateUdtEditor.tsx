import { useState } from "react";
import { validateDataName } from "../../../tags/model/TagRegistry";
import type { ProjectData } from "../../../tags/model/TagDefinition";
import { createUdtDefinition } from "../../../tags/udt/UdtRegistry";
import { useEditorStore } from "../../state/editor-store";
import {
  AddIcon,
  BracesIcon,
  Button,
  EditorPage,
  FormField,
  PanelCard,
  TextInput
} from "../../../shared/ui";
import type { DataSelection } from "./data-selection";

export function CreateUdtEditor({ data, onSelect }: { data: ProjectData; onSelect(selection: DataSelection): void }) {
  const updateProjectData = useEditorStore((state) => state.updateProjectData);
  const [name, setName] = useState("Pump");
  const [error, setError] = useState<string | null>(null);

  return (
    <EditorPage title="Create UDT" description="Define a reusable project-local data structure." icon={<BracesIcon size="lg" />}>
      <PanelCard className="max-w-xl space-y-4">
        <FormField label="Name" error={error}><TextInput value={name} onChange={(event) => { setName(event.target.value); setError(null); }} mono /></FormField>
        <Button
          variant="primary"
          leadingIcon={<AddIcon size="sm" />}
          onClick={() => {
            const nameError = validateDataName(data, name, { kind: "udt" });
            if (nameError) { setError(nameError); return; }
            const udt = createUdtDefinition(name.trim());
            updateProjectData((current) => ({ ...current, udts: { ...current.udts, [udt.id]: udt } }));
            onSelect({ kind: "udt", udtId: udt.id });
          }}
        >
          Create UDT
        </Button>
      </PanelCard>
    </EditorPage>
  );
}
