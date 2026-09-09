# SCADAtomic Pages + Navigation patch

## What changed

- `UiDocument` schema is now v4.
- A project can contain multiple `Page` roots in a global node table.
- `components` remain global per project and the existing `ProjectComponentRepository` is unchanged in scope.
- New `Pages` tree in the Designer with:
  - add top-level page,
  - add subpage,
  - switch active page.
- Page names form navigation paths, e.g. `Page1/SubPage1`.
- Runtime URL supports page paths: `/render/:projectId/Page1/SubPage1`.
- New navigation module derives a tree directly from project pages.
- New runtime script API:
  - `ctx.navigateTo("Page1/SubPage1")`
  - `ctx.nav.Page1.go()`
  - `ctx.nav.Page1.SubPage1.go()`
- Script Editor autocomplete generates the `ctx.nav` API from the current page tree.
- Script Editor handler tree now shows scripts under all pages.
- `ctx.ui` autocomplete is page-scoped for page handlers/methods.
- New `Navigation` component in the Palette renders classic top-level page navigation.
- The `Navigation` component highlights a top-level branch when a subpage is active.
- Runtime Preview opens the page currently selected in the Designer.
- Node names are now unique per page, matching the page-scoped `ctx.ui` runtime lookup.

## Data model

Pages are project-level metadata pointing at Page root nodes:

```ts
UiDocument {
  schemaVersion: 4,
  rootId,       // root node of the start page
  startPageId,
  pages: {
    [pageId]: {
      id,
      name,
      rootId,
      parentPageId?
    }
  },
  nodes,        // all page trees, globally unique node ids
  components    // global reusable component repository
}
```

The navigation tree is derived from `pages`; it is not duplicated in storage.

## Prototype storage

The mock project storage namespace was bumped to `scadatomic.mock.v5.project.*` because schema v4 intentionally has no legacy migration.
