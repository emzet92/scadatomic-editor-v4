import {
  createColorTokenRef,
  createSemanticColorTokenRef,
  type ColorToken,
  type DesignSystem,
  type DesignTheme,
  type SemanticColorToken,
} from "./colors";
import { createTypographyTokenRef, type TypographyToken } from "./typography";
import { createSpacingTokenRef, type SpacingToken } from "./spacing";
import { createRadiusTokenRef, type RadiusToken } from "./radius";
import { createShadowTokenRef, type ShadowToken } from "./shadows";
import { createBorderTokenRef, type BorderToken } from "./borders";

/** Stable ids make built-in defaults safe to reference from component defaults. */
export const DEFAULT_DESIGN_TOKEN_IDS = {
  themes: {
    light: "theme.scadatomic.light",
    dark: "theme.scadatomic.dark",
  },
  colors: {
    neutral0: "color.neutral.0",
    neutral50: "color.neutral.50",
    neutral100: "color.neutral.100",
    neutral200: "color.neutral.200",
    neutral300: "color.neutral.300",
    neutral400: "color.neutral.400",
    neutral500: "color.neutral.500",
    neutral600: "color.neutral.600",
    neutral700: "color.neutral.700",
    neutral800: "color.neutral.800",
    neutral900: "color.neutral.900",
    neutral950: "color.neutral.950",
    brand400: "color.brand.400",
    brand500: "color.brand.500",
    brand600: "color.brand.600",
    brand700: "color.brand.700",
    green500: "color.green.500",
    green600: "color.green.600",
    amber500: "color.amber.500",
    amber600: "color.amber.600",
    red500: "color.red.500",
    red600: "color.red.600",
  },
  semanticColors: {
    surfaceDefault: "semantic.color.surface.default",
    surfaceRaised: "semantic.color.surface.raised",
    surfaceMuted: "semantic.color.surface.muted",
    textPrimary: "semantic.color.text.primary",
    textSecondary: "semantic.color.text.secondary",
    textOnAction: "semantic.color.text.on-action",
    actionPrimary: "semantic.color.action.primary",
    actionPrimaryHover: "semantic.color.action.primary-hover",
    borderSubtle: "semantic.color.border.subtle",
    borderDefault: "semantic.color.border.default",
    borderStrong: "semantic.color.border.strong",
    borderFocus: "semantic.color.border.focus",
    statusSuccess: "semantic.color.status.success",
    statusWarning: "semantic.color.status.warning",
    statusDanger: "semantic.color.status.danger",
  },
  typography: {
    displayLarge: "typography.display.large",
    headingLarge: "typography.heading.large",
    headingMedium: "typography.heading.medium",
    bodyLarge: "typography.body.large",
    bodyMedium: "typography.body.medium",
    labelMedium: "typography.label.medium",
    captionSmall: "typography.caption.small",
  },
  spacing: {
    none: "spacing.none",
    xxs: "spacing.2xs",
    xs: "spacing.xs",
    sm: "spacing.sm",
    md: "spacing.md",
    lg: "spacing.lg",
    xl: "spacing.xl",
    xxl: "spacing.2xl",
  },
  radius: {
    none: "radius.none",
    xs: "radius.xs",
    sm: "radius.sm",
    md: "radius.md",
    lg: "radius.lg",
    xl: "radius.xl",
    xxl: "radius.2xl",
    pill: "radius.pill",
  },
  shadows: {
    none: "shadow.elevation.none",
    one: "shadow.elevation.1",
    two: "shadow.elevation.2",
    three: "shadow.elevation.3",
    four: "shadow.elevation.4",
  },
  borders: {
    none: "border.stroke.none",
    subtle: "border.stroke.subtle",
    default: "border.stroke.default",
    strong: "border.stroke.strong",
    focus: "border.stroke.focus",
    dashed: "border.stroke.dashed",
  },
} as const;

const FONT_FAMILY = "Inter, ui-sans-serif, system-ui, sans-serif";

export function ensureDefaultDesignSystem(current: DesignSystem | undefined): DesignSystem {
  if (!current) return createDefaultDesignSystem();
  if (current.preset === "scadatomic-default") return current;

  const defaults = createDefaultDesignSystem();
  return {
    ...defaults,
    ...current,
    preset: "scadatomic-default",
    colors: { ...defaults.colors, ...current.colors },
    semanticColors: { ...defaults.semanticColors, ...(current.semanticColors ?? {}) },
    themes: { ...defaults.themes, ...(current.themes ?? {}) },
    typography: { ...defaults.typography, ...(current.typography ?? {}) },
    spacing: { ...defaults.spacing, ...(current.spacing ?? {}) },
    radius: { ...defaults.radius, ...(current.radius ?? {}) },
    shadows: { ...defaults.shadows, ...(current.shadows ?? {}) },
    borders: { ...defaults.borders, ...(current.borders ?? {}) },
    activeThemeId:
      current.activeThemeId && (current.themes?.[current.activeThemeId] || defaults.themes?.[current.activeThemeId])
        ? current.activeThemeId
        : defaults.activeThemeId,
  };
}

