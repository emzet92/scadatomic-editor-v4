import type { ProcessTagSource } from "../processes";
import { runtimeSignals } from "./runtime-signals";

/** Adapter from the runtime signal hub to the process visualization tag port. */
export const runtimeProcessTagSource: ProcessTagSource = {
  read: (path) => runtimeSignals.get(path),
  subscribe: (path, listener) => runtimeSignals.subscribe(path, listener),
};
