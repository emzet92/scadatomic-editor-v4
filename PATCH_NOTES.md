# Internal autocomplete fix

Fixes CodeMirror completion for component-local namespaces.

- typing `int` now suggests `internal`
- `internal.` lists private nodes owned by the reusable component definition
- `internal.Button3.` lists the primitive/public nested-component API
- `self.` and `ctx.ui.` use the same suffix-based completion parser
- `internal` is still only registered when the current script belongs to a reusable component definition

The runtime/component encapsulation model is unchanged; this patch only fixes Script Editor completion parsing.
