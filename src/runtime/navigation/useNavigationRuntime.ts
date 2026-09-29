import { useContext } from "react";
import { NavigationRuntimeContext } from "./navigation-runtime-context";

export function useNavigationRuntime() {
  return useContext(NavigationRuntimeContext);
}
