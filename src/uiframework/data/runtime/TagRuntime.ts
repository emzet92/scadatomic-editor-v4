import type { TagWriteSource } from "../tags/TagEvents";
import type { TagStore } from "../tags/TagStore";

export type TagRuntimeWriteResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Write boundary used by TagRuntime. The production/local host implementation
 * is DriverRuntime. Browser runtime clients can supply a remote write router
 * that forwards the request to the authoritative driver host.
 */
export interface TagWriteRouter {
  writePath(
    path: string,
    value: unknown,
    requestedBy: TagWriteSource
  ): TagRuntimeWriteResult;
}

/**
 * Application-facing tag API. Reads always come from a local process-image
 * cache. Writes never mutate that cache directly: they are routed to the
 * current source owner (local DriverRuntime or a remote authoritative host),
 * and only driver readback updates TagStore.
 */
export class TagRuntime {
  readonly store: TagStore;
  private readonly writer: TagWriteRouter;

  constructor(store: TagStore, writer: TagWriteRouter) {
    this.store = store;
    this.writer = writer;
  }

  get(path: string) {
    return this.store.get(path);
  }

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
}
