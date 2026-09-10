# Production refactor plan

This document records the architectural direction behind the modularization patch.
The patch is intentionally incremental: existing public imports continue to work while
implementation details move behind smaller modules.

## What the editor is built with

The editor does not currently use a third-party component library such as shadcn/Radix/MUI.
Its visual layer is React + Tailwind CSS 4, project CSS variables (`--editor-*`) and Lucide
icons. That is a good base for a small internal design system, so this patch does not add
another UI dependency. Accessibility-heavy primitives (dialogs, popovers, menus, comboboxes)
can later use a headless library if/when those widgets appear.

## Problems found in the current structure

1. **Repeated editor UI markup.** Buttons, inputs, selects, cards and section headers copied
   the same Tailwind/token classes across feature files. This makes visual changes and
   accessibility fixes expensive and inconsistent.
2. **Reusable-component responsibilities were mixed.** One domain file handled extraction,
   instance runtime, public API contracts and naming. One React file handled instance UI,
   definition UI and public-input mapping.
3. **Feature logic leaked into React.** Public-input target discovery and selection were
   coupled to panel state instead of being pure domain logic.
4. **Repeated immutable record mutation.** Bindings, events and methods repeatedly cloned,
   mutated and normalized optional maps in slightly different ways.
5. **Duplicated component-API rules.** Reserved public API names existed in more than one
   module.
6. **Derived state was synchronized through effects.** Editor/runtime page and component
   modes contained effect-driven state normalization, which is harder to reason about and
   triggered React lint rules.
7. **Provider/hook coupling hurt Fast Refresh.** Navigation context, provider and hook lived
   in one module.
8. **Several modules are still orchestration hotspots.** `HandlerTree.tsx`, `editor-store.ts`,
   `EditorPage.tsx`, `ScriptPage.tsx` and `PropInput.tsx` remain the main next candidates.
9. **There is no automated test layer in package scripts.** The code has valuable pure-domain
   seams but they are not protected by unit/interaction tests yet.
10. **Prototype runtime execution is not a production sandbox.** `new Function()` is useful
    for the mock/prototype but should not execute untrusted production scripts in the main UI
    realm.

## What this patch changes

### 1. Internal editor UI primitives

`src/uiframework/gui/ui/` now contains reusable primitives built on the project's existing
Tailwind/token language:

- `Button` / `IconButton`
- `TextInput` / `Select` / `Checkbox`
- `FormField`
- `PanelCard` / `SectionHeader` / `EmptyAction`
- `SegmentedControl` / `SegmentedControlItem`
- `cx` for small conditional class composition

The reusable-component panels, variants, bindings, events, methods, page settings,
component API editor and the central `PropInput` now consume these primitives instead of
redeclaring common HTML/CSS patterns.

### 2. Shared component method form

Method creation UI used by both the property panel and script component-API editor is moved
to `gui/component-api/MethodCreateForm.tsx`. Validation and interaction remain owned by the
calling feature; presentation and form behavior are shared.

### 3. Reusable-component feature split

The previous `reusable-components.ts` implementation is split into focused domain modules:

- `reusable-components/creation.ts` — selection validation, extraction, naming and subtree work
- `reusable-components/instance-runtime.ts` — resolving instances and applying public values
- `reusable-components/public-contract.ts` — exposing/typing public inputs
- `reusable-components/index.ts` — feature barrel
- `reusable-components.ts` — compatibility facade for existing imports

This preserves the current import surface while making dependencies explicit and future tests
much smaller.

### 4. Public-input target domain logic

`reusable-component-input-targets.ts` owns discovery/selection of valid mapping targets. UI no
longer decides which internal nodes are legal targets. It includes nested reusable components
through their public contracts, preserving the earlier fix that enables parent public input ->
nested user-component public input -> internal Button/primitive mappings.

### 5. Canonical optional-map updates

