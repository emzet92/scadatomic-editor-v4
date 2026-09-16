export const editorColorTokens = {
  appBackground: "--editor-app-bg",
  surface: "--editor-surface",
  surfaceMuted: "--editor-surface-muted",
  border: "--editor-border",
  borderStrong: "--editor-border-strong",
  text: "--editor-text",
  textMuted: "--editor-text-muted",
  textSoft: "--editor-text-soft",
  accent: "--editor-accent",
  accentHover: "--editor-accent-hover",
  accentSoft: "--editor-accent-soft",
  accentBorder: "--editor-accent-border",
  selected: "--editor-selected",
  selectedSoft: "--editor-selected-soft",
  success: "--editor-success",
  danger: "--editor-danger",
  canvasBackground: "--editor-canvas-bg",
  gridDot: "--editor-grid-dot",
} as const;

export type EditorColorToken = keyof typeof editorColorTokens;

export const editorColors = Object.fromEntries(
  Object.entries(editorColorTokens).map(([name, variable]) => [name, `var(${variable})`])
) as Record<EditorColorToken, string>;

export const editorSpacing = {
  0: "0px",
  0.5: "2px",
  1: "4px",
  1.5: "6px",
  2: "8px",
  2.5: "10px",
  3: "12px",
  4: "16px",
  5: "20px",
  6: "24px",
  8: "32px",
  10: "40px",
  12: "48px",
} as const;

export const editorRadii = {
  sm: "6px",
  md: "8px",
  lg: "12px",
  xl: "16px",
  "2xl": "20px",
  full: "9999px",
} as const;

export const editorBorders = {
  subtle: `1px solid var(${editorColorTokens.border})`,
  strong: `1px solid var(${editorColorTokens.borderStrong})`,
  accent: `1px solid var(${editorColorTokens.accentBorder})`,
  danger: "1px solid rgb(254 202 202)",
  warning: "1px solid rgb(253 230 138)",
} as const;

export const editorFontSizes = {
  metadata: "10px",
  caption: "11px",
  bodySmall: "12px",
  body: "14px",
  titleSmall: "16px",
  title: "20px",
  display: "24px",
} as const;

export const editorFontWeights = {
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
} as const;

export const editorLineHeights = {
  compact: 1.25,
  normal: 1.5,
  relaxed: 1.65,
} as const;

export const editorShadows = {
  xs: "0 1px 2px rgb(15 23 42 / 0.04)",
  sm: "0 1px 3px rgb(15 23 42 / 0.08)",
  md: "0 12px 32px rgb(15 23 42 / 0.14)",
} as const;

export const editorIconSizes = {
  xs: 11,
  sm: 13,
  md: 16,
  lg: 20,
  xl: 24,
} as const;

export type EditorIconSize = keyof typeof editorIconSizes;

export const editorIconStrokeWidths = {
  subtle: 1.5,
  regular: 2,
  strong: 2.25,
} as const;

export type EditorIconWeight = keyof typeof editorIconStrokeWidths;

export const editorIconTones = {
  default: `var(${editorColorTokens.text})`,
  muted: `var(${editorColorTokens.textMuted})`,
  soft: `var(${editorColorTokens.textSoft})`,
  accent: `var(${editorColorTokens.accent})`,
  success: `var(${editorColorTokens.success})`,
  danger: `var(${editorColorTokens.danger})`,
  inherit: "currentColor",
} as const;

export type EditorIconTone = keyof typeof editorIconTones;

export const editorIconTokens = {
  sizes: editorIconSizes,
  strokeWidths: editorIconStrokeWidths,
  tones: editorIconTones,
} as const;

export const editorZIndex = {
  base: 0,
  dropdown: 40,
  popover: 60,
  overlay: 90,
  dialog: 100,
  toast: 120,
} as const;
