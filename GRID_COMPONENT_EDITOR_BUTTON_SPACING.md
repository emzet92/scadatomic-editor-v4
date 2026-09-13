# Grid template + Button spacing follow-up

## What changed

### One shared property path

`NodePropertiesEditor` is now the shared primitive-node property surface used by both:

- normal Page designer (`PropertyPanel`)
- reusable component definition designer (`ComponentDefinitionPanel`)

Container-specific layout controls are no longer wired only in `PropertyPanel`. A Container selected inside a reusable component now gets the exact same `ContainerLayoutEditor` with Grid/Flow, presets, fixed/adaptive mode, columns, min column width, min row height, gap and padding.

### Stable component preview frame

Both component preview modes now use one `ComponentPreviewFrame`. The frame owns a stable responsive width (`w-full`, `max-w-[960px]`, `min-w-0`) so percentage-based Container roots and adaptive grid templates have a real inline size to resolve against. The old duplicated wrappers were removed.

### Compact Button spacing

Button defaults are now compact:

- horizontal padding: 10px
- vertical padding: 5px
- horizontal margin: 0px
- vertical margin: 0px
- radius: 6px
- minimum visual height: 32px

A shared `ButtonLayoutEditor` exposes Padding X/Y, Margin X/Y and Corner radius in both Page and reusable-component property editors.

### Grid + margin behavior

Grid children now use `width:auto !important` with `justify-self: stretch` instead of `width:100% !important`. This lets CSS Grid subtract margins from the available track size instead of creating `100% + margin` overflow.

## Main files

- `src/uiframework/gui/property-panel/NodePropertiesEditor.tsx`
- `src/uiframework/gui/property-panel/ButtonLayoutEditor.tsx`
- `src/uiframework/gui/property-panel/PropertyPanel.tsx`
- `src/uiframework/gui/reusable-component/ComponentDefinitionPanel.tsx`
- `src/uiframework/EditorPage.tsx`
- `src/uiframework/components/Button.tsx`
- `src/uiframework/component-props.ts`
- `src/uiframework/registry/component-definitions.ts`
- `src/index.css`