export function createDefaultDesignSystem(): DesignSystem {
  const themes = mapById<DesignTheme>([
    { id: DEFAULT_DESIGN_TOKEN_IDS.themes.light, name: "Light" },
    { id: DEFAULT_DESIGN_TOKEN_IDS.themes.dark, name: "Dark" },
  ]);

  const colors = mapById<ColorToken>([
    color(DEFAULT_DESIGN_TOKEN_IDS.colors.neutral0, "Neutral/0", "#ffffff"),
    color(DEFAULT_DESIGN_TOKEN_IDS.colors.neutral50, "Neutral/50", "#fafafa"),
    color(DEFAULT_DESIGN_TOKEN_IDS.colors.neutral100, "Neutral/100", "#f4f4f5"),
    color(DEFAULT_DESIGN_TOKEN_IDS.colors.neutral200, "Neutral/200", "#e4e4e7"),
    color(DEFAULT_DESIGN_TOKEN_IDS.colors.neutral300, "Neutral/300", "#d4d4d8"),
    color(DEFAULT_DESIGN_TOKEN_IDS.colors.neutral400, "Neutral/400", "#a1a1aa"),
    color(DEFAULT_DESIGN_TOKEN_IDS.colors.neutral500, "Neutral/500", "#71717a"),
    color(DEFAULT_DESIGN_TOKEN_IDS.colors.neutral600, "Neutral/600", "#52525b"),
    color(DEFAULT_DESIGN_TOKEN_IDS.colors.neutral700, "Neutral/700", "#3f3f46"),
    color(DEFAULT_DESIGN_TOKEN_IDS.colors.neutral800, "Neutral/800", "#27272a"),
    color(DEFAULT_DESIGN_TOKEN_IDS.colors.neutral900, "Neutral/900", "#18181b"),
    color(DEFAULT_DESIGN_TOKEN_IDS.colors.neutral950, "Neutral/950", "#09090b"),
    color(DEFAULT_DESIGN_TOKEN_IDS.colors.brand400, "Brand/400", "#a78bfa"),
    color(DEFAULT_DESIGN_TOKEN_IDS.colors.brand500, "Brand/500", "#8b5cf6"),
    color(DEFAULT_DESIGN_TOKEN_IDS.colors.brand600, "Brand/600", "#7c3aed"),
    color(DEFAULT_DESIGN_TOKEN_IDS.colors.brand700, "Brand/700", "#6d28d9"),
    color(DEFAULT_DESIGN_TOKEN_IDS.colors.green500, "Green/500", "#22c55e"),
    color(DEFAULT_DESIGN_TOKEN_IDS.colors.green600, "Green/600", "#16a34a"),
    color(DEFAULT_DESIGN_TOKEN_IDS.colors.amber500, "Amber/500", "#f59e0b"),
    color(DEFAULT_DESIGN_TOKEN_IDS.colors.amber600, "Amber/600", "#d97706"),
    color(DEFAULT_DESIGN_TOKEN_IDS.colors.red500, "Red/500", "#ef4444"),
    color(DEFAULT_DESIGN_TOKEN_IDS.colors.red600, "Red/600", "#dc2626"),
  ]);

  const semanticColors = mapById<SemanticColorToken>([
    semantic("surfaceDefault", "Surface/Default", "neutral0", "neutral950"),
    semantic("surfaceRaised", "Surface/Raised", "neutral0", "neutral900"),
    semantic("surfaceMuted", "Surface/Muted", "neutral100", "neutral800"),
    semantic("textPrimary", "Text/Primary", "neutral900", "neutral50"),
    semantic("textSecondary", "Text/Secondary", "neutral600", "neutral400"),
    semantic("textOnAction", "Text/On Action", "neutral0", "neutral0"),
    semantic("actionPrimary", "Action/Primary", "brand600", "brand400"),
    semantic("actionPrimaryHover", "Action/Primary Hover", "brand700", "brand500"),
    semantic("borderSubtle", "Border/Subtle", "neutral200", "neutral800"),
    semantic("borderDefault", "Border/Default", "neutral300", "neutral700"),
    semantic("borderStrong", "Border/Strong", "neutral400", "neutral600"),
    semantic("borderFocus", "Border/Focus", "brand600", "brand400"),
    semantic("statusSuccess", "Status/Success", "green600", "green500"),
    semantic("statusWarning", "Status/Warning", "amber600", "amber500"),
    semantic("statusDanger", "Status/Danger", "red600", "red500"),
  ]);

  const typography = mapById<TypographyToken>([
    typeToken("displayLarge", "Display/Large", 40, "bold", "48px", -0.6),
    typeToken("headingLarge", "Heading/Large", 28, "semibold", "36px", -0.3),
    typeToken("headingMedium", "Heading/Medium", 22, "semibold", "30px", -0.2),
    typeToken("bodyLarge", "Body/Large", 16, "normal", "24px", 0),
    typeToken("bodyMedium", "Body/Medium", 14, "normal", "20px", 0),
    typeToken("labelMedium", "Label/Medium", 12, "medium", "16px", 0.1),
    typeToken("captionSmall", "Caption/Small", 11, "normal", "16px", 0.1),
  ]);

  const spacing = mapById<SpacingToken>([
    spacingToken("none", "Spacing/None", 0),
    spacingToken("xxs", "Spacing/2XS", 2),
    spacingToken("xs", "Spacing/XS", 4),
    spacingToken("sm", "Spacing/SM", 8),
    spacingToken("md", "Spacing/MD", 16),
    spacingToken("lg", "Spacing/LG", 24),
    spacingToken("xl", "Spacing/XL", 32),
    spacingToken("xxl", "Spacing/2XL", 48),
  ]);

  const radius = mapById<RadiusToken>([
    radiusToken("none", "Radius/None", 0),
    radiusToken("xs", "Radius/XS", 2),
    radiusToken("sm", "Radius/SM", 4),
    radiusToken("md", "Radius/MD", 8),
    radiusToken("lg", "Radius/LG", 12),
    radiusToken("xl", "Radius/XL", 16),
    radiusToken("xxl", "Radius/2XL", 24),
    radiusToken("pill", "Radius/Pill", 999),
  ]);

  const shadows = mapById<ShadowToken>([
    shadowToken("none", "Elevation/None", 0, 0, 0, 0, "rgba(15, 23, 42, 0)"),
    shadowToken("one", "Elevation/1", 0, 1, 2, 0, "rgba(15, 23, 42, 0.08)"),
    shadowToken("two", "Elevation/2", 0, 4, 10, -2, "rgba(15, 23, 42, 0.12)"),
    shadowToken("three", "Elevation/3", 0, 10, 24, -6, "rgba(15, 23, 42, 0.16)"),
    shadowToken("four", "Elevation/4", 0, 18, 40, -8, "rgba(15, 23, 42, 0.20)"),
  ]);

  const borders = mapById<BorderToken>([
    borderToken("none", "Stroke/None", 0, "solid", "transparent"),
    borderToken("subtle", "Stroke/Subtle", 1, "solid", "#e4e4e7"),
    borderToken("default", "Stroke/Default", 1, "solid", "#d4d4d8"),
    borderToken("strong", "Stroke/Strong", 1, "solid", "#a1a1aa"),
    borderToken("focus", "Stroke/Focus", 2, "solid", "#7c3aed"),
    borderToken("dashed", "Stroke/Dashed", 1, "dashed", "#a1a1aa"),
  ]);

  return {
    preset: "scadatomic-default",
    colors,
    semanticColors,
    themes,
    activeThemeId: DEFAULT_DESIGN_TOKEN_IDS.themes.light,
    typography,
    spacing,
    radius,
    shadows,
    borders,
  };
}

