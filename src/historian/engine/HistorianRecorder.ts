import type {
  HistorianClock,
  HistorianConfigRepository,
  HistorianSampleRepository,
  HistorianScheduler,
  HistorianUnsubscribe,
  HistorianValueSource,
} from "../application";
import { toHistorianScalar } from "../application";
import type { HistorianSample, HistorianTagConfig } from "../domain";
import { shouldRecordSample } from "./should-record-sample";

export class HistorianRecorder {
  private readonly configRepository: HistorianConfigRepository;
  private readonly sampleRepository: HistorianSampleRepository;
  private readonly source: HistorianValueSource;
  private readonly clock: HistorianClock;
  private readonly scheduler: HistorianScheduler;
  private readonly disposers: HistorianUnsubscribe[] = [];
  private readonly latest = new Map<string, HistorianSample | undefined>();
  private readonly chains = new Map<string, Promise<void>>();
  private runningProjectId: string | undefined;
  private reloadRevision = 0;

  constructor(
    configRepository: HistorianConfigRepository,
    sampleRepository: HistorianSampleRepository,
    source: HistorianValueSource,
    clock: HistorianClock,
    scheduler: HistorianScheduler,
  ) {
    this.configRepository = configRepository;
    this.sampleRepository = sampleRepository;
    this.source = source;
    this.clock = clock;
    this.scheduler = scheduler;
  }

  async start(projectId: string): Promise<void> {
    this.stop();
    this.runningProjectId = projectId;
    const revision = ++this.reloadRevision;

    this.disposers.push(
      this.configRepository.subscribe(projectId, () => {
        if (this.runningProjectId !== projectId) return;
        void this.start(projectId);
      }),
    );

    const configs = await this.configRepository.list(projectId);
    if (this.runningProjectId !== projectId || revision !== this.reloadRevision) return;

    for (const config of configs.filter((candidate) => candidate.enabled)) {
      const latest = await this.sampleRepository.getLatest(projectId, config.tagPath);
      if (this.runningProjectId !== projectId || revision !== this.reloadRevision) return;
      this.latest.set(config.id, latest);
      this.attachConfig(config);
    }
  }

  stop(): void {
    this.runningProjectId = undefined;
    this.reloadRevision += 1;
    for (const dispose of this.disposers.splice(0)) dispose();
    this.latest.clear();
    this.chains.clear();
  }

  private attachConfig(config: HistorianTagConfig) {
    this.disposers.push(
      this.source.subscribe(config.tagPath, () => {
        this.enqueueCapture(config, "change");
      }),
    );

    if (config.policy.kind === "interval" || config.policy.kind === "on-change-or-interval") {
      const intervalMs = Math.max(100, config.policy.intervalMs);
      this.disposers.push(
        this.scheduler.every(intervalMs, () => this.enqueueCapture(config, "interval")),
      );
    }

    this.enqueueCapture(config, "initial");
  }

  private enqueueCapture(config: HistorianTagConfig, reason: "change" | "interval" | "initial") {
    const previousChain = this.chains.get(config.id) ?? Promise.resolve();
    const nextChain = previousChain
      .then(() => this.capture(config, reason))
      .catch((error) => console.error("[historian] capture failed", error));
    this.chains.set(config.id, nextChain);
  }

  private async capture(config: HistorianTagConfig, reason: "change" | "interval" | "initial") {
    if (this.runningProjectId !== config.projectId) return;
    const value = toHistorianScalar(this.source.read(config.tagPath));
    if (value === undefined) return;

    const now = this.clock.now();
    const previous = this.latest.get(config.id);
    if (!shouldRecordSample({ policy: config.policy, previous, value, now, reason })) return;

    const sample: HistorianSample = {
      id: crypto.randomUUID(),
      projectId: config.projectId,
      tagPath: config.tagPath,
      timestamp: now,
      value,
      quality: "good",
    };

    await this.sampleRepository.append(sample);
    this.latest.set(config.id, sample);
  }
}
