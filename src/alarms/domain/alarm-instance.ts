export type AlarmInstance = {
  alarmId: string;
  projectId: string;
  conditionActive: boolean;
  active: boolean;
  acknowledged: boolean;
  suppressed: boolean;
  shelvedUntil?: number | undefined;
  activeSince?: number | undefined;
  returnedToNormalAt?: number | undefined;
  acknowledgedAt?: number | undefined;
  pendingActiveSince?: number | undefined;
  pendingNormalSince?: number | undefined;
  lastValue?: unknown;
  updatedAt: number;
};

export function createAlarmInstance(alarmId: string, projectId: string, now: number): AlarmInstance {
  return {
    alarmId,
    projectId,
    conditionActive: false,
    active: false,
    acknowledged: true,
    suppressed: false,
    updatedAt: now,
  };
}

export function isAlarmRetained(instance: AlarmInstance): boolean {
  return !instance.active && !instance.acknowledged;
}

export function isAlarmVisible(instance: AlarmInstance, now: number): boolean {
  return !instance.suppressed && !(typeof instance.shelvedUntil === "number" && instance.shelvedUntil > now);
}
