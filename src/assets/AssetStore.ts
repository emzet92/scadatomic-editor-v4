export type AssetId = string;

export type AssetKind = "image";

export type AssetMetadata = {
  name: string;
  mimeType: string;
  size: number;
  kind: AssetKind;
};

export type AssetRef = AssetMetadata & {
  id: AssetId;
};

export type AssetRecord = AssetRef & {
  blob: Blob;
  createdAt: number;
};

export type PutAssetInput = {
  id?: AssetId | undefined;
  blob: Blob;
  metadata: Omit<AssetMetadata, "size">;
};

/**
 * Persistence boundary for project assets.
 *
 * The designer currently uses IndexedDB, but renderers and editor controls only
 * depend on this contract through AssetManager. A future cloud/CDN store can
 * implement the same interface without changing Image nodes.
 */
export interface AssetStore {
  put(input: PutAssetInput): Promise<AssetRef>;
  get(assetId: AssetId): Promise<AssetRecord | null>;
  delete(assetId: AssetId): Promise<void>;
  exists(assetId: AssetId): Promise<boolean>;
  list(): Promise<AssetRef[]>;
}
