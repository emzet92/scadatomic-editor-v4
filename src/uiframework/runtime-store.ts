// runtime-store.ts

import { create } from "zustand";

type RuntimeState = {
  values: Record<string, unknown>;

  updateValue: (
    tag: string,
    value: unknown
  ) => void;
};

export const useRuntimeStore =
  create<RuntimeState>((set) => ({
    values: {},

    updateValue: (
      tag,
      value
    ) =>
      set((state) => ({
        values: {
          ...state.values,
          [tag]: value,
        },
      })),
  }));