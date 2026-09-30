import { createContext, useContext, type ReactNode } from "react";
import type { AlarmLibrary } from "../application/AlarmLibrary";

const AlarmLibraryContext = createContext<AlarmLibrary | null>(null);

export function AlarmLibraryProvider({ library, children }: { library: AlarmLibrary; children: ReactNode }) {
  return <AlarmLibraryContext.Provider value={library}>{children}</AlarmLibraryContext.Provider>;
}

export function useAlarmLibrary(): AlarmLibrary {
  const library = useContext(AlarmLibraryContext);
  if (!library) throw new Error("AlarmLibraryProvider is missing from the application composition root.");
  return library;
}
