# SCADAtomic Cloud / Fleet Management prototype

## Route

- `/cloud/fleet`
- `/cloud` redirects to `/cloud/fleet`
- The existing workspace header now includes a `Cloud` entry.

## UI

The new Cloud module reuses the existing SCADAtomic design tokens and GUI primitives (`Button`, `PanelCard`, `SectionHeader`, `Dialog`, `TextInput`, `Select`).

Reusable Cloud UI components:

- `CloudShell`
- `CloudPageHeader`
- `FleetStatCard`
- `EdgeDeviceCard`
- `RegistrationKeysPanel`
- `RegistrationKeyDialog`

The Fleet Management example includes:

- top bar with SCADAtomic logo and Designer / Cloud navigation,
- left navigation with `Cloud → Fleet Management`,
- online/offline/provisioning/key summary cards,
- seeded fake Edge Agents with versions, host data, labels and metrics,
- local Edge registration key creation, copy and delete flow.

## Backend abstraction

The page/hooks only depend on `FleetApi`:

```ts
interface FleetApi {
  getSummary(...): Promise<FleetSummary>;
  listDevices(...): Promise<EdgeDevice[]>;
  listRegistrationKeys(...): Promise<RegistrationKey[]>;
  createRegistrationKey(...): Promise<RegistrationKey>;
  deleteRegistrationKey(...): Promise<void>;
}
```

Development defaults to `createIndexedDbFleetApi()` through `src/cloud/api/client.ts`.

When the backend exists, switch the adapter during bootstrap:

```ts
configureFleetApi(createHttpFleetApi("https://cloud.example.com"));
```

The UI does not need to change.

## Planned HTTP contract already implemented by the HTTP adapter

```text
GET    /api/cloud/projects/:projectId/fleet/summary
GET    /api/cloud/projects/:projectId/fleet/devices
GET    /api/cloud/projects/:projectId/fleet/registration-keys
POST   /api/cloud/projects/:projectId/fleet/registration-keys
DELETE /api/cloud/projects/:projectId/fleet/registration-keys/:keyId
```

`POST registration-keys` body:

```json
{
  "name": "Factory edge enrollment",
  "expiresInHours": 168
}
```

## Local persistence

Development data is stored in IndexedDB database:

```text
scadatomic-cloud-dev
```

Object stores:

```text
fleet-devices
fleet-registration-keys
```

The local adapter adds small artificial request latency and logs mock HTTP-like requests to the browser console.

## Validation

- TypeScript `tsc -b`: passes.
- ESLint for changed Cloud/App/WorkspaceHeader files: passes.
- Vite build in this environment remains blocked by the pre-existing missing optional native Rolldown Linux binding from the provided `node_modules` archive.
