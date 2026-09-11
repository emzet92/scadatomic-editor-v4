import {
  Home,
  LayoutTemplate,
  Monitor,
  Smartphone,
  Tablet,
} from "lucide-react";
import {
  getPageKind,
  type UiDocument,
  type UiNode,
  type UiPage,
} from "../../core/document";
import {
  getPageLayouts,
  hasPageContentSlot,
} from "../../core/page-layouts";
import type { UpdateNode } from "./property-panel-types";
import {
  Button,
  FormField,
  PanelCard,
  SectionHeader,
  Select,
  TextInput,
} from "../ui";

const presets = [
  { mode: "desktop", label: "Desktop", width: 1440, height: 900, icon: Monitor },
  { mode: "tablet", label: "Tablet", width: 834, height: 1194, icon: Tablet },
  { mode: "mobile", label: "Mobile", width: 390, height: 844, icon: Smartphone },
] as const;

export function PageSettingsEditor({
  document,
  page,
  node,
  updateNode,
  isStartPage = false,
  onSetStartPage,
  onSetLayout,
}: {
  document: UiDocument;
  page: UiPage;
  node: UiNode;
  updateNode: UpdateNode;
  isStartPage?: boolean | undefined;
  onSetStartPage?: (() => void) | undefined;
  onSetLayout?: ((layoutId: string | null) => void) | undefined;
}) {
  const kind = getPageKind(page);
  const mode = String(node.props?.deviceMode ?? "desktop");
  const width = Number(node.props?.width ?? 1440);
  const height = Number(node.props?.height ?? 900);
  const layouts = getPageLayouts(document);
  const selectedLayout = page.layoutId ? document.pages[page.layoutId] : undefined;
  const selectedLayoutValid =
    !selectedLayout || hasPageContentSlot(document, selectedLayout);

  function setSize(property: "width" | "height", value: number) {
    updateNode(node.id, (current) => ({
      ...current,
      props: { ...(current.props ?? {}), [property]: value },
    }));
  }

  return (
    <div className="space-y-6">
      {kind === "layout" ? (
        <section>
          <SectionHeader
            title="Page layout"
            description="Shared page chrome. The content slot is filled by each page that uses this layout."
            className="mb-2"
          />
          <PanelCard className="flex items-center gap-2 p-2.5 text-xs text-violet-700">
            <LayoutTemplate size={13} className="shrink-0" />
            <span>Edit this layout like a page. Keep one content Page Slot where page content should render.</span>
          </PanelCard>
        </section>
      ) : null}

      {kind === "page" && onSetStartPage ? (
        <section>
          <SectionHeader
            title="Runtime entry"
            description="The start page is rendered when runtime opens without an explicit navigation path."
            className="mb-2"
          />
          <PanelCard className="flex items-center justify-between gap-3 p-2.5">
            <div className="flex min-w-0 items-center gap-2 text-xs text-[var(--editor-text)]">
              <Home size={13} className="shrink-0 text-[var(--editor-text-muted)]" />
              <span className="truncate">{isStartPage ? "Default start page" : "Not the start page"}</span>
            </div>
            {isStartPage ? (
              <span className="rounded bg-[var(--editor-accent-soft)] px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--editor-accent)]">
                start
              </span>
            ) : (
              <Button size="xs" variant="secondary" onClick={onSetStartPage}>
                Set as start
              </Button>
            )}
          </PanelCard>
        </section>
      ) : null}

      {kind === "page" && onSetLayout ? (
        <section>
          <SectionHeader
            title="Layout"
            description="Render this page inside a shared Page Layout."
            className="mb-2"
          />
          <FormField
            label="Page layout"
            description={
              selectedLayoutValid
                ? "The page remains its own resource; the layout is composed only while rendering."
                : "The selected layout has no content slot, so this page content cannot be projected into it."
            }
            error={selectedLayoutValid ? undefined : "Missing content Page Slot"}
          >
            <Select
              value={page.layoutId ?? ""}
              onChange={(event) => onSetLayout(event.target.value || null)}
              invalid={!selectedLayoutValid}
            >
              <option value="">None</option>
              {layouts.map((layout) => (
                <option key={layout.id} value={layout.id}>
                  {layout.name}
                </option>
              ))}
            </Select>
          </FormField>
        </section>
      ) : null}

      <section>
        <SectionHeader title={kind === "layout" ? "Layout viewport" : "Page viewport"} className="mb-2" />

        <div className="grid grid-cols-3 overflow-hidden rounded-lg border border-[var(--editor-border)] bg-[var(--editor-surface)]">
          {presets.map((preset) => {
            const Icon = preset.icon;
            const active = mode === preset.mode;
            return (
              <button
                key={preset.mode}
                type="button"
                onClick={() =>
                  updateNode(node.id, (current) => ({
                    ...current,
                    props: {
                      ...(current.props ?? {}),
                      deviceMode: preset.mode,
                      width: preset.width,
                      height: preset.height,
                    },
                  }))
                }
                className={`flex min-w-0 flex-col items-center gap-1 border-r border-[var(--editor-border)] px-2 py-2.5 text-[10px] font-medium transition last:border-r-0 ${
                  active
                    ? "bg-[var(--editor-accent-soft)] text-[var(--editor-accent)]"
                    : "text-[var(--editor-text-muted)] hover:bg-[var(--editor-surface-muted)]"
                }`}
              >
                <Icon size={14} />
                {preset.label}
              </button>
            );
          })}
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <FormField
            label="Width"
            compact
            className="rounded-md border border-[var(--editor-border)] bg-[var(--editor-surface)] px-2.5 py-2"
          >
            <TextInput
              type="number"
              min={240}
              value={width}
              onChange={(event) =>
                setSize("width", Math.max(240, Number(event.target.value) || 240))
              }
              className="h-auto border-0 bg-transparent p-0 text-xs font-medium focus:ring-0"
            />
          </FormField>
          <FormField
            label="Height"
            compact
            className="rounded-md border border-[var(--editor-border)] bg-[var(--editor-surface)] px-2.5 py-2"
          >
            <TextInput
              type="number"
              min={240}
              value={height}
              onChange={(event) =>
                setSize("height", Math.max(240, Number(event.target.value) || 240))
              }
              className="h-auto border-0 bg-transparent p-0 text-xs font-medium focus:ring-0"
            />
          </FormField>
        </div>
      </section>
    </div>
  );
}
