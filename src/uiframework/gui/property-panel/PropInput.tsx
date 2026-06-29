import type { ReactNode } from "react";
import type { UpdateNode } from "./property-panel-types";

const textAlignments = [
  {
    value: "left",
    label: "Left",
  },
  {
    value: "center",
    label: "Center",
  },
  {
    value: "right",
    label: "Right",
  },
];

const textVariants = [
  "body",
  "label",
  "title",
  "caption",
];

const displayModes = [
  "grid",
  "flex",
];

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
  updateNode,
}: {
  nodeId: string;
  propName: string;
  value: unknown;
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

  if (propName === "color") {
    const textColorValue =
      typeof value === "string" && value
        ? value
        : "#18181b";

    const pickerColorValue =
      normalizeColorForInput(textColorValue);

    return (
      <PropertyField label={propName}>
        <div className="flex items-center gap-2">
          <input
            data-editor-ignore
            type="color"
            value={pickerColorValue}
            onChange={(e) => {
              updateProp(e.target.value);
            }}
            className="
              h-9
              w-12
              rounded-md
              border
              border-[var(--editor-border)]
              bg-[var(--editor-surface)]
              p-1
              cursor-pointer
              transition
              hover:border-[var(--editor-accent-border)]
            "
          />

          <input
            data-editor-ignore
            type="text"
            value={textColorValue}
            onChange={(e) => {
              updateProp(e.target.value);
            }}
            className={inputClassName}
          />
        </div>
      </PropertyField>
    );
  }

  if (propName === "align") {
    const currentValue =
      typeof value === "string"
        ? value
        : "left";

    return (
      <PropertyField label={propName}>
        <div className="grid grid-cols-3 gap-1">
          {textAlignments.map((item) => {
            const selected =
              currentValue === item.value;

            return (
              <button
                key={item.value}
                data-editor-ignore
                type="button"
                onClick={() => {
                  updateProp(item.value);
                }}
                className={optionButtonClassName(selected)}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </PropertyField>
    );
  }

  if (propName === "variant") {
    return (
      <PropertyField label={propName}>
        <select
          data-editor-ignore
          value={String(value ?? "body")}
          onChange={(e) => {
            updateProp(e.target.value);
          }}
          className={inputClassName}
        >
          {textVariants.map((variant) => (
            <option
              key={variant}
              value={variant}
            >
              {variant}
            </option>
          ))}
        </select>
      </PropertyField>
    );
  }

  if (propName === "display") {
    const currentValue =
      typeof value === "string"
        ? value
        : "grid";

    return (
      <PropertyField label={propName}>
        <div className="grid grid-cols-2 gap-1">
          {displayModes.map((mode) => {
            const selected =
              currentValue === mode;

            return (
              <button
                key={mode}
                data-editor-ignore
                type="button"
                onClick={() => {
                  updateProp(mode);
                }}
                className={optionButtonClassName(selected)}
              >
                {mode}
              </button>
            );
          })}
        </div>
      </PropertyField>
    );
  }

  if (propName === "uppercase") {
    const checked =
      Boolean(value);

    return (
      <PropertyField label={propName}>
        <label
          className="
            flex
            items-center
            gap-3
            h-9
            px-3
            rounded-md
            border
            border-[var(--editor-border)]
            bg-[var(--editor-surface)]
            cursor-pointer
            transition
            hover:bg-[var(--editor-accent-soft)]
            hover:border-[var(--editor-accent-border)]
          "
        >
          <input
            data-editor-ignore
            type="checkbox"
            checked={checked}
            onChange={(e) => {
              updateProp(e.target.checked);
            }}
            className="
              h-4
              w-4
              rounded
              border-[var(--editor-border-strong)]
              text-[var(--editor-accent)]
              focus:ring-[var(--editor-accent-soft)]
            "
          />

          <span
            className="
              text-sm
              text-[var(--editor-text-muted)]
            "
          >
            {checked ? "Enabled" : "Disabled"}
          </span>
        </label>
      </PropertyField>
    );
  }

  const isNumber =
    typeof value === "number";

  return (
    <PropertyField label={propName}>
      <input
        data-editor-ignore
        type={isNumber ? "number" : "text"}
        value={String(value ?? "")}
        onChange={(e) => {
          const rawValue =
            e.target.value;

          const nextValue =
            isNumber
              ? rawValue === ""
                ? 0
                : Number(rawValue)
              : rawValue;

          updateProp(nextValue);
        }}
        className={inputClassName}
      />
    </PropertyField>
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
    <div className="space-y-1">
      <label
        className="
          block
          text-xs
          font-medium
          uppercase
          tracking-wide
          text-[var(--editor-text-muted)]
        "
      >
        {label}
      </label>

      {children}
    </div>
  );
}

function normalizeColorForInput(
  value: string
) {
  const trimmed =
    value.trim();

  if (
    /^#[0-9a-fA-F]{6}$/.test(trimmed)
  ) {
    return trimmed;
  }

  const shortHex =
    trimmed.match(
      /^#([0-9a-fA-F]{3})$/
    );

  if (shortHex) {
    const [r, g, b] =
      shortHex[1].split("");

    return `#${r}${r}${g}${g}${b}${b}`;
  }

  const named =
    namedColors[
      trimmed.toLowerCase()
    ];

  if (named) {
    return named;
  }

  return "#000000";
}

function optionButtonClassName(
  selected: boolean
) {
  return `
    h-9
    rounded-md
    border
    text-xs
    font-medium
    transition

    ${
      selected
        ? `
          border-[var(--editor-accent-border)]
          bg-[var(--editor-accent-soft)]
          text-[var(--editor-accent)]
        `
        : `
          border-[var(--editor-border)]
          bg-[var(--editor-surface)]
          text-[var(--editor-text-muted)]
          hover:bg-[var(--editor-accent-soft)]
          hover:border-[var(--editor-accent-border)]
          hover:text-[var(--editor-accent)]
        `
    }
  `;
}

const inputClassName = `
  w-full
  h-9
  px-3
  rounded-md
  border
  border-[var(--editor-border)]
  bg-[var(--editor-surface)]
  text-sm
  text-[var(--editor-text)]
  outline-none
  transition
  placeholder:text-[var(--editor-text-soft)]
  focus:border-[var(--editor-accent-border)]
  focus:ring-2
  focus:ring-[var(--editor-accent-soft)]
`;