import { createContext, useContext, type ReactNode } from "react";
import type { ProcessLibrary } from "../application/ProcessLibrary";

const ProcessLibraryContext = createContext<ProcessLibrary | null>(null);

export function ProcessLibraryProvider({
  library,
  children,
}: {
  library: ProcessLibrary;
  children: ReactNode;
}) {
  return (
    <ProcessLibraryContext.Provider value={library}>
      {children}
    </ProcessLibraryContext.Provider>
  );
}

export function useProcessLibrary(): ProcessLibrary {
  const library = useContext(ProcessLibraryContext);
  if (!library) {
    throw new Error("ProcessLibraryProvider is missing from the application composition root.");
  }
  return library;
}
