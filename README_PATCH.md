# SCADAtomic Cloud / Fleet Management patch

Base: `scadatomic-editor-reactive-runtime-fixed-source.zip`

Adds:
- `/cloud/fleet` module and route,
- Cloud entry in the existing workspace header,
- SCADAtomic Cloud shell with top navigation and left project navigation,
- Fleet Management dashboard with mock Edge devices,
- Edge registration key creation/copy/delete flow,
- IndexedDB persistence,
- `FleetApi` abstraction,
- IndexedDB development adapter,
- ready-to-use HTTP adapter matching the future backend contract.

Apply the diff from the project root:

```bash
git apply PATCH_CLOUD_FLEET_MANAGEMENT.diff
```

Validation:
- `tsc -b`: PASS
- ESLint for changed files: PASS
- `git apply --check`: PASS
- Vite bundling is blocked in this environment by the pre-existing missing optional Rolldown Linux native binding in the supplied node_modules archive.
