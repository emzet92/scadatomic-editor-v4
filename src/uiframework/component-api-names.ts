const RESERVED_COMPONENT_API_NAMES = new Set([
  "id",
  "name",
  "type",
  "setProp",
  "setColor",
  "variant",
]);

export function isReservedComponentApiName(name: string): boolean {
  return RESERVED_COMPONENT_API_NAMES.has(name);
}
