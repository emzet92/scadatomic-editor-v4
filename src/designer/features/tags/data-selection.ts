export type DataSelection =
  | { kind: "tag"; tagId: string }
  | { kind: "udt"; udtId: string }
  | { kind: "udt-method"; udtId: string; methodId: string }
  | { kind: "new-tag" }
  | { kind: "new-udt" }
  | { kind: "driver"; driverKind: string }
  | null;
