import type { DriverRuntime } from "../drivers/DriverRuntime";
import type { TagWriteSource } from "../tags/TagEvents";
import type { TagStore } from "../tags/TagStore";

export type TagRuntimeWriteResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Application-facing tag API. Reads come from the live process image; writes
 * are routed to the source driver that owns the mapped tag field.
 */
export class TagRuntime {
  readonly store: TagStore;
  private readonly drivers: DriverRuntime;

  constructor(store: TagStore, drivers: DriverRuntime) {
    this.store = store;
    this.drivers = drivers;
  }

  get(path: string) {
    return this.store.get(path);
  }

  write(
    path: string,
    value: unknown,
    source: TagWriteSource = { kind: "script" }
  ): TagRuntimeWriteResult {
    return this.drivers.writePath(path, value, source);
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
