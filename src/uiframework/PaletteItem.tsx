// ComponentPalette.tsx

type PaletteItem = {
  type: string;
  label: string;
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
  return (
    <div data-editor-ignore>
      <h3>Components</h3>

      {items.map((item) => (
        <div
          key={item.type}
          draggable
          onDragStart={(event) => {
            event.dataTransfer.setData(
              "application/scadatomic-component",
              item.type
            );

            event.dataTransfer.effectAllowed = "copy";
          }}
          style={{
            padding: 8,
            marginBottom: 6,
            border: "1px solid #ccc",
            borderRadius: 4,
            cursor: "grab",
            userSelect: "none",
            width: "150 px"
          }}
        >
          {item.label}
        </div>
      ))}
    </div>
  );
}