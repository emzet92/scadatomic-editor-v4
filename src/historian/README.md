# Historian bounded context

`historian` owns sampling semantics and query contracts. It does **not** know the SCADAtomic tag engine, Designer, runtime session, project API or backend.

Core ports:

- `HistorianValueSource` — current values + subscriptions.
- `HistorianConfigRepository` — project-scoped logging policies.
- `HistorianSampleRepository` — append/query persisted samples.
- `HistorianClock` / `HistorianScheduler` — time abstraction for deterministic tests.

Current adapters:

- `IndexedDbHistorianConfigRepository`
- `IndexedDbHistorianSampleRepository`
- browser clock/scheduler
- `runtime/integrations/historian/RuntimeSignalHistorianValueSource`

When the backend arrives, replace the repositories and/or value source at the composition root. Sampling policy and UI do not need to change.