/**
 * Document defaults intentionally contain token references. Renderer defaults
 * remain literal fallbacks, so standalone components still work outside a project.
 */
export function getDefaultDesignSystemPropsForType(type: string): Record<string, unknown> {
  const ids = DEFAULT_DESIGN_TOKEN_IDS;
  switch (type) {
    case "Page":
      return {
        backgroundColor: createSemanticColorTokenRef(ids.semanticColors.surfaceDefault),
        padding: createSpacingTokenRef(ids.spacing.lg),
        gap: createSpacingTokenRef(ids.spacing.md),
      };
    case "Modal":
      return {
        backgroundColor: createSemanticColorTokenRef(ids.semanticColors.surfaceRaised),
        padding: createSpacingTokenRef(ids.spacing.lg),
        gap: createSpacingTokenRef(ids.spacing.md),
        border: createBorderTokenRef(ids.borders.default),
        borderRadius: createRadiusTokenRef(ids.radius.xl),
        shadow: createShadowTokenRef(ids.shadows.four),
      };
    case "Container":
      return {
        padding: createSpacingTokenRef(ids.spacing.md),
        gap: createSpacingTokenRef(ids.spacing.sm),
        border: createBorderTokenRef(ids.borders.subtle),
        borderRadius: createRadiusTokenRef(ids.radius.md),
        shadow: createShadowTokenRef(ids.shadows.none),
      };
    case "Text":
      return {
        color: createSemanticColorTokenRef(ids.semanticColors.textPrimary),
        textStyle: createTypographyTokenRef(ids.typography.bodyMedium),
        border: createBorderTokenRef(ids.borders.none),
        borderRadius: createRadiusTokenRef(ids.radius.none),
        shadow: createShadowTokenRef(ids.shadows.none),
      };
    case "Button":
      return {
        backgroundColor: createSemanticColorTokenRef(ids.semanticColors.actionPrimary),
        paddingX: createSpacingTokenRef(ids.spacing.md),
        paddingY: createSpacingTokenRef(ids.spacing.sm),
        marginX: createSpacingTokenRef(ids.spacing.none),
        marginY: createSpacingTokenRef(ids.spacing.none),
        border: createBorderTokenRef(ids.borders.none),
        borderRadius: createRadiusTokenRef(ids.radius.md),
        shadow: createShadowTokenRef(ids.shadows.one),
      };
    case "Image":
      return {
        backgroundColor: createSemanticColorTokenRef(ids.semanticColors.surfaceMuted),
        border: createBorderTokenRef(ids.borders.subtle),
        borderRadius: createRadiusTokenRef(ids.radius.md),
        shadow: createShadowTokenRef(ids.shadows.none),
      };
    case "Navigation":
      return {
        backgroundColor: createSemanticColorTokenRef(ids.semanticColors.surfaceRaised),
        color: createSemanticColorTokenRef(ids.semanticColors.textSecondary),
        activeColor: createSemanticColorTokenRef(ids.semanticColors.actionPrimary),
        gap: createSpacingTokenRef(ids.spacing.xs),
        padding: createSpacingTokenRef(ids.spacing.xs),
        border: createBorderTokenRef(ids.borders.subtle),
        borderRadius: createRadiusTokenRef(ids.radius.md),
        shadow: createShadowTokenRef(ids.shadows.one),
      };
    case "Chart":
      return {
        color: createSemanticColorTokenRef(ids.semanticColors.actionPrimary),
      };
    default:
      return {};
  }
}

