export type TagChangedEvent = {
  type: "tag.changed";
  path: string;
  oldValue: unknown;
  newValue: unknown;
};

export type TagChangedListener = (event: TagChangedEvent) => void;
