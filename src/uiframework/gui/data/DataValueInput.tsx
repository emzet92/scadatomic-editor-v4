import type { PrimitiveDataType } from "../../data/types/DataType";
import { Checkbox, TextInput } from "../ui";

export function DataValueInput({
  type,
  value,
  onChange,
  compact = false,
}: {
  type: PrimitiveDataType;
  value: unknown;
  onChange(value: string | number | boolean): void;
  compact?: boolean;
}) {
  if (type.kind === "bool") {
    return (
      <label className="inline-flex h-8 items-center gap-2 text-xs text-[var(--editor-text)]">
        <Checkbox
          checked={value === true}
          onChange={(event) => onChange(event.target.checked)}
        />
        {value === true ? "true" : "false"}
      </label>
    );
  }

  if (type.kind === "int") {
    return (
      <TextInput
        controlSize={compact ? "sm" : "md"}
        type="number"
        step={1}
        value={typeof value === "number" ? value : 0}
        onChange={(event) => {
          const parsed = Number(event.target.value);
          onChange(Number.isFinite(parsed) ? Math.trunc(parsed) : 0);
        }}
      />
    );
  }

  return (
    <TextInput
      controlSize={compact ? "sm" : "md"}
      value={typeof value === "string" ? value : ""}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}
