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

export function BorderSettings({
    nodeId,
    borderSize,
    borderColor,
    borderRadius,
    updateNode,
}: {
    nodeId: string;
    borderSize: unknown;
    borderColor: unknown;
    borderRadius: unknown;
    updateNode: UpdateNode;
}) {
    const resolvedBorderSize =
        typeof borderSize === "number"
            ? borderSize
            : Number(borderSize ?? 0);

    const resolvedBorderRadius =
        typeof borderRadius === "number"
            ? borderRadius
            : Number(borderRadius ?? 0);

    const resolvedBorderColor =
        typeof borderColor === "string" && borderColor
            ? borderColor
            : "#d4d4d8";

    function updateProp(
        propName: string,
        nextValue: unknown
    ) {
        updateNode(nodeId, (currentNode) => ({
            ...currentNode,
            props: {
                ...(currentNode.props ?? {}),
                [propName]: nextValue,
            },
        }));
    }

    return (
        <div className="space-y-3">
            <div>
                <div
                    className="
            text-xs
            font-medium
            uppercase
            tracking-wide
            text-zinc-500
          "
                >
                    Border settings
                </div>

                <div className="mt-1 text-xs text-zinc-400">
                    Border style for this text component.
                </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
                <NumberField
                    label="Size"
                    value={resolvedBorderSize}
                    onChange={(value) => {
                        updateProp("borderSize", value);
                    }}
                />

                <NumberField
                    label="Radius"
                    value={resolvedBorderRadius}
                    onChange={(value) => {
                        updateProp("borderRadius", value);
                    }}
                />
            </div>

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
                    Color
                </label>

                <div className="flex items-center gap-2">
                    <input
                        data-editor-ignore
                        type="color"
                        value={normalizeColorForInput(resolvedBorderColor)}
                        onChange={(e) => {
                            updateProp("borderColor", e.target.value);
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
                        value={resolvedBorderColor}
                        onChange={(e) => {
                            updateProp("borderColor", e.target.value);
                        }}
                        className={inputClassName}
                    />
                </div>
            </div>
        </div>
    );
}

function NumberField({
    label,
    value,
    onChange,
}: {
    label: string;
    value: number;
    onChange: (value: number) => void;
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

            <input
                data-editor-ignore
                type="number"
                value={value}
                onChange={(e) => {
                    onChange(
                        e.target.value === ""
                            ? 0
                            : Number(e.target.value)
                    );
                }}
                className={inputClassName}
            />
        </div>
    );
}

function normalizeColorForInput(
    value: string
) {
    const trimmed = value.trim();

    if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) {
        return trimmed;
    }

    const shortHex = trimmed.match(
        /^#([0-9a-fA-F]{3})$/
    );

    if (shortHex) {
        const [r, g, b] =
            shortHex[1].split("");

        return `#${r}${r}${g}${g}${b}${b}`;
    }

    const named =
        namedColors[trimmed.toLowerCase()];

    if (named) {
        return named;
    }

    return "#000000";
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