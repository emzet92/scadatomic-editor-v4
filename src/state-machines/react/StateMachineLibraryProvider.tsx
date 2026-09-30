import { createContext, useContext, type PropsWithChildren } from "react";
import type { StateMachineLibrary } from "../application/StateMachineLibrary";

const Context = createContext<StateMachineLibrary | null>(null);

export function StateMachineLibraryProvider({ children, library }: PropsWithChildren<{ library: StateMachineLibrary }>) {
  return <Context.Provider value={library}>{children}</Context.Provider>;
}

export function useStateMachineLibrary() {
  const library = useContext(Context);
  if (!library) throw new Error("StateMachineLibraryProvider is missing.");
  return library;
}
