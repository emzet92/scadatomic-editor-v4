import type { InspectorControl } from "../../registry/component-definitions";
import type { UpdateNode } from "./property-panel-types";
import {
  Checkbox,
  FormField,
  SegmentedControl,
  SegmentedControlItem,
  Select,
  TextInput,
} from "../ui";

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
      <FormField label="format">
        <SegmentedControl>
          <SegmentedControlItem
            aria-label="Bold"
            title="Bold"
            active={bold}
            className="font-bold"
            onClick={() => toggleTextStyle("fontWeight", !bold)}
          >
            B
          </SegmentedControlItem>
          <SegmentedControlItem
            aria-label="Italic"
            title="Italic"
            active={italic}
            className="italic"
            onClick={() => toggleTextStyle("italic", !italic)}
          >
            I
          </SegmentedControlItem>
          <SegmentedControlItem
            aria-label="Underline"
            title="Underline"
            active={underline}
            className="underline"
            onClick={() => toggleTextStyle("underline", !underline)}
          >
            U
          </SegmentedControlItem>
        </SegmentedControl>
      </FormField>
    );
  }

  if (control.kind === "text-align") {
    const alignment =
      value === "center" || value === "right" ? value : "left";

    return (
      <FormField label="alignment">
        <SegmentedControl>
          {(["left", "center", "right"] as const).map((nextAlignment) => (
            <SegmentedControlItem
              key={nextAlignment}
              active={alignment === nextAlignment}
              aria-label={`Align ${nextAlignment}`}
              title={`Align ${nextAlignment}`}
              onClick={() => updateProp(nextAlignment)}
            >
              <TextAlignIcon alignment={nextAlignment} />
            </SegmentedControlItem>
          ))}
        </SegmentedControl>
      </FormField>
    );
  }

  if (control.kind === "border-size") {
    const borderSize =
      typeof value === "number" ? value : Number(value ?? control.min ?? 0);

    return (
      <FormField label="border">
        <div
          data-editor-ignore
          className="flex h-9 w-full items-center overflow-hidden rounded-md border border-[var(--editor-border)] bg-[var(--editor-surface)] transition focus-within:border-[var(--editor-accent-border)] focus-within:ring-2 focus-within:ring-[var(--editor-accent-soft)]"
        >
          <span
            title="Border size · all sides"
            className="flex h-full w-10 shrink-0 items-center justify-center border-r border-[var(--editor-border)] text-[var(--editor-text-muted)]"
          >
            <BorderAllIcon />
          </span>
          <input
            type="number"
            aria-label="Border size"
            value={Number.isFinite(borderSize) ? borderSize : 0}
            min={control.min}
            max={control.max}
            step={control.step}
            onChange={(event) => updateProp(Number(event.target.value))}
            className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm text-[var(--editor-text)] outline-none"
          />
          <span className="pr-3 text-xs text-[var(--editor-text-muted)] opacity-70">px</span>
        </div>
      </FormField>
    );
  }

  if (control.kind === "color") {
    const textColorValue =
      typeof value === "string" && value ? value : "#18181b";

    return (
      <FormField label={propName}>
        <div className="flex items-center gap-2">
          <input
            data-editor-ignore
            type="color"
            value={normalizeColorForInput(textColorValue)}
            onChange={(event) => updateProp(event.target.value)}
            className="h-9 w-12 rounded-md border border-[var(--editor-border)] bg-[var(--editor-surface)] p-1 cursor-pointer transition hover:border-[var(--editor-accent-border)]"
          />
          <TextInput
            value={textColorValue}
            onChange={(event) => updateProp(event.target.value)}
          />
        </div>
      </FormField>
    );
  }

  if (control.kind === "select") {
    return (
      <FormField label={propName}>
        <Select
          value={String(value ?? control.options[0] ?? "")}
          onChange={(event) => updateProp(event.target.value)}
        >
          {control.options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </Select>
      </FormField>
    );
  }

  if (control.kind === "toggle") {
    const checked = Boolean(value);

    return (
      <FormField label={propName}>
        <label className="flex items-center gap-3 h-9 px-3 rounded-md border border-[var(--editor-border)] bg-[var(--editor-surface)] cursor-pointer transition hover:bg-[var(--editor-accent-soft)] hover:border-[var(--editor-accent-border)]">
          <Checkbox
            checked={checked}
            onChange={(event) => updateProp(event.target.checked)}
          />
          <span className="text-sm text-[var(--editor-text-muted)]">
            {checked ? "Enabled" : "Disabled"}
          </span>
        </label>
      </FormField>
    );
  }

  if (control.kind === "number") {
    return (
      <FormField label={propName}>
        <TextInput
          type="number"
          value={typeof value === "number" ? value : Number(value ?? 0)}
          min={control.min}
          max={control.max}
          step={control.step}
          onChange={(event) => updateProp(Number(event.target.value))}
        />
      </FormField>
    );
  }

  return (
    <FormField label={propName}>
      <TextInput
        value={String(value ?? "")}
        onChange={(event) => updateProp(event.target.value)}
      />
    </FormField>
  );
}

function TextAlignIcon({
  alignment,
}: {
  alignment: "left" | "center" | "right";
}) {
  const lines = [14, 10, 14, 8];

  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      {lines.map((width, index) => {
        const x =
          alignment === "left"
            ? 1
            : alignment === "center"
              ? (16 - width) / 2
              : 15 - width;
        const y = 2 + index * 4;

        return (
          <path
            key={`${width}-${index}`}
            d={`M${x} ${y}H${x + width}`}
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        );
      })}
    </svg>
  );
}

function BorderAllIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="2.25"
        y="2.25"
        width="11.5"
        height="11.5"
        rx="1.25"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <rect
        x="5"
        y="5"
        width="6"
        height="6"
        rx="0.75"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.55"
      />
    </svg>
  );
}

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
