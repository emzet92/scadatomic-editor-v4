import type { TagDriverContext, TagDriverFactory } from "./TagDriver";

export class TagDriverRegistry {
  private readonly factories = new Map<string, TagDriverFactory>();

  register(factory: TagDriverFactory) {
    if (this.factories.has(factory.kind)) {
      throw new Error(`Tag driver already registered: ${factory.kind}`);
    }
    this.factories.set(factory.kind, factory);
    return this;
  }

  get(kind: string) {
    return this.factories.get(kind);
  }

  create(kind: string, context: TagDriverContext) {
    const factory = this.factories.get(kind);
    if (!factory) throw new Error(`Unknown tag driver: ${kind}`);
    return factory.create(context);
  }

  list() {
    return [...this.factories.values()];
  }
}
