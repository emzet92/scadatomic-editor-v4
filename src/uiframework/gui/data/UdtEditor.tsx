import { Braces, FunctionSquare, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { validateDataName } from "../../data/tags/TagRegistry";
import type { ProjectData } from "../../data/tags/TagDefinition";
import type { PrimitiveDataType } from "../../data/types/DataType";
import { TypeRegistry } from "../../data/types/TypeRegistry";
import {
  addUdtField,
  addUdtMethod,
  deleteUdt,
  deleteUdtField,
  deleteUdtMethod,
  getUdtDependents,
  renameUdt,
  updateUdtField,
} from "../../data/udt/UdtRegistry";
import type { UdtFieldDefinition } from "../../data/udt/UdtDefinition";
import { useEditorStore } from "../../editor-store";
import {
  Button,
  ConfirmDialog,
  FormField,
  IconButton,
  PanelCard,
  SectionHeader,
  TextInput,
} from "../ui";
import { DataTypeSelect } from "./DataTypeSelect";
import { DataValueInput } from "./DataValueInput";
import type { DataSelection } from "./data-selection";

export function UdtEditor({
  data,
  udtId,
  onSelect,
}: {
  data: ProjectData;
  udtId: string;
  onSelect(selection: DataSelection): void;
}) {
  const definition = data.udts[udtId];
  const updateProjectData = useEditorStore((state) => state.updateProjectData);
  const [name, setName] = useState(definition?.name ?? "");
  const [nameError, setNameError] = useState<string | null>(null);
  const [newFieldName, setNewFieldName] = useState("property1");
  const [newFieldType, setNewFieldType] = useState<PrimitiveDataType>({ kind: "string" });
  const [newFieldError, setNewFieldError] = useState<string | null>(null);
  const [newMethodName, setNewMethodName] = useState("method1");
  const [newMethodError, setNewMethodError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (!definition) {
    return <div className="p-8 text-sm text-[var(--editor-text-muted)]">UDT no longer exists.</div>;
  }
  const udt = definition;

  const dependents = getUdtDependents(data, udt.id);

  function saveName() {
    const error = validateDataName(data, name, { kind: "udt", ignoreId: udt.id });
    if (error) {
      setNameError(error);
      return;
    }
    updateProjectData((current) => renameUdt(current, udt.id, name.trim()));
    setNameError(null);
  }

  function createField() {
    const error = validateMemberName(
      newFieldName,
      [...udt.fields.map((field) => field.name), ...udt.methods.map((method) => method.name)]
    );
    if (error) {
      setNewFieldError(error);
      return;
    }
    updateProjectData((current) =>
      addUdtField(current, udt.id, {
        name: newFieldName.trim(),
        type: newFieldType,
        defaultValue: TypeRegistry.getDefaultValue(newFieldType),
      })
    );
    setNewFieldName(`property${udt.fields.length + 2}`);
    setNewFieldError(null);
  }

  function createMethod() {
    const error = validateMemberName(
      newMethodName,
      [...udt.fields.map((field) => field.name), ...udt.methods.map((method) => method.name)]
    );
    if (error) {
      setNewMethodError(error);
      return;
    }
    let methodId: string | undefined;
    updateProjectData((current) => {
      const next = addUdtMethod(
        current,
        udt.id,
        newMethodName.trim(),
        `// ${udt.name}.${newMethodName.trim()}()\n// self is the current UDT instance. Writes go through TagStore.\n\n`
      );
      methodId = next.udts[udt.id]?.methods.at(-1)?.id;
      return next;
    });
    setNewMethodName(`method${udt.methods.length + 2}`);
    setNewMethodError(null);
    if (methodId) onSelect({ kind: "udt-method", udtId: udt.id, methodId });
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-lg font-semibold text-[var(--editor-text)]">
            <Braces size={18} /> {udt.name}
          </div>
          <p className="mt-1 text-sm text-[var(--editor-text-muted)]">
            {udt.fields.length} properties · {udt.methods.length} methods · {dependents.length} instances
          </p>
        </div>
        <Button
          variant="danger"
          disabled={dependents.length > 0}
          title={dependents.length > 0 ? "Delete dependent tags first." : "Delete UDT"}
          onClick={() => setDeleteOpen(true)}
        >
          <Trash2 size={13} /> Delete UDT
        </Button>
      </div>

      <PanelCard className="max-w-2xl">
        <FormField label="UDT name" error={nameError}>
          <div className="flex gap-2">
            <TextInput mono value={name} onChange={(event) => setName(event.target.value)} />
            <Button onClick={saveName}>Rename</Button>
          </div>
        </FormField>
      </PanelCard>

      {dependents.length > 0 ? (
        <PanelCard accent>
          <div className="text-xs font-semibold text-[var(--editor-text)]">Used by existing tags</div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {dependents.map((tag) => (
              <button key={tag.id} type="button" onClick={() => onSelect({ kind: "tag", tagId: tag.id })} className="rounded-md border border-[var(--editor-accent-border)] bg-white px-2 py-1 text-xs text-[var(--editor-accent)]">
                {tag.name}
              </button>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-[var(--editor-text-muted)]">Delete is blocked until these instances are removed.</p>
        </PanelCard>
      ) : null}

      <PanelCard className="space-y-4">
        <SectionHeader title="Properties" description="Schema changes are synchronized into every existing UDT instance." />
        <div className="space-y-2">
          {udt.fields.length === 0 ? <div className="text-xs text-[var(--editor-text-soft)]">No properties yet.</div> : udt.fields.map((field) => (
            <UdtFieldRow key={field.id} data={data} udtId={udt.id} field={field} siblingNames={[...udt.fields.filter((candidate) => candidate.id !== field.id).map((candidate) => candidate.name), ...udt.methods.map((method) => method.name)]} />
          ))}
        </div>
        <div className="grid gap-2 border-t border-[var(--editor-border)] pt-4 md:grid-cols-[1fr_160px_auto]">
          <FormField label="New property" error={newFieldError} compact><TextInput controlSize="sm" mono value={newFieldName} onChange={(event) => { setNewFieldName(event.target.value); setNewFieldError(null); }} /></FormField>
          <FormField label="Type" compact><DataTypeSelect data={data} value={newFieldType} allowUdt={false} onChange={(type) => { if (type.kind !== "udt") setNewFieldType(type); }} /></FormField>
          <div className="flex items-end"><Button onClick={createField}><Plus size={13} /> Property</Button></div>
        </div>
      </PanelCard>

      <PanelCard className="space-y-4">
        <SectionHeader title="Methods" description="JavaScript methods run against a concrete instance through self." />
        <div className="space-y-1">
          {udt.methods.map((method) => (
            <div key={method.id} className="flex items-center gap-2 rounded-md border border-[var(--editor-border)] bg-[var(--editor-surface-muted)] px-3 py-2">
              <FunctionSquare size={13} className="text-[var(--editor-text-soft)]" />
              <button type="button" className="min-w-0 flex-1 text-left text-xs font-medium text-[var(--editor-text)]" onClick={() => onSelect({ kind: "udt-method", udtId: udt.id, methodId: method.id })}>{method.name}()</button>
              <IconButton aria-label={`Delete ${method.name}`} title="Delete method" variant="danger" onClick={() => updateProjectData((current) => deleteUdtMethod(current, udt.id, method.id))}><Trash2 size={12} /></IconButton>
            </div>
          ))}
        </div>
        <div className="grid gap-2 border-t border-[var(--editor-border)] pt-4 md:grid-cols-[1fr_auto]">
          <FormField label="New method" compact error={newMethodError}><TextInput controlSize="sm" mono value={newMethodName} onChange={(event) => { setNewMethodName(event.target.value); setNewMethodError(null); }} /></FormField>
          <div className="flex items-end"><Button onClick={createMethod}><Plus size={13} /> Method</Button></div>
        </div>
      </PanelCard>

      <ConfirmDialog open={deleteOpen} title={`Delete ${udt.name}?`} description="The UDT definition will be permanently removed. This is only allowed when no tags depend on it." confirmLabel="Delete UDT" destructive onCancel={() => setDeleteOpen(false)} onConfirm={() => { updateProjectData((current) => deleteUdt(current, udt.id)); setDeleteOpen(false); onSelect(null); }} />
    </div>
  );
}

function UdtFieldRow({ data, udtId, field, siblingNames }: { data: ProjectData; udtId: string; field: UdtFieldDefinition; siblingNames: string[] }) {
  const updateProjectData = useEditorStore((state) => state.updateProjectData);
  const [name, setName] = useState(field.name);
  const [error, setError] = useState<string | null>(null);
  if (field.type.kind === "udt") return null;

  function commitName() {
    const nameError = validateMemberName(name, siblingNames);
    if (nameError) { setError(nameError); setName(field.name); return; }
    updateProjectData((current) => updateUdtField(current, udtId, field.id, (currentField) => ({ ...currentField, name: name.trim() })));
    setError(null);
  }

  return <div className="grid items-start gap-2 rounded-md border border-[var(--editor-border)] bg-[var(--editor-surface-muted)] p-2 md:grid-cols-[1fr_140px_1fr_auto]">
    <FormField label="Name" compact error={error}><TextInput controlSize="sm" mono value={name} onChange={(event) => setName(event.target.value)} onBlur={commitName} /></FormField>
    <FormField label="Type" compact><DataTypeSelect data={data} value={field.type} allowUdt={false} onChange={(type) => { if (type.kind === "udt") return; updateProjectData((current) => updateUdtField(current, udtId, field.id, (currentField) => ({ ...currentField, type, defaultValue: TypeRegistry.getDefaultValue(type) }))); }} /></FormField>
    <FormField label="Default" compact><DataValueInput compact type={field.type} value={field.defaultValue ?? TypeRegistry.getDefaultValue(field.type)} onChange={(value) => updateProjectData((current) => updateUdtField(current, udtId, field.id, (currentField) => ({ ...currentField, defaultValue: value })))} /></FormField>
    <div className="pt-5"><IconButton aria-label={`Delete ${field.name}`} title="Delete property" variant="danger" onClick={() => updateProjectData((current) => deleteUdtField(current, udtId, field.id))}><Trash2 size={12} /></IconButton></div>
  </div>;
}

function validateMemberName(name: string, existingNames: string[]) {
  const trimmed = name.trim();
  if (!/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(trimmed)) return "Use a valid JavaScript identifier.";
  if (existingNames.includes(trimmed)) return "Field and method names must be unique inside the UDT.";
  return null;
}
