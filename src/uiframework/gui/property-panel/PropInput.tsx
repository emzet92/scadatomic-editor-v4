import type { ReactNode } from "react";
import type { InspectorControl } from "../../registry/component-definitions";
import type { UpdateNode } from "./property-panel-types";

const namedColors: Record<string, string> = {
  black: "#000000",
  white: "#ffffff",
  red: "#ef4444",
  green: "#22c55e",
  blue: "#3b82f6",
  yellow: "#eab308",
  gray: "#71717a",
  zinc: "#71717a",
};

export function PropInput({
  nodeId,
  propName,
  value,
  values,
  control,
  updateNode,
}: {
  nodeId: string;
  propName: string;
  value: unknown;
  values: Record<string, unknown>;
  control: InspectorControl;
  updateNode: UpdateNode;
}) {
  function updateProp(nextValue: unknown) {
    updateNode(nodeId, (currentNode) => ({
      ...currentNode,
      props: {
        ...(currentNode.props ?? {}),
        [propName]: nextValue,
      },
    }));
  }

  if (control.kind === "text-format") {
    const bold = values.fontWeight === "bold";
    const italic = Boolean(values.italic);
    const underline = Boolean(values.underline);

    function toggleTextStyle(
      property: "fontWeight" | "italic" | "underline",
      enabled: boolean,
    ) {
      updateNode(nodeId, (currentNode) => {
        const nextProps = { ...(currentNode.props ?? {}) };

        if (enabled) {
          nextProps[property] = property === "fontWeight" ? "bold" : true;
        } else {
          delete nextProps[property];
        }

        return {
          ...currentNode,
          props: nextProps,
        };
      });
    }

    return (
      <PropertyField label="format">
        <div
          data-editor-ignore
          className="inline-flex h-9 overflow-hidden rounded-md border border-[var(--editor-border)] bg-[var(--editor-surface)]"
        >
          <FormatButton
            label="B"
            title="Bold"
            active={bold}
            className="font-bold"
            onClick={() => toggleTextStyle("fontWeight", !bold)}
          />
          <FormatButton
            label="I"
            title="Italic"
            active={italic}
            className="italic"
            onClick={() => toggleTextStyle("italic", !italic)}
          />
          <FormatButton
            label="U"
            title="Underline"
            active={underline}
            className="underline"
            onClick={() => toggleTextStyle("underline", !underline)}
          />
        </div>
      </PropertyField>
    );
  }

  if (control.kind === "color") {
    const textColorValue =
      typeof value === "string" && value ? value : "#18181b";

    return (
      <PropertyField label={propName}>
        <div className="flex items-center gap-2">
          <input
            data-editor-ignore
            type="color"
            value={normalizeColorForInput(textColorValue)}
            onChange={(event) => updateProp(event.target.value)}
            className="h-9 w-12 rounded-md border border-[var(--editor-border)] bg-[var(--editor-surface)] p-1 cursor-pointer transition hover:border-[var(--editor-accent-border)]"
          />
          <input
            data-editor-ignore
            type="text"
            value={textColorValue}
            onChange={(event) => updateProp(event.target.value)}
            className={inputClassName}
          />
        </div>
      </PropertyField>
    );
  }

  if (control.kind === "select") {
    return (
      <PropertyField label={propName}>
        <select
          data-editor-ignore
          value={String(value ?? control.options[0] ?? "")}
          onChange={(event) => updateProp(event.target.value)}
          className={inputClassName}
        >
          {control.options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </PropertyField>
    );
  }

  if (control.kind === "toggle") {
    const checked = Boolean(value);

    return (
      <PropertyField label={propName}>
        <label className="flex items-center gap-3 h-9 px-3 rounded-md border border-[var(--editor-border)] bg-[var(--editor-surface)] cursor-pointer transition hover:bg-[var(--editor-accent-soft)] hover:border-[var(--editor-accent-border)]">
          <input
            data-editor-ignore
            type="checkbox"
            checked={checked}
            onChange={(event) => updateProp(event.target.checked)}
            className="h-4 w-4 rounded border-[var(--editor-border-strong)] text-[var(--editor-accent)] focus:ring-[var(--editor-accent-soft)]"
          />
          <span className="text-sm text-[var(--editor-text-muted)]">
            {checked ? "Enabled" : "Disabled"}
          </span>
        </label>
      </PropertyField>
    );
  }

  if (control.kind === "number") {
    return (
      <PropertyField label={propName}>
        <input
          data-editor-ignore
          type="number"
          value={typeof value === "number" ? value : Number(value ?? 0)}
          min={control.min}
          max={control.max}
          step={control.step}
          onChange={(event) => updateProp(Number(event.target.value))}
          className={inputClassName}
        />
      </PropertyField>
    );
  }

  return (
    <PropertyField label={propName}>
      <input
        data-editor-ignore
        type="text"
        value={String(value ?? "")}
        onChange={(event) => updateProp(event.target.value)}
        className={inputClassName}
      />
    </PropertyField>
  );
}

function FormatButton({
  label,
  title,
  active,
  className,
  onClick,
}: {
  label: string;
  title: string;
  active: boolean;
  className?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={title}
      aria-pressed={active}
      title={title}
      onClick={onClick}
      className={`
        h-9 min-w-10 border-r border-[var(--editor-border)] px-3 text-sm
        transition last:border-r-0
        ${
          active
            ? "bg-[var(--editor-accent-soft)] text-[var(--editor-accent)]"
            : "text-[var(--editor-text-muted)] hover:bg-[var(--editor-accent-soft)] hover:text-[var(--editor-text)]"
        }
        ${className ?? ""}
      `}
    >
      {label}
    </button>
  );
}

function PropertyField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium text-[var(--editor-text-muted)]">
        {label}
      </span>
      {children}
    </label>
  );
}

const inputClassName = `
  h-9
  w-full
  rounded-md
  border
  border-[var(--editor-border)]
  bg-[var(--editor-surface)]
  px-3
  text-sm
  text-[var(--editor-text)]
  outline-none
  transition
  focus:border-[var(--editor-accent-border)]
  focus:ring-2
  focus:ring-[var(--editor-accent-soft)]
`;

function normalizeColorForInput(value: string) {
  const normalized = namedColors[value.toLowerCase()] ?? value;

  if (/^#[0-9a-fA-F]{6}$/.test(normalized)) {
    return normalized;
  }

  if (/^#[0-9a-fA-F]{3}$/.test(normalized)) {
    const [r, g, b] = normalized.slice(1).split("");
    return `#${r}${r}${g}${g}${b}${b}`;
  }

  return "#18181b";
}
