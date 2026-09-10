import type { DataType } from "../types/DataType";

export type UdtFieldDefinition = {
  id: string;
  name: string;
  type: DataType;
  defaultValue?: unknown;
};

export type UdtMethodDefinition = {
  id: string;
  name: string;
  source: string;
};

export type UdtDefinition = {
  id: string;
  name: string;
  fields: UdtFieldDefinition[];
  methods: UdtMethodDefinition[];
};
