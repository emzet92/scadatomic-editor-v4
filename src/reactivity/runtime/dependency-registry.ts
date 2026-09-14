import type { RuntimePropertyBinding } from "../model/property-binding";
import type { ReactiveKey } from "../model/reactive-ref";
import { toReactiveKey } from "../model/reactive-ref";

export class DependencyRegistry {
  private readonly bindings = new Map<string, RuntimePropertyBinding>();
  private readonly byDependency = new Map<ReactiveKey, Set<string>>();

  register(binding: RuntimePropertyBinding) {
    this.unregister(binding.id);
    this.bindings.set(binding.id, binding);
    for (const dependency of binding.dependencies) {
      const key = toReactiveKey(dependency);
      const ids = this.byDependency.get(key) ?? new Set<string>();
      ids.add(binding.id);
      this.byDependency.set(key, ids);
    }
  }

  unregister(bindingId: string) {
    const previous = this.bindings.get(bindingId);
    if (!previous) return;
    this.bindings.delete(bindingId);
    for (const dependency of previous.dependencies) {
      const key = toReactiveKey(dependency);
      const ids = this.byDependency.get(key);
      if (!ids) continue;
      ids.delete(bindingId);
      if (ids.size === 0) this.byDependency.delete(key);
    }
  }

  get(bindingId: string) {
    return this.bindings.get(bindingId);
  }

  listAffected(key: ReactiveKey) {
    return [...(this.byDependency.get(key) ?? [])]
      .map((id) => this.bindings.get(id))
      .filter((binding): binding is RuntimePropertyBinding => Boolean(binding));
  }

  list() {
    return [...this.bindings.values()];
  }

  clear() {
    this.bindings.clear();
    this.byDependency.clear();
  }
}
