import type { AlarmDefinition } from "../domain/alarm-definition";
import type { AlarmEvent } from "../domain/alarm-event";
import { createAlarmInstance, type AlarmInstance } from "../domain/alarm-instance";
import { acknowledgeAlarm, evaluateAlarm, shelveAlarm, unshelveAlarm, type AlarmEvaluation } from "../engine/evaluate-alarm";
import type { AlarmLibrary } from "./AlarmLibrary";
import type { AlarmScheduler, AlarmValueSource, Clock } from "./AlarmPorts";

export class AlarmRuntime {
  readonly projectId: string;
  private readonly library: AlarmLibrary;
  private readonly valueSource: AlarmValueSource;
  private readonly clock: Clock;
  private readonly scheduler: AlarmScheduler;
  private definitions = new Map<string, AlarmDefinition>();
  private instances = new Map<string, AlarmInstance>();
  private sourceUnsubscribers: Array<() => void> = [];
  private libraryUnsubscribe: (() => void) | null = null;
  private tickUnsubscribe: (() => void) | null = null;
  private readonly listeners = new Set<() => void>();
  private evaluationChain: Promise<void> = Promise.resolve();
  private running = false;
  private startVersion = 0;

  constructor(
    projectId: string,
    library: AlarmLibrary,
    valueSource: AlarmValueSource,
    clock: Clock,
    scheduler: AlarmScheduler,
  ) {
    this.projectId = projectId;
    this.library = library;
    this.valueSource = valueSource;
    this.clock = clock;
    this.scheduler = scheduler;
  }

  async start(): Promise<void> {
    const version = ++this.startVersion;
    this.running = true;
    await this.reloadDefinitions();
    if (!this.running || version !== this.startVersion) return;
    this.libraryUnsubscribe = this.library.subscribe((event) => {
      if (event.projectId !== this.projectId || (event.kind !== "saved" && event.kind !== "deleted")) return;
      void this.reloadDefinitions();
    });
    this.tickUnsubscribe = this.scheduler.every(100, () => this.scheduleEvaluate());
    this.scheduleEvaluate();
  }

  stop(): void {
    this.running = false;
    this.startVersion += 1;
    this.libraryUnsubscribe?.();
    this.tickUnsubscribe?.();
    this.libraryUnsubscribe = null;
    this.tickUnsubscribe = null;
    this.clearSourceSubscriptions();
    this.listeners.clear();
  }

  snapshot(): Array<{ definition: AlarmDefinition; instance: AlarmInstance }> {
    return [...this.definitions.values()]
      .map((definition) => ({
        definition: structuredClone(definition),
        instance: structuredClone(this.instances.get(definition.id) ?? createAlarmInstance(definition.id, this.projectId, this.clock.now())),
      }))
      .sort((a, b) => priorityRank(a.definition.priority) - priorityRank(b.definition.priority) || a.definition.name.localeCompare(b.definition.name));
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  async acknowledge(alarmId: string, actor = "operator"): Promise<void> {
    const pair = this.getPair(alarmId);
    if (!pair) return;
    await this.commit(acknowledgeAlarm(pair.definition, pair.instance, this.clock.now(), actor));
  }

  async shelve(alarmId: string, durationMs: number, actor = "operator"): Promise<void> {
    const pair = this.getPair(alarmId);
    if (!pair) return;
    await this.commit(shelveAlarm(pair.definition, pair.instance, this.clock.now(), durationMs, actor));
  }

  async unshelve(alarmId: string, actor = "operator"): Promise<void> {
    const pair = this.getPair(alarmId);
    if (!pair) return;
    await this.commit(unshelveAlarm(pair.definition, pair.instance, this.clock.now(), actor));
  }

  private async reloadDefinitions() {
    const summaries = await this.library.list(this.projectId);
    const definitions = (await Promise.all(summaries.map((item) => this.library.get(item.id))))
      .filter((value): value is AlarmDefinition => value !== null);
    this.definitions = new Map(definitions.map((definition) => [definition.id, definition]));

    const nextInstances = new Map<string, AlarmInstance>();
    for (const definition of definitions) {
      const persisted = await this.library.getState(this.projectId, definition.id);
      nextInstances.set(definition.id, persisted ?? createAlarmInstance(definition.id, this.projectId, this.clock.now()));
    }
    this.instances = nextInstances;
    this.rebuildSourceSubscriptions();
    this.emit();
    this.scheduleEvaluate();
  }

  private rebuildSourceSubscriptions() {
    this.clearSourceSubscriptions();
    const paths = new Set<string>();
    for (const definition of this.definitions.values()) {
      paths.add(definition.source.path);
      if (definition.suppression) paths.add(definition.suppression.source.path);
    }
    for (const path of paths) this.sourceUnsubscribers.push(this.valueSource.subscribe(path, () => this.scheduleEvaluate()));
  }

  private clearSourceSubscriptions() {
    for (const unsubscribe of this.sourceUnsubscribers.splice(0)) unsubscribe();
  }

  private scheduleEvaluate() {
    if (!this.running) return;
    this.evaluationChain = this.evaluationChain.then(() => this.evaluateAll()).catch((error) => console.error("Alarm evaluation failed", error));
  }

  private async evaluateAll() {
    const now = this.clock.now();
    for (const definition of this.definitions.values()) {
      let previous = this.instances.get(definition.id) ?? createAlarmInstance(definition.id, this.projectId, now);
      if (previous.shelvedUntil !== undefined && previous.shelvedUntil <= now) {
        const unshelved = unshelveAlarm(definition, previous, now);
        previous = unshelved.instance;
        await this.persistEvaluation(definition, unshelved);
      }
      const evaluation = evaluateAlarm({
        definition,
        previous,
        value: this.valueSource.read(definition.source.path),
        ...(definition.suppression ? { suppressionValue: this.valueSource.read(definition.suppression.source.path) } : {}),
        now,
      });
      if (!sameInstance(previous, evaluation.instance) || evaluation.events.length > 0) {
        await this.persistEvaluation(definition, evaluation);
      }
    }
  }

  private async commit(evaluation: AlarmEvaluation) {
    const definition = this.definitions.get(evaluation.instance.alarmId);
    if (!definition) return;
    await this.persistEvaluation(definition, evaluation);
  }

  private async persistEvaluation(definition: AlarmDefinition, evaluation: AlarmEvaluation) {
    this.instances.set(definition.id, evaluation.instance);
    await this.library.saveState(evaluation.instance);
    for (const event of evaluation.events) await this.library.appendEvent(event);
    this.emit();
  }

  private getPair(alarmId: string) {
    const definition = this.definitions.get(alarmId);
    const instance = this.instances.get(alarmId);
    return definition && instance ? { definition, instance } : null;
  }

  private emit() {
    for (const listener of this.listeners) listener();
  }
}

function priorityRank(priority: AlarmDefinition["priority"]): number {
  return priority === "critical" ? 0 : priority === "high" ? 1 : priority === "medium" ? 2 : 3;
}

function sameInstance(left: AlarmInstance, right: AlarmInstance): boolean {
  const { updatedAt: _leftUpdatedAt, ...leftState } = left;
  const { updatedAt: _rightUpdatedAt, ...rightState } = right;
  return JSON.stringify(leftState) === JSON.stringify(rightState);
}

export type { AlarmEvent };