function semantic(
  key: keyof typeof DEFAULT_DESIGN_TOKEN_IDS.semanticColors,
  name: string,
  lightColorKey: keyof typeof DEFAULT_DESIGN_TOKEN_IDS.colors,
  darkColorKey: keyof typeof DEFAULT_DESIGN_TOKEN_IDS.colors
): SemanticColorToken {
  return {
    id: DEFAULT_DESIGN_TOKEN_IDS.semanticColors[key],
    name,
    values: {
      [DEFAULT_DESIGN_TOKEN_IDS.themes.light]: createColorTokenRef(DEFAULT_DESIGN_TOKEN_IDS.colors[lightColorKey]),
      [DEFAULT_DESIGN_TOKEN_IDS.themes.dark]: createColorTokenRef(DEFAULT_DESIGN_TOKEN_IDS.colors[darkColorKey]),
    },
  };
}

function color(id: string, name: string, value: string): ColorToken {
  return { id, name, value };
}

function typeToken(
  key: keyof typeof DEFAULT_DESIGN_TOKEN_IDS.typography,
  name: string,
  fontSize: number,
  fontWeight: TypographyToken["fontWeight"],
  lineHeight: string,
  letterSpacing: number
): TypographyToken {
  return {
    id: DEFAULT_DESIGN_TOKEN_IDS.typography[key],
    name,
    fontFamily: FONT_FAMILY,
    fontSize,
    fontWeight,
    lineHeight,
    letterSpacing,
  };
}

function spacingToken(
  key: keyof typeof DEFAULT_DESIGN_TOKEN_IDS.spacing,
  name: string,
  value: number
): SpacingToken {
  return { id: DEFAULT_DESIGN_TOKEN_IDS.spacing[key], name, value };
}

function radiusToken(
  key: keyof typeof DEFAULT_DESIGN_TOKEN_IDS.radius,
  name: string,
  value: number
): RadiusToken {
  return { id: DEFAULT_DESIGN_TOKEN_IDS.radius[key], name, value };
}

function shadowToken(
  key: keyof typeof DEFAULT_DESIGN_TOKEN_IDS.shadows,
  name: string,
  x: number,
  y: number,
  blur: number,
  spread: number,
  colorValue: string
): ShadowToken {
  return {
    id: DEFAULT_DESIGN_TOKEN_IDS.shadows[key],
    name,
    x,
    y,
    blur,
    spread,
    color: colorValue,
  };
}

function borderToken(
  key: keyof typeof DEFAULT_DESIGN_TOKEN_IDS.borders,
  name: string,
  width: number,
  style: BorderToken["style"],
  colorValue: string
): BorderToken {
  return {
    id: DEFAULT_DESIGN_TOKEN_IDS.borders[key],
    name,
    width,
    style,
    color: colorValue,
  };
}

function mapById<T extends { id: string }>(items: T[]): Record<string, T> {
  return Object.fromEntries(items.map((item) => [item.id, item]));
}
