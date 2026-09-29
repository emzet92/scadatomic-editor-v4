export interface RuntimeClock {
  now(): number;
}

export class PerformanceRuntimeClock implements RuntimeClock {
  now() {
    return typeof performance !== "undefined" ? performance.now() : Date.now();
  }
}

export class ManualRuntimeClock implements RuntimeClock {
  private currentTime: number;

  constructor(initialTime = 0) {
    this.currentTime = initialTime;
  }

  now() {
    return this.currentTime;
  }

  set(time: number) {
    this.currentTime = time;
  }

  advance(deltaMs: number) {
    this.currentTime += deltaMs;
    return this.currentTime;
  }
}
