import type { Intent } from "../model/intent";

const MISSING = Symbol("missing-shadow-value");

/**
 * Per-handler transaction buffer. Side effects are collected here and are not
 * committed until the handler source has completed successfully.
 */
export class IntentCollector {
  private intents: Intent[] = [];
  private readonly shadowValues = new Map<string, unknown>();

  push(intent: Intent): void {
    this.intents.push(intent);
  }

  getIntents(): readonly Intent[] {
    return this.intents;
  }

  takeIntents(): Intent[] {
    const result = this.intents;
    this.intents = [];
    return result;
  }

  discard(): void {
    this.intents = [];
    this.shadowValues.clear();
  }

  setShadow(key: string, value: unknown): void {
    this.shadowValues.set(key, value);
  }

  deleteShadow(key: string): void {
    this.shadowValues.delete(key);
  }

  clearShadow(prefix?: string): void {
    if (!prefix) {
      this.shadowValues.clear();
      return;
    }
    for (const key of this.shadowValues.keys()) {
      if (key.startsWith(prefix)) this.shadowValues.delete(key);
    }
  }

  readShadow<T>(key: string, fallback: () => T): T {
    const value = this.shadowValues.has(key)
      ? this.shadowValues.get(key)
      : MISSING;
    return value === MISSING ? fallback() : (value as T);
  }
}

export const shadowKey = {
  tag(path: string) {
    return `tag:${path}`;
  },
  componentProperty(componentId: string, property: string) {
    return `component:${componentId}:prop:${property}`;
  },
  componentVariant(componentId: string) {
    return `component:${componentId}:variant`;
  },
  state(projectId: string, key: string) {
    return `state:${projectId}:${key}`;
  },
};
