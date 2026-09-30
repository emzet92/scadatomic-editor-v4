import type { AlarmValueSource } from "../alarms";
import { runtimeSignals } from "./runtime-signals";

export const runtimeAlarmValueSource: AlarmValueSource = {
  read: (path) => runtimeSignals.get(path),
  subscribe: (path, listener) => runtimeSignals.subscribe(path, listener),
};
