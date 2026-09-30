import type { HistorianValueSource } from "../../../historian";
import { runtimeSignals } from "../../runtime-signals";

export const runtimeSignalHistorianValueSource: HistorianValueSource = {
  read(path) {
    return runtimeSignals.get(path);
  },
  subscribe(path, listener) {
    return runtimeSignals.subscribe(path, listener);
  },
};
