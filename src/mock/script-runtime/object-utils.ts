export function hasOwn(target: object, property: string) {
  return Object.prototype.hasOwnProperty.call(target, property);
}
