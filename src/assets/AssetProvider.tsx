import { useMemo, type ReactNode } from "react";
import { AssetManager } from "./AssetManager";
import { IndexedDbAssetStore } from "./IndexedDbAssetStore";
import { AssetManagerContext } from "./asset-manager-context";

export function AssetProvider({
  children,
  manager,
}: {
  children: ReactNode;
  manager?: AssetManager | undefined;
}) {
  const resolvedManager = useMemo(
    () => manager ?? new AssetManager(new IndexedDbAssetStore()),
    [manager]
  );

  return (
    <AssetManagerContext.Provider value={resolvedManager}>
      {children}
    </AssetManagerContext.Provider>
  );
}
