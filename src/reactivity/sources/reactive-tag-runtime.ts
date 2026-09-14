import type { TagWriteSource } from "../../uiframework/data/tags/TagEvents";
import type { TagFieldRef } from "../../uiframework/data/tags/TagFieldRef";
import type { TagStore } from "../../uiframework/data/tags/TagStore";
import type { TagReactiveRef } from "../model/reactive-ref";
import { ReactiveStore } from "../runtime/reactive-store";
import { TagReactiveSource } from "./tag-reactive-source";

export type TagRuntimeWriteResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Write boundary for reactive tags. The local/edge implementation is
 * DriverRuntime; a browser client may provide a remote router that forwards to
 * the authoritative driver host.
 */
export interface TagWriteRouter {
  writePath(
    path: string,
    value: unknown,
    requestedBy: TagWriteSource
  ): TagRuntimeWriteResult;
}

/**
 * Canonical application-facing tag runtime.
 *
 * There is intentionally no second value cache here:
 * - TagStore is the live process image,
 * - DriverRuntime remains the only write/source-ownership boundary,
 * - ReactiveStore is only the dependency/change bus,
 * - TagReactiveSource adapts TagStore changes into stable ReactiveRefs.
 *
 * This class is the migration target for the old TagRuntime facade. Existing
 * imports keep working through data/runtime/TagRuntime.ts, which now only
 * re-exports this implementation.
 */
export class ReactiveTagRuntime {
  readonly store: TagStore;
  readonly reactive: ReactiveStore;
  readonly source: TagReactiveSource;

  private readonly writer: TagWriteRouter;
  private readonly disconnectReactiveSource: () => void;

  constructor(
    store: TagStore,
    writer: TagWriteRouter,
    reactive = new ReactiveStore()
  ) {
    this.store = store;
    this.writer = writer;
    this.reactive = reactive;
    this.source = new TagReactiveSource(store);
    this.disconnectReactiveSource = this.source.connect(reactive);
  }

  get(path: string) {
    return this.store.get(path);
  }

  toReactiveRef(path: string): TagReactiveRef | undefined {
    return this.source.resolvePath(path);
  }

  fromTagFieldRef(ref: TagFieldRef): TagReactiveRef | undefined {
    return this.source.resolveRef(ref);
  }

  readReactive(ref: TagReactiveRef) {
    return this.reactive.read(ref);
  }

  subscribeReactive(
    ref: TagReactiveRef,
    listener: Parameters<ReactiveStore["subscribe"]>[1]
  ) {
    return this.reactive.subscribe(ref, listener);
  }

  /**
   * A write is a command, not a reactive-state mutation. It always routes to
   * the owning driver; the source driver publishes readback into TagStore and
   * only that readback becomes a reactive change.
   */
  write(
    path: string,
    value: unknown,
    source: TagWriteSource = { kind: "script" }
  ): TagRuntimeWriteResult {
    return this.writer.writePath(path, value, source);
  }

  children(path: string) {
    return this.store.children(path);
  }

  getTagByName(name: string) {
    return this.store.getTagByName(name);
  }

  getUdtDefinitionById(udtId: string) {
    return this.store.getUdtDefinitionById(udtId);
  }

  listTags() {
    return this.store.listTags();
  }

  dispose() {
    this.disconnectReactiveSource();
  }
}
