// ComponentPalette.tsx

import { useEditorStore } from "./editor-store";
import {
  Box,
  Type,
  RectangleHorizontal,
} from "lucide-react";

const defaults = {
  Container: {
    display: "flex",
    gap: 8,
    padding: 12,
    row: 0,
    borderSize: 1,
  },

  Text: {
    value: "Text",
  },

  Button: {
    label: "Button",
  },
};

const items = [
  {
    type: "Container" as const,
    label: "Container",
    description:
      "Layout container",
    icon: Box,
  },

  {
    type: "Text" as const,
    label: "Text",
    description:
      "Static text",
    icon: Type,
  },

  {
    type: "Button" as const,
    label: "Button",
    description:
      "User action",
    icon:
      RectangleHorizontal,
  },
];

export function ComponentPalette() {
  const startComponentDrag =
    useEditorStore(
      (s) => s.startComponentDrag
    );

  return (
    <div
      data-editor-ignore
      className="space-y-3"
    >
      <div>
        <div
          className="
            text-xs
            uppercase
            tracking-wide
            font-semibold
            text-zinc-500
          "
        >
          Components
        </div>
      </div>

      {items.map((item) => {
        const Icon =
          item.icon;

        return (
          <button
            key={item.type}
            data-editor-ignore
            onPointerDown={() => {
              startComponentDrag(
                {
                  type: item.type,
                  props:
                    defaults[
                    item.type
                    ],
                }
              );
            }}
            className="
              w-full
              p-3

              rounded-xl
              border
              border-zinc-200

              bg-white

              hover:border-sky-300
              hover:bg-sky-50

              transition-all

              flex
              items-start
              gap-3

              text-left
              cursor-grab
              select-none
            "
          >
            <div
              className="
                h-9
                w-9

                rounded-lg

                bg-sky-100
                text-sky-600

                flex
                items-center
                justify-center

                shrink-0
              "
            >
              <Icon size={18} />
            </div>

            <div className="min-w-0">
              <div
                className="
                  text-sm
                  font-medium
                  text-zinc-900
                "
              >
                {item.label}
              </div>

              <div
                className="
                  text-xs
                  text-zinc-500
                "
              >
                {
                  item.description
                }
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}