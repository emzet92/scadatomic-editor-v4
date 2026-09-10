import type { DataType } from "../../data/types/DataType";
import type { ProjectData } from "../../data/tags/TagDefinition";
import { Select } from "../ui";

export function DataTypeSelect({ data, value, onChange, allowUdt = true, disabled = false }: { data: ProjectData; value: DataType; onChange(type: DataType): void; allowUdt?: boolean; disabled?: boolean }) {
  const encoded = value.kind === "udt" ? `udt:${value.udtId}` : value.kind;
  return <Select disabled={disabled} value={encoded} onChange={(event) => {
    const raw = event.target.value;
    if (raw.startsWith("udt:")) onChange({ kind: "udt", udtId: raw.slice(4) });
    else if (raw === "string" || raw === "int" || raw === "bool") onChange({ kind: raw });
  }}>
    <option value="string">String</option>
    <option value="int">Int</option>
    <option value="bool">Bool</option>
    {allowUdt ? Object.values(data.udts).sort((a, b) => a.name.localeCompare(b.name)).map((udt) => <option key={udt.id} value={`udt:${udt.id}`}>{udt.name} (UDT)</option>) : null}
  </Select>;
}
