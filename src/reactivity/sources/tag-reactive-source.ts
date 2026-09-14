import type { TagWriteSource } from "../../uiframework/data/tags/TagEvents";
import {
  findTagFieldRefByPath,
  resolveTagFieldRef,
  type TagFieldRef,
} from "../../uiframework/data/tags/TagFieldRef";
import type { TagStore } from "../../uiframework/data/tags/TagStore";
import type { TagReactiveRef } from "../model/reactive-ref";
import type { ReactiveStore, ReactiveSourceAdapter } from "../runtime/reactive-store";

export class TagReactiveSource implements ReactiveSourceAdapter<TagReactiveRef> {
  readonly kind = "tag" as const;
  private readonly tagStore: TagStore;

  constructor(tagStore: TagStore) {
    this.tagStore = tagStore;
  }

  read(ref: TagReactiveRef): unknown {
    const resolved = resolveTagFieldRef(this.tagStore.snapshot(), ref.ref);
    if (!resolved) {
      throw new Error(`Reactive tag source is missing: ${ref.path ?? ref.ref.tagId}.`);
    }
    return this.tagStore.get(resolved.path);
  }

  describe(ref: TagReactiveRef) {
    return resolveTagFieldRef(this.tagStore.snapshot(), ref.ref)?.path ?? ref.path ?? ref.ref.tagId;
  }

  resolvePath(path: string): TagReactiveRef | undefined {
    const resolved = findTagFieldRefByPath(this.tagStore.snapshot(), path);
    return resolved
      ? { kind: "tag", ref: resolved.ref, path: resolved.path }
      : undefined;
  }

  resolveRef(ref: TagFieldRef): TagReactiveRef | undefined {
    const resolved = resolveTagFieldRef(this.tagStore.snapshot(), ref);
    return resolved
      ? { kind: "tag", ref: resolved.ref, path: resolved.path }
      : undefined;
  }

  connect(store: ReactiveStore) {
    const unregisterSource = store.registerSource(this);
    const unsubscribe = this.tagStore.subscribe("*", (event) => {
      const ref = this.resolvePath(event.path);
      if (!ref) return;
      store.publish({
        ref,
        previousValue: event.oldValue,
        value: event.newValue,
        timestamp: Date.now(),
        ...(event.source ? { source: toReactiveSource(event.source) } : {}),
      });
    });

    return () => {
      unsubscribe();
      unregisterSource();
    };
  }
}

function toReactiveSource(source: TagWriteSource) {
  return source.id ? { kind: source.kind, id: source.id } : { kind: source.kind };
}
