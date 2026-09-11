import { Play, Save } from "lucide-react";
import { useMemo, useState } from "react";
import { createUdtInstanceApi } from "../../data/runtime/UdtRuntime";
import { getDesignerTagRuntime } from "../../data/tags/designer-tag-store";
import { isUdtTag, type ProjectData } from "../../data/tags/TagDefinition";
import { updateUdtMethod } from "../../data/udt/UdtRegistry";
import { useEditorStore } from "../../editor-store";
import { Button, FormField, PanelCard, Select, TextInput } from "../ui";
import { JavaScriptCodeEditor } from "../script-editor/JavaScriptCodeEditor";
import type { AutocompleteApiNode } from "../script-editor/ctx-completions";
import { createUdtSelfAutocompleteRoot } from "./udt-autocomplete";

export function UdtMethodEditor({ data, udtId, methodId }: { data: ProjectData; udtId: string; methodId: string }) {
  const definition = data.udts[udtId];
  const method = definition?.methods.find((candidate) => candidate.id === methodId);
  const updateProjectData = useEditorStore((state) => state.updateProjectData);
  const [name, setName] = useState(method?.name ?? "");
  const [selectedTagId, setSelectedTagId] = useState("");
  const [runMessage, setRunMessage] = useState<string | null>(null);
  const instances = Object.values(data.tags).filter(
    (tag) => isUdtTag(tag) && tag.type.udtId === udtId
  );
  const selectedInstance = instances.find((tag) => tag.id === selectedTagId) ?? instances[0];

  const autocompleteRoots = useMemo<AutocompleteApiNode[]>(() =>
    definition ? [createUdtSelfAutocompleteRoot(definition, data)] : [],
  [data, definition]);

  if (!definition || !method) return <div className="p-8 text-sm text-[var(--editor-text-muted)]">UDT method no longer exists.</div>;
  const udt = definition;
  const selectedMethod = method;

  function renameMethod() {
    const trimmed = name.trim();
    const duplicate = [...udt.fields.map((field) => field.name), ...udt.methods.filter((candidate) => candidate.id !== selectedMethod.id).map((candidate) => candidate.name)].includes(trimmed);
    if (!/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(trimmed) || duplicate) {
      setRunMessage("Method name must be a unique JavaScript identifier.");
      return;
    }
    updateProjectData((current) => updateUdtMethod(current, udt.id, selectedMethod.id, (currentMethod) => ({ ...currentMethod, name: trimmed })));
    setRunMessage(null);
  }

  function run() {
    if (!selectedInstance) { setRunMessage("Create a UDT tag instance first."); return; }
    try {
      const runtime = getDesignerTagRuntime();
      if (!runtime) throw new Error("Designer runtime session is not connected yet.");
      const api = createUdtInstanceApi(selectedInstance.name, runtime, {
        log: (...args) => console.log(`[udt:${udt.name}.${selectedMethod.name}]`, ...args),
      });
      const callable = api[selectedMethod.name];
      if (typeof callable !== "function") throw new Error("Method is not available in the current runtime snapshot.");
      callable();
      setRunMessage(`Executed ${selectedInstance.name}.${selectedMethod.name}().`);
    } catch (error) {
      setRunMessage(error instanceof Error ? error.message : String(error));
    }
  }

  return <div className="mx-auto max-w-6xl space-y-5 p-8">
    <div><div className="text-xs font-semibold uppercase tracking-wide text-[var(--editor-text-muted)]">UDT method</div><h1 className="mt-1 text-xl font-semibold text-[var(--editor-text)]">{udt.name}.{selectedMethod.name}()</h1><p className="mt-1 text-sm text-[var(--editor-text-muted)]">self is bound to the concrete UDT instance; assignments are routed through the mapped tag driver.</p></div>
    <PanelCard className="grid gap-3 md:grid-cols-[1fr_auto]">
      <FormField label="Method name"><TextInput mono value={name} onChange={(event) => setName(event.target.value)} /></FormField>
      <div className="flex items-end"><Button onClick={renameMethod}><Save size={13} /> Rename</Button></div>
    </PanelCard>
    <JavaScriptCodeEditor value={selectedMethod.source} onChange={(source) => updateProjectData((current) => updateUdtMethod(current, udt.id, selectedMethod.id, (currentMethod) => ({ ...currentMethod, source })))} components={[]} projectData={data} extraAutocompleteRoots={autocompleteRoots} autocompleteHint="self · tags · UDT fields · UDT methods" height="460px" />
    <PanelCard className="space-y-3">
      <div><div className="text-xs font-semibold uppercase tracking-wide text-[var(--editor-text-muted)]">Test method</div><p className="mt-1 text-xs text-[var(--editor-text-soft)]">Runs locally in Designer against the live project runtime TagStore.</p></div>
      <div className="flex flex-wrap items-end gap-2"><FormField label="Instance" compact className="min-w-56"><Select controlSize="sm" value={selectedInstance?.id ?? ""} onChange={(event) => setSelectedTagId(event.target.value)} disabled={instances.length === 0}>{instances.length === 0 ? <option value="">No instances</option> : instances.map((tag) => <option key={tag.id} value={tag.id}>{tag.name}</option>)}</Select></FormField><Button variant="primary" onClick={run} disabled={!selectedInstance}><Play size={13} /> Run {selectedMethod.name}()</Button></div>
      {runMessage ? <div className="rounded-md bg-[var(--editor-surface-muted)] px-3 py-2 text-xs text-[var(--editor-text-muted)]">{runMessage}</div> : null}
    </PanelCard>
  </div>;
}
