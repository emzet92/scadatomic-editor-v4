export type ClassValue = string | false | null | undefined;

/**
 * Tiny class-name combiner kept local to the editor UI so the design system
 * does not need an extra runtime dependency such as clsx.
 */
export function cx(...values: ClassValue[]): string {
  return values.filter(Boolean).join(" ");
}
