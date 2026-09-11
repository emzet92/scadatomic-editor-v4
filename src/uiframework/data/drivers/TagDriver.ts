import type { ProjectData } from "../tags/TagDefinition";
import type { TagStore } from "../tags/TagStore";

export type TagDriverContext = {
  tagStore: TagStore;
  getProjectData(): ProjectData;
};

export interface TagDriver {
  readonly kind: string;
  start(): void | Promise<void>;
  stop(): void | Promise<void>;
  dispose(): void | Promise<void>;
  isRunning(): boolean;
}

export type TagDriverFactory = {
  kind: string;
  create(context: TagDriverContext): TagDriver;
};
