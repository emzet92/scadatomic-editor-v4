# SCADAtomic Storybook UI Framework patch

Base: `scadatomic-editor-cloud-fleet-source.zip`

Adds Storybook 10.6 for the shared SCADAtomic application UI framework only.

## Included stories

- Foundations / design tokens
- Button + IconButton
- Form controls
- Panels
- Segmented control
- Dialog + ConfirmDialog
- WorkspaceHeader pattern

Runtime, tags, execution graph, canvas widgets and domain feature screens are intentionally excluded.

## Install and run

After applying the patch, run once:

```bash
npm install
npm run storybook
```

Then open `http://localhost:6006`.

`package.json` contains Storybook 10.6 dependencies. The supplied base lockfile is intentionally left untouched because npm registry access was unavailable in the build environment; the first local `npm install` will regenerate the Storybook entries in `package-lock.json`. Commit that regenerated lockfile before returning to `npm ci`.
