import { useState } from "react";
import {
  Box,
  Boxes,
  ChartLine,
  RectangleHorizontal,
  Search,
  Type,
} from "lucide-react";
import { useEditorStore } from "../../editor-store";
import {
  componentDefinitions,
  type RegisteredComponentType,
} from "../../registry/component-definitions";

const icons = {
  Container: Box,
  Text: Type,
  Button: RectangleHorizontal,
  Chart: ChartLine,
} satisfies Record<RegisteredComponentType, typeof Box>;

export function ComponentPalette() {
  const [search, setSearch] = useState("");
  const startComponentDrag = useEditorStore((s) => s.startComponentDrag);
  const reusableComponents = useEditorStore((s) =>
    Object.values(s.document.components ?? {})
  );

  const normalizedSearch = search.toLowerCase();
  const items = Object.values(componentDefinitions).filter((item) =>
    item.label.toLowerCase().includes(normalizedSearch)
  );
  const reusableItems = reusableComponents.filter((item) =>
    item.name.toLowerCase().includes(normalizedSearch)
  );

  return (
    <div data-editor-ignore className="space-y-4">
      <div>
        <div className="text-xs uppercase tracking-wide font-semibold text-[var(--editor-text-muted)] mb-3">
          Components
        </div>

        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--editor-text-soft)] pointer-events-none"
          />

          <input
            data-editor-ignore
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search components..."
            className="w-full h-10 pl-10 pr-3 rounded-xl border border-[var(--editor-border)] bg-[var(--editor-surface)] text-sm text-[var(--editor-text)] outline-none placeholder:text-[var(--editor-text-soft)] focus:border-[var(--editor-accent-border)] focus:ring-2 focus:ring-[var(--editor-accent-soft)]"
          />
        </div>
      </div>

      {reusableItems.length > 0 ? (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-violet-600">
            <Boxes size={12} /> Project components
          </div>
          {reusableItems.map((item) => (
            <button
              key={item.id}
              data-editor-ignore
              onPointerDown={(event) => {
                event.preventDefault();
                startComponentDrag({
                  type: "ComponentInstance",
                  componentDefinitionId: item.id,
                  props: Object.fromEntries(
                    Object.entries(item.inputs ?? {}).map(([name, input]) => [
                      name,
                      input.defaultValue,
                    ])
                  ),
                });
              }}
              className="w-full p-3 rounded-xl border border-violet-200 bg-violet-50/50 hover:bg-violet-50 transition-all flex items-start gap-3 text-left cursor-grab select-none"
            >
              <div className="h-10 w-10 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center shrink-0">
                <Boxes size={18} />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-[var(--editor-text)]">
                  {item.name}
                </div>
                <div className="text-xs text-[var(--editor-text-muted)]">
                  Encapsulated component
                </div>
              </div>
            </button>
          ))}
        </div>
      ) : null}

      <div className="space-y-2">
        {items.map((item) => {
          const Icon = icons[item.type as RegisteredComponentType];

          return (
            <button
              key={item.type}
              data-editor-ignore
              onPointerDown={(event) => {
                event.preventDefault();
                startComponentDrag({
                  type: item.type,
                  props: {},
                });
              }}
              className="w-full p-3 rounded-xl border border-[var(--editor-border)] bg-[var(--editor-surface)] hover:border-[var(--editor-accent-border)] hover:bg-[var(--editor-accent-soft)] transition-all flex items-start gap-3 text-left cursor-grab select-none"
            >
              <div className="h-10 w-10 rounded-xl bg-[var(--editor-accent-soft)] text-[var(--editor-accent)] flex items-center justify-center shrink-0">
                <Icon size={18} />
              </div>

              <div className="min-w-0">
                <div className="text-sm font-semibold text-[var(--editor-text)]">
                  {item.label}
                </div>
                <div className="text-xs text-[var(--editor-text-muted)]">
                  {item.description}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {items.length === 0 && reusableItems.length === 0 ? (
        <div className="py-8 text-center text-sm text-[var(--editor-text-muted)]">
          No components found
        </div>
      ) : null}
    </div>
  );
}
