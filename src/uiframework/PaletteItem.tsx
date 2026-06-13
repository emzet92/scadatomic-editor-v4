// ComponentPalette.tsx

import { useEditorStore } from "./editor-store";

type PaletteItem = {
  type: keyof typeof defaults;
  label: string;
};

const defaults = {
  Container: {
    padding: 12,
    row: 1,
    gap: 8,
  },

  Text: {
    value: "Text",
  },

  Button: {
    label: "Button",
  },
};

const items: PaletteItem[] = [
  {
    type: "Container",
    label: "Container",
  },
  {
    type: "Text",
    label: "Text",
  },
  {
    type: "Button",
    label: "Button",
  },
];

export function ComponentPalette() {
  const startComponentDrag =
    useEditorStore(
      (s) => s.startComponentDrag
    );

  return (
    <div data-editor-ignore>
      <h3>Components</h3>

      {items.map((item) => (
        <div
          key={item.type}
          onPointerDown={() => {
            startComponentDrag({
              type: item.type,
              props: defaults[item.type],
            });
          }}
          style={{
            padding: 8,
            marginBottom: 6,
            border: "1px solid #ccc",
            borderRadius: 4,
            cursor: "grab",
            userSelect: "none",
            width: 150,
          }}
        >
          {item.label}
        </div>
      ))}
    </div>
  );
}