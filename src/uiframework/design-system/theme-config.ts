import type { DesignSystem, DesignThemeId } from "./colors";

export type ThemeRuntimeMode = "fixed" | "system" | "runtime";

/**
 * Project-level theme behavior. Theme definitions live in DesignSystem;
 * this object only decides how a runtime session chooses one of them.
 */
export type ProjectAppearance = {
  themeMode: ThemeRuntimeMode;
  defaultThemeId: DesignThemeId;
  systemLightThemeId?: DesignThemeId | undefined;
  systemDarkThemeId?: DesignThemeId | undefined;
};

export type SystemColorScheme = "light" | "dark";

export function createDefaultProjectAppearance(
  designSystem: DesignSystem | undefined
): ProjectAppearance {
  const themes = Object.values(designSystem?.themes ?? {});
  const light =
    themes.find((theme) => normalizeThemeName(theme.name) === "light") ?? themes[0];
  const dark =
    themes.find((theme) => normalizeThemeName(theme.name) === "dark") ?? light ?? themes[0];
  const fallbackId =
    designSystem?.activeThemeId ?? light?.id ?? dark?.id ?? "theme.scadatomic.light";

  return {
    themeMode: "fixed",
    defaultThemeId: fallbackId,
    ...(light ? { systemLightThemeId: light.id } : {}),
    ...(dark ? { systemDarkThemeId: dark.id } : {}),
  };
}

export function ensureProjectAppearance(
  appearance: ProjectAppearance | undefined,
  designSystem: DesignSystem | undefined
): ProjectAppearance {
  const fallback = createDefaultProjectAppearance(designSystem);
  if (!appearance) return fallback;

  const themes = designSystem?.themes ?? {};
  const validDefault = themes[appearance.defaultThemeId]
    ? appearance.defaultThemeId
    : fallback.defaultThemeId;
  const validLight =
    appearance.systemLightThemeId && themes[appearance.systemLightThemeId]
      ? appearance.systemLightThemeId
      : fallback.systemLightThemeId;
  const validDark =
    appearance.systemDarkThemeId && themes[appearance.systemDarkThemeId]
      ? appearance.systemDarkThemeId
      : fallback.systemDarkThemeId;

  return {
    themeMode: isThemeRuntimeMode(appearance.themeMode)
      ? appearance.themeMode
      : fallback.themeMode,
    defaultThemeId: validDefault,
    ...(validLight ? { systemLightThemeId: validLight } : {}),
    ...(validDark ? { systemDarkThemeId: validDark } : {}),
  };
}

export function isProjectAppearance(
  value: unknown,
  designSystem?: DesignSystem
): value is ProjectAppearance {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const candidate = value as Record<string, unknown>;
  if (!isThemeRuntimeMode(candidate.themeMode)) return false;
  if (typeof candidate.defaultThemeId !== "string" || !candidate.defaultThemeId) return false;
  if (
    candidate.systemLightThemeId !== undefined &&
    typeof candidate.systemLightThemeId !== "string"
  ) {
    return false;
  }
  if (
    candidate.systemDarkThemeId !== undefined &&
    typeof candidate.systemDarkThemeId !== "string"
  ) {
    return false;
  }

  if (designSystem?.themes) {
    if (!designSystem.themes[candidate.defaultThemeId]) return false;
    if (
      typeof candidate.systemLightThemeId === "string" &&
      !designSystem.themes[candidate.systemLightThemeId]
    ) {
      return false;
    }
    if (
      typeof candidate.systemDarkThemeId === "string" &&
      !designSystem.themes[candidate.systemDarkThemeId]
    ) {
      return false;
    }
  }

  return true;
}

export function isThemeRuntimeMode(value: unknown): value is ThemeRuntimeMode {
  return value === "fixed" || value === "system" || value === "runtime";
}

export function resolveConfiguredThemeId({
  appearance,
  designSystem,
  runtimeThemeId,
  systemColorScheme = "light",
}: {
  appearance: ProjectAppearance | undefined;
  designSystem: DesignSystem | undefined;
  runtimeThemeId?: string | undefined;
  systemColorScheme?: SystemColorScheme | undefined;
}): DesignThemeId | undefined {
  const settings = ensureProjectAppearance(appearance, designSystem);
  const themes = designSystem?.themes ?? {};

  if (settings.themeMode === "system") {
    const preferred =
      systemColorScheme === "dark"
        ? settings.systemDarkThemeId
        : settings.systemLightThemeId;
    if (preferred && themes[preferred]) return preferred;
  }

  if (
    settings.themeMode === "runtime" &&
    runtimeThemeId &&
    themes[runtimeThemeId]
  ) {
    return runtimeThemeId;
  }

  if (themes[settings.defaultThemeId]) return settings.defaultThemeId;
  if (designSystem?.activeThemeId && themes[designSystem.activeThemeId]) {
    return designSystem.activeThemeId;
  }
  return Object.keys(themes)[0];
}

/** Accepts stable ids and human names such as "dark" or "Operator Night". */
export function resolveThemeSelection(
  designSystem: DesignSystem | undefined,
  requested: string
): DesignThemeId | undefined {
  const normalized = normalizeThemeName(requested);
  if (!normalized) return undefined;
  const themes = designSystem?.themes ?? {};
  if (themes[requested]) return requested;
  return Object.values(themes).find(
    (theme) => normalizeThemeName(theme.name) === normalized
  )?.id;
}

export function getThemeDisplayName(
  designSystem: DesignSystem | undefined,
  themeId: string | undefined
): string | undefined {
  if (!themeId) return undefined;
  return designSystem?.themes?.[themeId]?.name;
}

function normalizeThemeName(value: string) {
  return value.trim().toLocaleLowerCase().replace(/[\s_-]+/g, " ");
}
