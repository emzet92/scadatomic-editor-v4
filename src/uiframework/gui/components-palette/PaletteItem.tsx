import { useMemo, useState } from "react";
import {
  Box,
  Boxes,
  ChartLine,
  LayoutTemplate,
  GripVertical,
  Menu,
  RectangleHorizontal,
  Search,
  Type,
} from "lucide-react";
import { useEditorStore } from "../../editor-store";
import {
  createProjectComponentRepository,
  wouldCreateComponentCycle,
} from "../../component-repository";
import {
  componentDefinitions,
  type RegisteredComponentType,
} from "../../registry/component-definitions";

const icons = {
  Page: LayoutTemplate,
  Container: Box,
  Text: Type,
  Button: RectangleHorizontal,
  Chart: ChartLine,
  Navigation: Menu,
} satisfies Record<RegisteredComponentType, typeof Box>;

export function ComponentPalette({
  ownerComponentId,
  onEditComponentDefinition,
}: {
  ownerComponentId?: string | undefined;
  onEditComponentDefinition?: ((componentId: string) => void) | undefined;
} = {}) {
  const [search, setSearch] = useState("");
  const startComponentDrag = useEditorStore((s) => s.startComponentDrag);
  const document = useEditorStore((s) => s.document);
  const reusableComponents = useMemo(
    () => createProjectComponentRepository(document).list(),
    [document]
  );

  const normalizedSearch = search.toLowerCase();
  const items = Object.values(componentDefinitions).filter(
    (item) =>
      item.type !== "Page" &&
      item.label.toLowerCase().includes(normalizedSearch)
  );
  const reusableItems = reusableComponents.filter((item) =>
    item.name.toLowerCase().includes(normalizedSearch) &&
    (!ownerComponentId ||
      !wouldCreateComponentCycle(document, ownerComponentId, item.id))
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

      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-violet-600">
          <Boxes size={12} /> Component library
        </div>

        {reusableItems.length > 0 ? (
          reusableItems.map((item) => (
            <div
              key={item.id}
              data-editor-ignore
              role="button"
              tabIndex={0}
              onClick={() => onEditComponentDefinition?.(item.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onEditComponentDefinition?.(item.id);
                }
              }}
              className="group w-full p-3 rounded-xl border border-violet-200 bg-violet-50/50 hover:bg-violet-50 transition-all flex items-start gap-3 text-left cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-violet-200"
              title={`Open ${item.name} definition`}
            >
              <div className="h-10 w-10 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center shrink-0">
                <Boxes size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-[var(--editor-text)]">
                  {item.name}
                </div>
                <div className="text-xs text-[var(--editor-text-muted)]">
                  Reusable project component
                </div>
              </div>
              <button
                type="button"
                data-editor-ignore
                onClick={(event) => event.stopPropagation()}
                onPointerDown={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  startComponentDrag({
                    type: "ComponentInstance",
                    componentDefinitionId: item.id,
                    label: item.name,
                    props: Object.fromEntries(
                      Object.entries(item.inputs ?? {}).map(([name, input]) => [
                        name,
                        input.defaultValue,
                      ])
                    ),
                  });
                }}
                className="flex size-8 shrink-0 items-center justify-center rounded-lg text-violet-400 opacity-70 transition hover:bg-white hover:text-violet-700 group-hover:opacity-100 cursor-grab active:cursor-grabbing"
                title="Drag component to canvas"
                aria-label={`Drag ${item.name} to canvas`}
              >
                <GripVertical size={16} />
              </button>
            </div>
          ))
        ) : (
          <div className="rounded-xl border border-dashed border-violet-200 bg-violet-50/30 px-3 py-3 text-[10px] leading-4 text-violet-700/80">
            Create a component from a Container or multi-selection and it will appear here.
          </div>
        )}
      </div>

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
                  label: item.label,
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
