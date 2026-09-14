import { EditorPageSlot, RuntimePageSlot } from "../../components/PageSlot";
import type { ComponentDefinition } from "../component-definition-types";

export const pageSlotDefinition = {
  type: "PageSlot",
  label: "Page Slot",
  description: "Content outlet for a Page Layout",
  editor: EditorPageSlot,
  runtime: RuntimePageSlot,
  defaults: { slotName: "content" },
  inspector: {
    slotName: { kind: "select", options: ["content"] },
  },
} satisfies ComponentDefinition;
