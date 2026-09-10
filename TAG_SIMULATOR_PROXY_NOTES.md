# Architecture notes

## One mutation pipeline

The important change is that the simulator no longer produces project-tag values beside the TagStore. The flow is now:

```text
BasicMockTagSimulator
        |
        v
TagStore.set(path, value)
        |
        +--> type validation
        +--> old/new comparison
        +--> immutable runtime state update
        +--> tag.changed
        +--> subscriptions
                  |
                  v
        MockRuntimeSocket bridge
                  |
                  v
            runtime.signal
                  |
                  v
          existing UI bindings
```

That means a simulator tick, `tags.X = value`, and `self.field = value` all exercise the same mutation semantics.

## Proxy model

`createTagRuntimeProxy()` is the canonical script-facing namespace. It resolves tags lazily against the current TagStore snapshot, so handlers do not capture stale values.

UDT proxies recursively create proxies for nested UDT fields. Every primitive setter calls `TagStore.set()` and whole-UDT assignment is rejected.

Direct UDT globals are retained only as a convenience/backward-compatibility layer. Primitive writes intentionally use `tags.<name>` because reassignment of a plain JavaScript function parameter cannot be intercepted.

## Autocomplete

The shared `JavaScriptCodeEditor` now accepts `projectData` and derives the tag completion tree itself. Feature-specific editors only add their own special roots (for example UDT method `self`); they no longer need to manually build the global tag list.
