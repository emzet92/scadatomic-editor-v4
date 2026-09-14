# SCADAtomic modularization refactor patch

Base: `scadatomic-editor-grid-hug-rounded-inputs-source.zip` (the latest source before this refactor).

Apply either by copying the included files over the project or with:

```bash
git apply PATCH_MODULARIZATION_REFACTOR.diff
```

Main changes:

- one shared node-tree editing core for Page and reusable-component definitions
- one shared recursive tree renderer
- property inspector renderer registry
- split script runtime orchestration/proxies/effects/types
- per-component registry definition modules
- no project-data migration and no public store API migration

Validation:

- `tsc -b`: PASS
- ESLint on every changed/new file: PASS
- `git apply --check`: PASS against the stated base
- Vite bundle not runnable in this Linux environment because the uploaded dependencies do not contain the Linux Rolldown native binding
- full-project ESLint has one pre-existing Fast Refresh error in `navigation-context.tsx`, outside this patch
