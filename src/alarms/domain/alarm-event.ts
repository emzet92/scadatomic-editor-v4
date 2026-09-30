import type { AlarmPriority } from "./alarm-definition";

export type AlarmEventType =
  | "activated"
  | "acknowledged"
  | "returned-to-normal"
  | "shelved"
  | "unshelved"
  | "suppressed"
  | "unsuppressed";

export type AlarmEvent = {
  id: string;
  projectId: string;
  alarmId: string;
  type: AlarmEventType;
  timestamp: number;
  priority: AlarmPriority;
  sourcePath: string;
  message: string;
  value?: unknown;
  actor?: string | undefined;
  metadata?: Record<string, unknown> | undefined;
};
