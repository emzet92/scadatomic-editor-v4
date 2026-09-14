import { publishBindingTrace } from "../debug/binding-trace";
import type { RuntimePropertyBinding } from "../model/property-binding";
import { toReactiveKey, type ReactiveRef } from "../model/reactive-ref";
import { evaluateBindingExpression } from "./binding-evaluator";
import { DependencyRegistry } from "./dependency-registry";
import type { ReactiveStore } from "./reactive-store";

export type BindingTargetRuntime = {
  apply(binding: RuntimePropertyBinding, value: unknown): void;
  clear(binding: RuntimePropertyBinding): void;
  validate?(binding: RuntimePropertyBinding, value: unknown): void;
};

export class BindingRuntime {
  private readonly store: ReactiveStore;
  private readonly target: BindingTargetRuntime;
  private readonly dependencies = new DependencyRegistry();
  private readonly lastValues = new Map<string, unknown>();
  private readonly unsubscribe: () => void;

  constructor(store: ReactiveStore, target: BindingTargetRuntime) {
    this.store = store;
    this.target = target;
    this.unsubscribe = store.subscribeAll((change) => {
      const affected = this.dependencies.listAffected(toReactiveKey(change.ref));
      for (const binding of affected) this.evaluate(binding.id);
    });
  }

  register(binding: RuntimePropertyBinding) {
    this.dependencies.register(binding);
    if (binding.enabled !== false) this.evaluate(binding.id);
  }

  unregister(bindingId: string) {
    const binding = this.dependencies.get(bindingId);
    if (binding) this.target.clear(binding);
    this.dependencies.unregister(bindingId);
    this.lastValues.delete(bindingId);
  }

  evaluate(bindingId: string) {
    const binding = this.dependencies.get(bindingId);
    if (!binding || binding.enabled === false) return;

    try {
      const value = evaluateBindingExpression(
        binding.expression,
        (ref: ReactiveRef) => this.store.read(ref)
      );
      this.target.validate?.(binding, value);
      if (this.lastValues.has(binding.id) && Object.is(this.lastValues.get(binding.id), value)) {
        return;
      }
      this.lastValues.set(binding.id, value);
      this.target.apply(binding, value);
      publishBindingTrace({
        bindingId: binding.id,
        target: binding.target,
        status: "success",
        value,
        timestamp: Date.now(),
      });
    } catch (error) {
      this.lastValues.delete(binding.id);
      this.target.clear(binding);
      publishBindingTrace({
        bindingId: binding.id,
        target: binding.target,
        status: "error",
        message: error instanceof Error ? error.message : String(error),
        timestamp: Date.now(),
      });
      console.warn(`[reactivity] Binding ${binding.id} failed`, error);
    }
  }

  evaluateAll() {
    for (const binding of this.dependencies.list()) {
      if (binding.enabled !== false) this.evaluate(binding.id);
    }
  }

  dispose() {
    this.unsubscribe();
    for (const binding of this.dependencies.list()) this.target.clear(binding);
    this.dependencies.clear();
    this.lastValues.clear();
  }
}
