export type IntentSource = {
  projectId: string;
  handlerId: string;
  sourceNodeId: string;
  eventName: string;
  scriptId?: string | undefined;
};

export type RuntimeReference = {
  kind: "tag";
  /** Stable owning tag id. Nested fields keep the same owning tag id. */
  id: string;
  /** Human-readable runtime path, e.g. Pump1.speed. */
  path: string;
};

export type ComponentPropertyReference = {
  kind: "component-property";
  componentId: string;
  property: string;
  path?: string | undefined;
};

export type ComponentVariantReference = {
  kind: "component-variant";
  componentId: string;
  path?: string | undefined;
};

export type EventReference = {
  kind: "event";
  ownerId: string;
  eventName: string;
};

export type MethodReference = {
  kind: "method";
  ownerId: string;
  method: string;
  path?: string | undefined;
};

export type BaseIntent = {
  id: string;
  source: IntentSource;
};

export type SetValueIntent = BaseIntent & {
  type: "set-value";
  target: RuntimeReference;
  value: unknown;
};

export type SetPropertyIntent = BaseIntent & {
  type: "set-property";
  target: ComponentPropertyReference;
  value: unknown;
};

export type SetVariantIntent = BaseIntent & {
  type: "set-variant";
  target: ComponentVariantReference;
  variantName: string;
};

export type EmitEventIntent = BaseIntent & {
  type: "emit-event";
  event: EventReference;
  payload?: Record<string, unknown> | undefined;
};

export type NavigateIntent = BaseIntent & {
  type: "navigate";
  path: string;
};

export type StateSetIntent = BaseIntent & {
  type: "state-set";
  key: string;
  value: unknown;
};

export type StateDeleteIntent = BaseIntent & {
  type: "state-delete";
  key: string;
};

export type StateClearIntent = BaseIntent & {
  type: "state-clear";
};

/**
 * Reserved for native/runtime methods that are intentionally deferred until
 * execution. Script-defined component/UDT methods currently execute
 * synchronously inside the collector and therefore contribute their effects to
 * the same handler graph.
 */
export type CallMethodIntent = BaseIntent & {
  type: "call-method";
  target: MethodReference;
  args: unknown[];
  /**
   * Script-defined methods are expanded synchronously while collecting so
   * return values keep working. Their call node remains in the graph as a
   * semantic trace marker and the executor does not invoke it twice.
   */
  expanded?: boolean | undefined;
};

export type Intent =
  | SetValueIntent
  | SetPropertyIntent
  | SetVariantIntent
  | EmitEventIntent
  | NavigateIntent
  | StateSetIntent
  | StateDeleteIntent
  | StateClearIntent
  | CallMethodIntent;

export function createIntentId(): string {
  return crypto.randomUUID();
}
