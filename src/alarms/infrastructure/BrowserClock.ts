import type { AlarmScheduler, Clock } from "../application/AlarmPorts";

export const systemClock: Clock = { now: () => Date.now() };

export const browserAlarmScheduler: AlarmScheduler = {
  every(intervalMs, listener) {
    const id = window.setInterval(listener, intervalMs);
    return () => window.clearInterval(id);
  },
};
