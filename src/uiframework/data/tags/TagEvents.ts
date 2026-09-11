export type TagWriteSource = {
  kind: "user" | "script" | "simulation" | "driver";
  id?: string | undefined;
};

export type TagWriteOptions = {
  source?: TagWriteSource | undefined;
};

export type TagChangedEvent = {
  type: "tag.changed";
  path: string;
  oldValue: unknown;
  newValue: unknown;
  source?: TagWriteSource | undefined;
};

export type TagChangedListener = (event: TagChangedEvent) => void;
