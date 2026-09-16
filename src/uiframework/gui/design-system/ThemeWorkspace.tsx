import { MonitorCog, Moon, Palette, Sun } from "lucide-react";
import { useMemo } from "react";
import {
  createSemanticColorTokenRef,
  isColorTokenRef,
  resolveColorValue,
} from "../../design-system/colors";
import { ensureProjectAppearance } from "../../design-system/theme-config";
import { useEditorStore } from "../../editor-store";
import {
  Callout,
  ChoiceCard,
  DataGrid,
  DataGridHeader,
  DataGridRow,
  FormField,
  PageContainer,
  PageHeader,
  PanelCard,
  SectionHeader,
  Select,
} from "../ui";

const SEMANTIC_GRID = "grid-cols-[minmax(170px,1.1fr)_72px_minmax(220px,1fr)]";

export function ThemeWorkspace() {
  const document = useEditorStore((state) => state.document);
  const previewThemeId = useEditorStore((state) => state.previewThemeId);
  const setPreviewDesignTheme = useEditorStore((state) => state.setPreviewDesignTheme);
  const setThemeRuntimeMode = useEditorStore((state) => state.setThemeRuntimeMode);
  const setDefaultDesignTheme = useEditorStore((state) => state.setDefaultDesignTheme);
  const setSystemDesignTheme = useEditorStore((state) => state.setSystemDesignTheme);
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

  const appearance = ensureProjectAppearance(document.appearance, designSystem);
  const editingThemeId =
    (previewThemeId && designSystem?.themes?.[previewThemeId] ? previewThemeId : undefined) ??
    appearance.defaultThemeId ??
    themes[0]?.id ??
    "";

  return (
    <PageContainer>
      <PageHeader
        icon={<Palette size={14} />}
        title="Themes & semantic colors"
        description="Designer preview is independent from runtime state. Configure the runtime source here, then preview any theme without changing the saved runtime session."
      />

      <PanelCard padding="lg" className="mb-5">
        <SectionHeader
          className="mb-4"
          title={
            <span className="flex items-center gap-2">
              <MonitorCog size={14} /> Runtime theme policy
            </span>
          }
        />
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Theme source">
            <Select
              value={appearance.themeMode}
              onChange={(event) =>
                setThemeRuntimeMode(event.target.value as "fixed" | "system" | "runtime")
              }
            >
              <option value="fixed">Fixed</option>
              <option value="system">Follow system</option>
              <option value="runtime">Runtime controlled</option>
            </Select>
          </FormField>

          <FormField label={appearance.themeMode === "runtime" ? "Initial theme" : "Default theme"}>
            <Select
              value={appearance.defaultThemeId}
              onChange={(event) => setDefaultDesignTheme(event.target.value)}
            >
              {themes.map((theme) => (
                <option key={theme.id} value={theme.id}>{theme.name}</option>
              ))}
            </Select>
          </FormField>

          {appearance.themeMode === "system" ? (
            <>
              <FormField label="System light">
                <Select
                  value={appearance.systemLightThemeId ?? appearance.defaultThemeId}
                  onChange={(event) => setSystemDesignTheme("light", event.target.value)}
                >
                  {themes.map((theme) => (
                    <option key={theme.id} value={theme.id}>{theme.name}</option>
                  ))}
                </Select>
              </FormField>
              <FormField label="System dark">
                <Select
                  value={appearance.systemDarkThemeId ?? appearance.defaultThemeId}
                  onChange={(event) => setSystemDesignTheme("dark", event.target.value)}
                >
                  {themes.map((theme) => (
                    <option key={theme.id} value={theme.id}>{theme.name}</option>
                  ))}
                </Select>
              </FormField>
            </>
          ) : null}
        </div>
        <Callout size="sm" className="mt-4">
          {appearance.themeMode === "runtime"
            ? 'Runtime starts with the initial theme. Scripts may switch it with App.theme = "dark" (theme name or id).'
            : appearance.themeMode === "system"
              ? "Runtime follows prefers-color-scheme and maps system light/dark to the themes selected above."
              : "Runtime always uses the configured default theme."}
        </Callout>
      </PanelCard>

      <PanelCard padding="lg" className="mb-5">
        <SectionHeader className="mb-3" title="Designer preview & mapping editor" />
        <div className="grid gap-2 sm:grid-cols-2">
          {themes.map((theme) => {
            const active = theme.id === editingThemeId;
            const dark = theme.name.toLocaleLowerCase().includes("dark");
            const Icon = dark ? Moon : Sun;
            return (
              <ChoiceCard
                key={theme.id}
                selected={active}
                icon={<Icon size={16} />}
                title={theme.name}
                description={active ? "Previewing in Designer" : "Preview without changing runtime state"}
                onClick={() => setPreviewDesignTheme(theme.id)}
              />
            );
          })}
        </div>
      </PanelCard>

      <DataGrid>
        <DataGridHeader columns={SEMANTIC_GRID}>
          <span>Semantic role</span>
          <span>Preview</span>
          <span>{themes.find((theme) => theme.id === editingThemeId)?.name ?? "Theme"} mapping</span>
        </DataGridHeader>

        {semanticColors.map((token) => {
          const source = token.values[editingThemeId];
          const sourceId = isColorTokenRef(source) ? source.tokenId : "";
          const resolved = resolveColorValue(
            createSemanticColorTokenRef(token.id),
            designSystem,
            undefined,
            editingThemeId
          );
          return (
            <DataGridRow key={token.id} columns={SEMANTIC_GRID}>
              <div>
                <div className="text-sm font-medium text-[var(--editor-text)]">{token.name}</div>
                <div className="mt-0.5 font-mono text-[10px] text-[var(--editor-text-soft)]">{resolved}</div>
              </div>
              <span
                className="h-9 w-9 rounded-[12px] border border-[var(--editor-border)] shadow-sm"
                style={{ background: resolved }}
              />
              <Select
                aria-label={`${token.name} ${editingThemeId} mapping`}
                value={sourceId}
                onChange={(event) => setSemanticColorThemeValue(token.id, editingThemeId, event.target.value)}
              >
                {!sourceId ? <option value="">Literal / detached value</option> : null}
                {foundations.map((foundation) => (
                  <option key={foundation.id} value={foundation.id}>
                    {foundation.name} — {foundation.value}
                  </option>
                ))}
              </Select>
            </DataGridRow>
          );
        })}
      </DataGrid>
    </PageContainer>
  );
}
