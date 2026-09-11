import type { TagWriteSource } from "../tags/TagEvents";
import { findTagFieldRefByPath, resolveTagFieldRef, type TagFieldRef } from "../tags/TagFieldRef";
import type { ProjectData } from "../tags/TagDefinition";
import type { TagStore } from "../tags/TagStore";
import { TypeRegistry } from "../types/TypeRegistry";
import type { TagDriver, TagDriverWriteResult } from "./TagDriver";
import type { TagDriverRegistry } from "./DriverRegistry";
import { getTagSourceMapping } from "./TagSourceMapping";

export type DriverRuntimeContext = {
  tagStore: TagStore;
  getProjectData(): ProjectData;
};

/**
 * Runtime I/O router. Application writes terminate here, are routed through the
 * owning source driver, and only driver readback is allowed to mutate TagStore.
 */
export class DriverRuntime {
  private readonly registry: TagDriverRegistry;
  private readonly context: DriverRuntimeContext;
  private readonly instances = new Map<string, TagDriver>();

  constructor(registry: TagDriverRegistry, context: DriverRuntimeContext) {
    this.registry = registry;
    this.context = context;
  }

  writePath(
    path: string,
    value: unknown,
    requestedBy: TagWriteSource
  ): TagDriverWriteResult {
    const resolved = findTagFieldRefByPath(this.context.getProjectData(), path);
    if (!resolved) return { ok: false, error: `Unknown tag path: ${path}` };
    return this.writeRef(resolved.ref, value, requestedBy);
  }

  writeRef(
    target: TagFieldRef,
    value: unknown,
    requestedBy: TagWriteSource
  ): TagDriverWriteResult {
    const data = this.context.getProjectData();
    const resolved = resolveTagFieldRef(data, target);
    if (!resolved) return { ok: false, error: "Unknown tag field." };
    if (!TypeRegistry.validate(resolved.type, value)) {
      return {
        ok: false,
        error: `Invalid ${TypeRegistry.getDisplayName(resolved.type)} value for ${resolved.path}.`,
      };
    }

    const mapping = getTagSourceMapping(data, target);
    const driver = this.getOrCreate(mapping.driver);
    if (!driver) return { ok: false, error: `Unknown tag driver: ${mapping.driver}` };

    return driver.write({
      target,
      path: resolved.path,
      type: resolved.type,
      value,
      requestedBy,
    });
  }

  configure() {
    for (const driver of this.instances.values()) driver.configure?.();
  }

  start(kind: string) {
    const driver = this.getOrCreate(kind);
    if (!driver) throw new Error(`Unknown tag driver: ${kind}`);
    driver.configure?.();
    driver.start();
    return driver;
  }

  stop(kind: string) {
    this.instances.get(kind)?.stop();
  }

  get(kind: string) {
    return this.instances.get(kind);
  }

  isRunning(kind: string) {
    return this.instances.get(kind)?.isRunning() ?? false;
  }

  dispose() {
    for (const driver of this.instances.values()) driver.dispose();
    this.instances.clear();
  }

  private getOrCreate(kind: string) {
    const existing = this.instances.get(kind);
    if (existing) return existing;
    const factory = this.registry.get(kind);
    if (!factory) return undefined;
    const driver = factory.create({
      tagStore: this.context.tagStore,
      getProjectData: this.context.getProjectData,
      publish: (path, value, options) =>
        this.context.tagStore.set(path, value, options),
    });
    this.instances.set(kind, driver);
    return driver;
  }
}
