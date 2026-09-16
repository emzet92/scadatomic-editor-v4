# Theme Runtime

SCADAtomic separates theme definitions, project policy, Designer preview and runtime session state.

## Project document

`UiDocument.designSystem` contains theme definitions and semantic token mappings.
`UiDocument.appearance` contains the runtime policy:

- `fixed` — always use `defaultThemeId`
- `system` — follow `prefers-color-scheme` using configured light/dark mappings
- `runtime` — start from `defaultThemeId`, then allow scripts to switch themes

The active runtime override is not persisted in the document.

## Designer

The toolbar `Preview theme` selector is editor-only. It changes token resolution on the canvas and property previews without changing the runtime policy or active runtime session.

`Design System → Themes & semantic colors` configures the runtime policy, default/initial theme and system light/dark mappings.

## Script API

When the project theme source is `Runtime controlled`:

```js
App.theme = "dark";
```

The setter accepts a theme name (case-insensitive) or stable theme id and produces a `theme-set` intent. The Executor applies the change as runtime session state; it does not mutate `UiDocument`.

Read the current effective theme with:

```js
ctx.log(App.theme, App.themeId);
```

Trying to assign `App.theme` while the project uses `Fixed` or `Follow system` fails the handler with a clear error so script logic cannot fight the configured policy.

## Runtime flow

```text
App.theme = "dark"
    ↓
ThemeSetIntent
    ↓
ExecutionPlanner
    ↓
ExecutionGraph
    ↓
RuntimeEffects.setTheme
    ↓
project runtime theme state
    ↓
semantic token resolver
    ↓
re-render page + open modals
```
