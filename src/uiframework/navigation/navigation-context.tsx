import { createContext, useContext } from "react";
import type { NavigationTreeNode } from "./navigation";

export type NavigationRuntimeContextValue = {
  items: NavigationTreeNode[];
  currentPageId?: string | undefined;
  navigateTo(path: string): void;
};

const NavigationRuntimeContext = createContext<NavigationRuntimeContextValue | null>(null);

export function NavigationRuntimeProvider({
  value,
  children,
}: React.PropsWithChildren<{ value: NavigationRuntimeContextValue }>) {
  return (
    <NavigationRuntimeContext.Provider value={value}>
      {children}
    </NavigationRuntimeContext.Provider>
  );
}

export function useNavigationRuntime() {
  return useContext(NavigationRuntimeContext);
}
