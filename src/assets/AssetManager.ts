import type {
  AssetId,
  AssetRecord,
  AssetRef,
  AssetStore,
} from "./AssetStore";

export class AssetManager {
  private readonly store: AssetStore;

  constructor(store: AssetStore) {
    this.store = store;
  }

  async uploadImage(file: File): Promise<AssetRef> {
    const mimeType = resolveImageMimeType(file);
    if (!mimeType) {
      throw new Error("Choose an image file (PNG, JPEG, WebP, GIF, AVIF or SVG)." );
    }

    return this.store.put({
      blob: file,
      metadata: {
        name: file.name || "image",
        mimeType,
        kind: "image",
      },
    });
  }

  get(assetId: AssetId): Promise<AssetRecord | null> {
    return this.store.get(assetId);
  }

  exists(assetId: AssetId): Promise<boolean> {
    return this.store.exists(assetId);
  }

  list(): Promise<AssetRef[]> {
    return this.store.list();
  }

  delete(assetId: AssetId): Promise<void> {
    return this.store.delete(assetId);
  }
}

function resolveImageMimeType(file: File): string | null {
  if (file.type.startsWith("image/")) {
    return file.type;
  }

  const extension = file.name.split(".").pop()?.toLowerCase();
  switch (extension) {
    case "png":
      return "image/png";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "webp":
      return "image/webp";
    case "gif":
      return "image/gif";
    case "avif":
      return "image/avif";
    case "svg":
      return "image/svg+xml";
    default:
      return null;
  }
}
