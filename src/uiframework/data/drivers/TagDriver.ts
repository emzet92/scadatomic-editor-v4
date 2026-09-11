import type { TagWriteOptions, TagWriteSource } from "../tags/TagEvents";
import type { ProjectData } from "../tags/TagDefinition";
import type { TagFieldRef } from "../tags/TagFieldRef";
import type { TagStore, TagStoreSetResult } from "../tags/TagStore";
import type { PrimitiveDataType } from "../types/DataType";

export type TagDriverWriteRequest = {
  target: TagFieldRef;
  path: string;
  type: PrimitiveDataType;
  value: unknown;
  /** Who requested the write on the application side. */
  requestedBy: TagWriteSource;
};

export type TagDriverWriteResult =
  | { ok: true }
  | { ok: false; error: string };

export type TagDriverContext = {
  /** Read-only process image / event source from the driver's perspective. */
  tagStore: TagStore;
  getProjectData(): ProjectData;
  /**
   * Publish a driver/device readback into the live process image.
   * Application code must never call this directly.
   */
  publish(path: string, value: unknown, options?: TagWriteOptions): TagStoreSetResult;
};

export interface TagDriver {
  readonly kind: string;
  configure?(): void | Promise<void>;
  start(): void | Promise<void>;
  stop(): void | Promise<void>;
  dispose(): void | Promise<void>;
  isRunning(): boolean;
  /** Application/device write routed to the owning driver. */
  write(request: TagDriverWriteRequest): TagDriverWriteResult;
}

export type TagDriverFactory = {
  kind: string;
  displayName: string;
  description?: string | undefined;
  create(context: TagDriverContext): TagDriver;
};
