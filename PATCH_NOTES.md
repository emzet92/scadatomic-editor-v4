# Strict Component API + Scoped Identity

## Public user-component contract
Reusable `ComponentInstance` facades now expose only:
- explicitly exposed public inputs
- public methods
- variants

Framework implementation members (`id`, `name`, `type`, `setProp`, `setColor`) are no longer emitted by autocomplete and no longer exist on reusable-component runtime facades.

Primitive/internal nodes keep their low-level framework API.

A reusable instance with a missing definition now exposes an empty contract instead of falling back to storage props/methods.

## Name collisions / identity
API names are scoped:
- `ctx.ui.Button1` resolves inside the current Page scope
- `internal.Button1` resolves inside the current reusable-component definition

The same display name may therefore exist in both scopes.
Runtime state identity is based on stable node ids, not display names:
- page node: `<nodeId>`
- internal node: `<componentInstanceId>::<definitionNodeId>`
- nested node: `<parentInstanceId>::<nestedInstanceId>::<definitionNodeId>`

Facade caches are keyed by node id rather than display name. Duplicate names inside one Page scope or one component-definition scope are treated as ambiguous instead of silently selecting one node.

## Script Editor
Reusable component cards no longer advertise primitive-only helpers or per-instance method editing. Their API is definition-owned.
