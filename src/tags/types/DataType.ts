export type PrimitiveDataType =
  | { kind: "string" }
  | { kind: "int" }
  | { kind: "bool" };

export type UdtDataType = { kind: "udt"; udtId: string };

export type DataType = PrimitiveDataType | UdtDataType;

export type PrimitiveDataKind = PrimitiveDataType["kind"];

export function isPrimitiveDataType(type: DataType): type is PrimitiveDataType {
  return type.kind !== "udt";
}

export function dataTypeEquals(left: DataType, right: DataType) {
  return (
    left.kind === right.kind &&
    (left.kind !== "udt" ||
      (right.kind === "udt" && left.udtId === right.udtId))
  );
}
