import { createContext } from "react";
import type { NavigationTreeNode } from "./navigation";

export type NavigationRuntimeContextValue = {
  items: NavigationTreeNode[];
  currentPageId?: string | undefined;
  navigateTo(path: string): void;
};

export const NavigationRuntimeContext =
  createContext<NavigationRuntimeContextValue | null>(null);
