import type {
  DataType,
  PrimitiveDataKind,
  PrimitiveDataType,
} from "./DataType";

export type TypeEditorKind = "text" | "number" | "boolean" | "udt";

export type PrimitiveTypeDescriptor = {
  kind: PrimitiveDataKind;
  displayName: string;
  editor: TypeEditorKind;
  defaultValue: string | number | boolean;
  validate(value: unknown): boolean;
  serialize(value: unknown): unknown;
  deserialize(value: unknown): string | number | boolean;
};

const primitiveDescriptors: Record<PrimitiveDataKind, PrimitiveTypeDescriptor> = {
  string: {
    kind: "string",
    displayName: "String",
    editor: "text",
    defaultValue: "",
    validate: (value) => typeof value === "string",
    serialize: (value) => String(value ?? ""),
    deserialize: (value) => String(value ?? ""),
  },
  int: {
    kind: "int",
    displayName: "Int",
    editor: "number",
    defaultValue: 0,
    validate: (value) => typeof value === "number" && Number.isInteger(value),
    serialize: (value) => value,
    deserialize: (value) => {
      const number = typeof value === "number" ? value : Number(value);
      return Number.isFinite(number) ? Math.trunc(number) : 0;
    },
  },
  bool: {
    kind: "bool",
    displayName: "Bool",
    editor: "boolean",
    defaultValue: false,
    validate: (value) => typeof value === "boolean",
    serialize: (value) => value === true,
    deserialize: (value) => value === true,
  },
};

export const TypeRegistry = Object.freeze({
  primitiveKinds: Object.freeze(["string", "int", "bool"] as const),

  getPrimitive(kind: PrimitiveDataKind) {
    return primitiveDescriptors[kind];
  },

  getDefaultValue(type: PrimitiveDataType) {
    return primitiveDescriptors[type.kind].defaultValue;
  },

  validate(type: PrimitiveDataType, value: unknown) {
    return primitiveDescriptors[type.kind].validate(value);
  },

  serialize(type: PrimitiveDataType, value: unknown) {
    if (!primitiveDescriptors[type.kind].validate(value)) {
      throw new TypeError(
        `Invalid ${primitiveDescriptors[type.kind].displayName} value: ${String(value)}`
      );
    }
    return primitiveDescriptors[type.kind].serialize(value);
  },

  deserialize(type: PrimitiveDataType, value: unknown) {
    return primitiveDescriptors[type.kind].deserialize(value);
  },

  getDisplayName(type: DataType, udtName?: string) {
    return type.kind === "udt"
      ? udtName ?? "UDT"
      : primitiveDescriptors[type.kind].displayName;
  },

  getEditorType(type: DataType): TypeEditorKind {
    return type.kind === "udt" ? "udt" : primitiveDescriptors[type.kind].editor;
  },
});
