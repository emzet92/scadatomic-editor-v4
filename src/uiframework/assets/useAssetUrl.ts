import { useEffect, useState } from "react";
import { useAssetManager } from "./asset-manager-context";

export type AssetUrlState = {
  assetId: string | undefined;
  url: string | null;
  missing: boolean;
};

export function useAssetUrl(assetId: string | undefined): AssetUrlState {
  const manager = useAssetManager();
  const [state, setState] = useState<AssetUrlState>({
    assetId: undefined,
    url: null,
    missing: false,
  });

  useEffect(() => {
    if (!assetId) return;

    let disposed = false;
    let objectUrl: string | null = null;

    void manager.get(assetId).then((record) => {
      if (disposed) return;

      if (!record) {
        setState({ assetId, url: null, missing: true });
        return;
      }

      objectUrl = URL.createObjectURL(record.blob);
      setState({ assetId, url: objectUrl, missing: false });
    }).catch(() => {
      if (!disposed) {
        setState({ assetId, url: null, missing: true });
      }
    });

    return () => {
      disposed = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [assetId, manager]);

  if (!assetId) {
    return { assetId: undefined, url: null, missing: false };
  }

  if (state.assetId !== assetId) {
    return { assetId, url: null, missing: false };
  }

  return state;
}
