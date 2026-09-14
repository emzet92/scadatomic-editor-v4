# SCADAtomic Reactive Runtime + Property Bindings

Base: `scadatomic-editor-modularized-source.zip`

This patch introduces the first production-oriented Reactive Runtime slice and starts replacing the old tag runtime boundary without creating a second copy of tag values.

## Runtime flow

```text
Device / Simulator
      -> DriverRuntime
      -> TagStore (single process image)
      -> TagReactiveSource
      -> ReactiveStore
      -> DependencyRegistry
      -> BindingRuntime
      -> Runtime UI overrides
```

Writes still follow the command path:

```text
Handler -> Script -> Intent[] -> ExecutionGraph -> Executor
        -> ReactiveTagRuntime.write() -> DriverRuntime -> driver/readback
```

`src/uiframework/data/runtime/TagRuntime.ts` is now a compatibility re-export of the new `ReactiveTagRuntime` implementation in `src/reactivity/sources/reactive-tag-runtime.ts`.

## Included features

- ReactiveRef / stable tag field references
- ReactiveStore
- DependencyRegistry
- BindingRuntime + pure BindingEvaluator
- Tag reactive source backed by the existing TagStore process image
- Property bindings for variant / enabled / visible / value/text where supported
- Initial binding evaluation
- Runtime UI override layer (does not mutate document props)
- Binding trace
- Tag reactive listeners: value changed / rising edge / falling edge
- Tag listeners reuse the normal Handler -> Script -> Intent -> ExecutionGraph pipeline
- Reusable component instance scoping for binding targets
- Repeat-instance-safe runtime IDs
- Property Panel binding editor
- Tag event editor

## Apply

From the root of the source corresponding to `scadatomic-editor-modularized-source.zip`:

```bash
git apply PATCH_REACTIVE_RUNTIME_BINDINGS.diff
```

Alternatively copy the included `src/` files over the same base.

## Validation performed before packaging

- TypeScript project build/typecheck: passed
- ESLint on changed/new modules: passed
- Runtime smoke test through ProjectRuntimeSession -> ReactiveTagRuntime -> DriverRuntime -> driver/readback -> TagStore -> ReactiveStore -> BindingRuntime: passed

The repository still has the previously existing Fast Refresh lint issue in `navigation-context.tsx`, unrelated to this patch.
