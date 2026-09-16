import { Moon, Palette, Sun } from "lucide-react";
import { useMemo } from "react";
import {
  createSemanticColorTokenRef,
  isColorTokenRef,
  resolveColorValue,
} from "../../design-system/colors";
import { useEditorStore } from "../../editor-store";
import { PanelCard, Select } from "../ui";

export function ThemeWorkspace() {
  const document = useEditorStore((state) => state.document);
  const setActiveDesignTheme = useEditorStore((state) => state.setActiveDesignTheme);
  const setSemanticColorThemeValue = useEditorStore((state) => state.setSemanticColorThemeValue);
  const designSystem = document.designSystem;

  const themes = useMemo(
    () => Object.values(designSystem?.themes ?? {}).sort((a, b) => a.name.localeCompare(b.name)),
    [designSystem?.themes]
  );
  const semanticColors = useMemo(
    () => Object.values(designSystem?.semanticColors ?? {}).sort((a, b) => a.name.localeCompare(b.name)),
    [designSystem?.semanticColors]
  );
  const foundations = useMemo(
    () => Object.values(designSystem?.colors ?? {}).sort((a, b) => a.name.localeCompare(b.name)),
    [designSystem?.colors]
  );

  const activeThemeId = designSystem?.activeThemeId ?? themes[0]?.id ?? "";

  return (
    <div className="mx-auto w-full max-w-6xl p-8">
      <div className="mb-7">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--editor-accent)]">
          <Palette size={14} /> Design System
        </div>
        <h1 className="mt-2 text-2xl font-semibold text-[var(--editor-text)]">Themes & semantic colors</h1>
        <p className="mt-1 max-w-3xl text-sm leading-6 text-[var(--editor-text-muted)]">
          Components reference semantic roles such as Surface/Default or Action/Primary. A theme maps those roles to foundation colors, so switching theme updates the whole project without rewiring components.
        </p>
      </div>

      <PanelCard className="mb-5">
        <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--editor-text-muted)]">
          Active theme
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {themes.map((theme) => {
            const active = theme.id === activeThemeId;
            const dark = theme.name.toLocaleLowerCase().includes("dark");
            const Icon = dark ? Moon : Sun;
            return (
              <button
                key={theme.id}
                type="button"
                onClick={() => setActiveDesignTheme(theme.id)}
                className={`flex items-center gap-3 rounded-xl border p-3 text-left transition ${
                  active
                    ? "border-[var(--editor-accent-border)] bg-[var(--editor-accent-soft)]"
                    : "border-[var(--editor-border)] bg-[var(--editor-surface)] hover:bg-[var(--editor-surface-muted)]"
                }`}
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--editor-surface-muted)] text-[var(--editor-text-muted)]">
                  <Icon size={16} />
                </span>
                <span>
                  <span className="block text-sm font-medium text-[var(--editor-text)]">{theme.name}</span>
                  <span className="block text-[10px] text-[var(--editor-text-soft)]">
                    {active ? "Active project theme" : "Click to preview and activate"}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </PanelCard>

      <div className="overflow-hidden rounded-2xl border border-[var(--editor-border)] bg-[var(--editor-surface)] shadow-sm">
        <div className="grid grid-cols-[minmax(170px,1.1fr)_72px_minmax(220px,1fr)] items-center gap-3 border-b border-[var(--editor-border)] bg-[var(--editor-surface-muted)] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--editor-text-muted)]">
          <span>Semantic role</span>
          <span>Preview</span>
          <span>{themes.find((theme) => theme.id === activeThemeId)?.name ?? "Theme"} mapping</span>
        </div>

        {semanticColors.map((token) => {
          const source = token.values[activeThemeId];
          const sourceId = isColorTokenRef(source) ? source.tokenId : "";
          const resolved = resolveColorValue(createSemanticColorTokenRef(token.id), designSystem);
          return (
            <div
              key={token.id}
              className="grid grid-cols-[minmax(170px,1.1fr)_72px_minmax(220px,1fr)] items-center gap-3 border-b border-[var(--editor-border)] px-4 py-3 last:border-b-0"
            >
              <div>
                <div className="text-sm font-medium text-[var(--editor-text)]">{token.name}</div>
                <div className="mt-0.5 font-mono text-[10px] text-[var(--editor-text-soft)]">{resolved}</div>
              </div>
              <span
                className="h-9 w-9 rounded-[12px] border border-[var(--editor-border)] shadow-sm"
                style={{ background: resolved }}
              />
              <Select
                aria-label={`${token.name} ${activeThemeId} mapping`}
                value={sourceId}
                onChange={(event) => setSemanticColorThemeValue(token.id, activeThemeId, event.target.value)}
              >
                {!sourceId ? <option value="">Literal / detached value</option> : null}
                {foundations.map((foundation) => (
                  <option key={foundation.id} value={foundation.id}>
                    {foundation.name} — {foundation.value}
                  </option>
                ))}
              </Select>
            </div>
          );
        })}
      </div>

      <div className="mt-5 rounded-xl border border-[var(--editor-border)] bg-[var(--editor-surface-muted)] p-4 text-xs leading-5 text-[var(--editor-text-muted)]">
        Default component properties point at semantic colors first. Foundation colors remain available for deliberate low-level overrides.
      </div>
    </div>
  );
}
