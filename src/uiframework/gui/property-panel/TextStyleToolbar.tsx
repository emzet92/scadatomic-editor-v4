import type { UpdateNode } from "./property-panel-types";

export function TextStyleToolbar({
  nodeId,
  fontWeight,
  italic,
  underline,
  updateNode,
}: {
  nodeId: string;
  fontWeight: unknown;
  italic: unknown;
  underline: unknown;
  updateNode: UpdateNode;
}) {
  const isBold = fontWeight === "bold";
  const isItalic = Boolean(italic);
  const isUnderline = Boolean(underline);

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
        Text style
      </label>

      <div className="grid grid-cols-3 gap-1">
        <button
          data-editor-ignore
          type="button"
          onClick={() => {
            updateProp(
              "fontWeight",
              isBold ? "normal" : "bold"
            );
          }}
          className={styleButtonClassName(isBold)}
        >
          <span className="font-bold">B</span>
        </button>

        <button
          data-editor-ignore
          type="button"
          onClick={() => {
            updateProp("italic", !isItalic);
          }}
          className={styleButtonClassName(isItalic)}
        >
          <span className="italic">I</span>
        </button>

        <button
          data-editor-ignore
          type="button"
          onClick={() => {
            updateProp("underline", !isUnderline);
          }}
          className={styleButtonClassName(isUnderline)}
        >
          <span className="underline">U</span>
        </button>
      </div>
    </div>
  );
}

function styleButtonClassName(
  selected: boolean
) {
  return `
    h-9
    rounded-md
    border
    text-sm
    font-semibold
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