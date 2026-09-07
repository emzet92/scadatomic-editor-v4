# Mock backend

The editor currently runs without any backend service.

## Mock HTTP

`src/http/projects-api.ts` keeps the same API that the real HTTP client can use later, but delegates to `src/mock/mock-project-store.ts`.

- projects are persisted in `localStorage`
- an artificial ~120 ms delay makes loading/saving behave like an async API
- any `/project/:projectId` is auto-seeded from the demo document on first open
- revisions are incremented and optimistic revision conflicts are still checked

Useful route:

```text
/project/demo
```

Runtime preview:

```text
/render/demo
```

## Mock WebSocket

`src/uiframework/websocket.ts` delegates to `src/mock/mock-runtime-socket.ts` and opens no network socket.

The mock emits process values roughly every 650 ms:

- `tank.levelPercent`
- `tank.levelLiters`
- `pump.flowRate`
- `pump.running`
- `pump.stationName`

Publish and runtime events use the same message shape as before. `BroadcastChannel` mirrors them between tabs, so you can keep `/project/demo` open in one tab and `/render/demo` in another and test publish behavior without a server.

The `start`/`stop` handler names also influence the mocked pump flow if runtime button events contain those words.
