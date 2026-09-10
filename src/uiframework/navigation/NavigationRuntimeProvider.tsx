import type { PropsWithChildren } from "react";
import {
  NavigationRuntimeContext,
  type NavigationRuntimeContextValue,
} from "./navigation-runtime-context";

export function NavigationRuntimeProvider({
  value,
  children,
}: PropsWithChildren<{ value: NavigationRuntimeContextValue }>) {
  return (
    <NavigationRuntimeContext.Provider value={value}>
      {children}
    </NavigationRuntimeContext.Provider>
  );
}
