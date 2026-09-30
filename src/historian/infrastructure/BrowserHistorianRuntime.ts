import type { HistorianClock, HistorianScheduler } from "../application";

export const browserHistorianClock: HistorianClock = {
  now: () => Date.now(),
};

export const browserHistorianScheduler: HistorianScheduler = {
  every(intervalMs, listener) {
    const id = window.setInterval(listener, intervalMs);
    return () => window.clearInterval(id);
  },
};
