/**
 * Compatibility facade for the reusable-component domain.
 *
 * Keep feature code importing from this module while implementation details
 * live in focused modules under ./reusable-components. New domain modules may
 * import the focused files directly when that makes dependencies clearer.
 */
export * from "./reusable-components/index";
