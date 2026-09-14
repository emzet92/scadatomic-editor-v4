/**
 * Compatibility import path.
 *
 * The implementation now lives in the reactive runtime. Keep this module until
 * callers have migrated; no tag state or write logic is implemented here.
 */
export {
  ReactiveTagRuntime as TagRuntime,
  type TagRuntimeWriteResult,
  type TagWriteRouter,
} from "../../../reactivity/sources/reactive-tag-runtime";
