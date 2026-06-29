// ComponentPalette.tsx

import { useState } from "react";
import { useEditorStore } from "../../editor-store";
import {
  Box,
  Type,
  RectangleHorizontal,
  Search,
  ChartLine,
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

  Chart: {
    title: "Trend",
    kind: "line",
    tag: "",
    width: "100%",
    minHeight: 240,
    points: [
      {
        label: "1",
        value: 20,
      },
      {
        label: "2",
        value: 35,
      },
      {
        label: "3",
        value: 28,
      },
      {
        label: "4",
        value: 44,
      },
      {
        label: "5",
        value: 38,
      },
    ],
    color: "#4f46e5",
    showLegend: false,
    showGrid: true,
  },
};

const items = [
  {
    type: "Container" as const,
    label: "Container",
    description: "Layout container",
    icon: Box,
  },

  {
    type: "Text" as const,
    label: "Text",
    description: "Static text",
    icon: Type,
  },

  {
    type: "Button" as const,
    label: "Button",
    description: "User action",
    icon: RectangleHorizontal,
  },

  {
    type: "Chart" as const,
    label: "Chart",
    description: "Line or bar chart",
    icon: ChartLine,
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
            text-[var(--editor-text-muted)]
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
              text-[var(--editor-text-soft)]
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
              border-[var(--editor-border)]

              bg-[var(--editor-surface)]

              text-sm
              text-[var(--editor-text)]

              outline-none

              placeholder:text-[var(--editor-text-soft)]

              focus:border-[var(--editor-accent-border)]
              focus:ring-2
              focus:ring-[var(--editor-accent-soft)]
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
                border-[var(--editor-border)]

                bg-[var(--editor-surface)]

                hover:border-[var(--editor-accent-border)]
                hover:bg-[var(--editor-accent-soft)]

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

                  bg-[var(--editor-accent-soft)]
                  text-[var(--editor-accent)]

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
                    text-[var(--editor-text)]
                  "
                >
                  {item.label}
                </div>

                <div
                  className="
                    text-xs
                    text-[var(--editor-text-muted)]
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
              text-[var(--editor-text-muted)]
            "
          >
            No components found
          </div>
        )}
    </div>
  );
}