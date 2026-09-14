# SCADAtomic UI framework Storybook

Storybook documents only the shared UI framework used to build SCADAtomic's application interface.

Included:

- design tokens from `src/index.css`
- `Button` / `IconButton`
- `TextInput`, `Select`, `Checkbox`, `FormField`
- `PanelCard`, `SectionHeader`, `EmptyAction`
- `SegmentedControl`
- `Dialog` / `ConfirmDialog`
- `WorkspaceHeader` as a shared shell/navigation pattern

Intentionally excluded:

- canvas/runtime components (`Text`, `Chart`, runtime `Button`, etc.)
- tag/UDT editors
- execution graph and script runtime
- Fleet Management feature screens and other domain pages

## Run

```bash
npm install
npm run storybook
```

Storybook runs on `http://localhost:6006`.

To produce a static build:

```bash
npm run build-storybook
```

The stories path is deliberately restricted to `stories/design-system/**` so feature/domain stories do not silently turn this into an application catalog.

## Dependency lock note

`package.json` pins Storybook 10.6.x. Run `npm install` once after applying this patch so npm adds Storybook's transitive dependencies to `package-lock.json`. After that, commit the regenerated lockfile and continue using `npm ci` normally.