`core/optional-record.ts` centralizes immutable update/delete/normalization of optional maps.
Bindings, events and methods now share one behavior: an empty map becomes `undefined` instead
of leaving inconsistent `{}` values in persisted documents.

### 6. Component API naming rules

`component-api-names.ts` is the single source for reserved component API names. Existing
identifier validation reuses the canonical `isJsIdentifier` helper from the document model.

### 7. React lifecycle cleanup

- Navigation context, provider and hook are split into separate modules.
- Runtime route page is derived from the URL/document instead of mirrored in state.
- Component editor modes are validated by pure resolver functions rather than synchronous
  state-fixing effects.
- Callback/adapter refs are updated in effects rather than during render.

These changes make the code friendlier to React's stricter lint/compiler model.

## Recommended target architecture

A practical end state can keep the current renderer/core while organizing product code around
feature boundaries:

```text
src/uiframework/
  core/                         # pure document model + commands + indexes
  ui/ or gui/ui/                # editor design-system primitives only
  features/
    reusable-components/
      domain/                   # contracts, extraction, validation
      application/              # editor-facing use cases/actions
      ui/                       # panels/forms/trees
    scripts/
      domain/
      ui/
    navigation/
      domain/
      ui/
  editor/
    shell/                      # EditorPage orchestration/layout
    state/                      # Zustand slices/selectors
  runtime/
    rendering/
    script-execution/
  adapters/
    project-storage/
    runtime-transport/
```

Do not move files merely to match this tree. Move a unit when its dependencies can point one
way: UI -> application/domain -> core; adapters plug into interfaces at the edge.

## Next refactor priorities

### P0 — add regression tests before deeper moves

Add Vitest + React Testing Library (or the team's preferred equivalents) and protect:

- `core/commands.ts`
- reusable-component extraction and public input chaining
- component API name/type validation
- navigation resolution
- runtime application of component inputs
- a small interaction test for the public-input picker showing all internal components

### P1 — split the Zustand store by capability

`editor-store.ts` is still large. Keep one public `useEditorStore`, but compose focused slices
or action groups for selection, drag/drop, pages, reusable components and document mutations.
Document mutation should continue to flow through pure commands/use cases instead of becoming
store-only logic.

### P1 — decompose `HandlerTree.tsx`

At ~1000 lines it is the largest UI hotspot. Extract row primitives, tree traversal/model
building, rename/create interactions and handler-specific presentation. Keep tree data shaping
pure so it can be unit-tested without rendering React.

### P1 — make `EditorPage` an app shell

Move autosave/load state into a `useProjectDocument`/project-session module, component-editor
mode into a dedicated hook/state unit, and navigation adapter creation into a focused module.
`EditorPage` should mostly compose layout regions and feature panels.

### P2 — continue design-system migration by semantics

Migrate common controls opportunistically, not mechanically. Raw HTML is appropriate inside
specialized widgets when it expresses their behavior better. Add primitives when at least two
features need the same semantic control. Good next candidates are badges/status messages,
inline editable labels, toolbar/toggle groups and destructive confirmation UI.

Keep all editor chrome on semantic `--editor-*` tokens. Feature-specific violet/zinc classes
should gradually become semantic component-state tokens if themes/branding need to vary.

### P2 — harden external boundaries

- Define project persistence and runtime transport interfaces and inject adapters.
- Validate server/storage payloads at those boundaries with a versioned schema/migration path.
- Add error boundaries and structured error reporting around editor/runtime shells.
- Move production user-script execution out of the main UI realm (Worker/iframe/server sandbox,
  depending on required APIs and threat model).

## Validation for this patch

The source tree passes:

```bash
tsc -p tsconfig.app.json --noEmit
eslint src
git diff --check
```

`tsc -b` also succeeds. The provided `node_modules` archive is missing the Linux native
`@rolldown/binding-linux-x64-gnu` optional package required by Vite 8, so the Vite bundling
step cannot run from the supplied dependencies. On a normal checkout, run `npm ci` and then
`npm run build` to perform the final bundle validation.
