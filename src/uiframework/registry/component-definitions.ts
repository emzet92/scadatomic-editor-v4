import type { ComponentDefinition } from "./component-definition-types";
import { getDefaultDesignSystemPropsForType } from "../design-system/default-design-system";
import { buttonDefinition } from "./components/button";
import { chartDefinition } from "./components/chart";
import { containerDefinition } from "./components/container";
import { imageDefinition } from "./components/image";
import { navigationDefinition } from "./components/navigation";
import { modalDefinition } from "./components/modal";
import { pageDefinition } from "./components/page";
import { pageSlotDefinition } from "./components/page-slot";
import { textDefinition } from "./components/text";

export type { ComponentDefinition, InspectorControl } from "./component-definition-types";

export const componentDefinitions = {
  Page: pageDefinition,
  Modal: modalDefinition,
  PageSlot: pageSlotDefinition,
  Navigation: navigationDefinition,
  Container: containerDefinition,
  Text: textDefinition,
  Button: buttonDefinition,
  Image: imageDefinition,
  Chart: chartDefinition,
} satisfies Record<string, ComponentDefinition>;

export type RegisteredComponentType = keyof typeof componentDefinitions;

export function getComponentDefinition(type: string): ComponentDefinition | undefined {
  return componentDefinitions[type as RegisteredComponentType];
}

export function getDefaultPropsForType(type: string): Record<string, unknown> {
  return {
    ...(getComponentDefinition(type)?.defaults ?? {}),
    ...getDefaultDesignSystemPropsForType(type),
  };
}
