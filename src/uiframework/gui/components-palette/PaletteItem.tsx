// ComponentPalette.tsx

import { useState } from "react";
import { useEditorStore } from "../../editor-store";
import {
  Box,
  Type,
  RectangleHorizontal,
  Search,
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
  const [search, setSearch] =
    useState("");

  const startComponentDrag =
    useEditorStore(
      (s) => s.startComponentDrag
    );

  const filteredItems =
    items.filter((item) =>
      item.label
        .toLowerCase()
        .includes(
          search.toLowerCase()
        )
    );

  return (
    <div
      data-editor-ignore
      className="space-y-4"
    >
      <div>
        <div
          className="
            text-xs
            uppercase
            tracking-wide
            font-semibold
            text-zinc-500
            mb-3
          "
        >
          Components
        </div>

        <div className="relative">
          <Search
            size={16}
            className="
              absolute
              left-3
              top-1/2
              -translate-y-1/2
              text-zinc-400
              pointer-events-none
            "
          />

          <input
            data-editor-ignore
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
            placeholder="Search components..."
            className="
              w-full
              h-10

              pl-10
              pr-3

              rounded-xl

              border
              border-zinc-200

              bg-white

              text-sm

              outline-none

              focus:border-sky-400
              focus:ring-2
              focus:ring-sky-100
            "
          />
        </div>
      </div>

      {filteredItems.map(
        (item) => {
          const Icon =
            item.icon;

          return (
            <button
              key={item.type}
              data-editor-ignore
              onPointerDown={() => {
                startComponentDrag(
                  {
                    type:
                      item.type,
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
                  h-10
                  w-10

                  rounded-xl

                  bg-sky-100
                  text-sky-600

                  flex
                  items-center
                  justify-center

                  shrink-0
                "
              >
                <Icon
                  size={18}
                />
              </div>

              <div className="min-w-0">
                <div
                  className="
                    text-sm
                    font-semibold
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
        }
      )}

      {filteredItems.length ===
        0 && (
        <div
          className="
            py-8
            text-center
            text-sm
            text-zinc-500
          "
        >
          No components found
        </div>
      )}
    </div>
  );
}