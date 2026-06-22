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
              border-zinc-200
              bg-white
              p-1
              cursor-pointer
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
            border-zinc-200
            bg-white
            cursor-pointer
            hover:bg-zinc-50
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
              border-zinc-300
              text-sky-600
              focus:ring-sky-500
            "
          />

          <span className="text-sm text-zinc-700">
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
          text-zinc-500
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
          border-sky-500
          bg-sky-50
          text-sky-700
        `
        : `
          border-zinc-200
          bg-white
          text-zinc-600
          hover:bg-zinc-50
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
  border-zinc-200
  bg-white
  text-sm
  text-zinc-900
  outline-none
  transition
  focus:border-sky-500
  focus:ring-2
  focus:ring-sky-100
`;