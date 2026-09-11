import type { ProjectData } from "../tags/TagDefinition";
import type { TagStore } from "../tags/TagStore";

export type TagDriverContext = {
  tagStore: TagStore;
  getProjectData(): ProjectData;
};

export interface TagDriver {
  readonly kind: string;
  configure?(): void | Promise<void>;
  start(): void | Promise<void>;
  stop(): void | Promise<void>;
  dispose(): void | Promise<void>;
  isRunning(): boolean;
}

export type TagDriverFactory = {
  kind: string;
  displayName: string;
  description?: string | undefined;
  create(context: TagDriverContext): TagDriver;
};
