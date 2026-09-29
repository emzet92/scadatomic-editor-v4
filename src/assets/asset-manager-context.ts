import { createContext, useContext } from "react";
import type { AssetManager } from "./AssetManager";

export const AssetManagerContext = createContext<AssetManager | null>(null);

export function useAssetManager(): AssetManager {
  const manager = useContext(AssetManagerContext);
  if (!manager) {
    throw new Error("useAssetManager must be used inside AssetProvider.");
  }
  return manager;
}
