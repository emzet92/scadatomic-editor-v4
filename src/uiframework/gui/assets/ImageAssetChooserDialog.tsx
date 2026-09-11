import { Check, ImageIcon, Images, Upload } from "lucide-react";
import { useMemo, useState } from "react";
import type { AssetRef } from "../../assets";
import { useAssetUrl } from "../../assets";
import { Button, Dialog, EmptyAction, cx } from "../ui";

export type ImageAssetChooserDialogProps = {
  open: boolean;
  assets: AssetRef[];
  loading: boolean;
  error?: string | null | undefined;
  currentAssetId?: string | undefined;
  onChoose(assetId: string): void;
  onClose(): void;
  onRetry?(): void;
  onUploadRequest?(): void;
};

export function ImageAssetChooserDialog({
  open,
  assets,
  loading,
  error,
  currentAssetId,
  onChoose,
  onClose,
  onRetry,
  onUploadRequest,
}: ImageAssetChooserDialogProps) {
  const [selectedAssetId, setSelectedAssetId] = useState<string | undefined>(
    currentAssetId
  );

  const selectedAsset = useMemo(
    () => assets.find((asset) => asset.id === selectedAssetId),
    [assets, selectedAssetId]
  );

  return (
    <Dialog
      open={open}
      size="lg"
      title="Choose image asset"
      description="Reuse an image already stored in this browser. Selecting it does not duplicate the binary file."
      onClose={onClose}
      icon={
        <div className="flex size-8 items-center justify-center rounded-lg bg-[var(--editor-accent-soft)] text-[var(--editor-accent)]">
          <Images size={16} />
        </div>
      }
      footer={
        <>
          <div className="mr-auto min-w-0 truncate text-[10px] text-[var(--editor-text-soft)]">
            {selectedAsset ? selectedAsset.name : `${assets.length} asset${assets.length === 1 ? "" : "s"}`}
          </div>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            disabled={!selectedAsset}
            onClick={() => {
              if (!selectedAsset) return;
              onChoose(selectedAsset.id);
              onClose();
            }}
          >
            <Check size={13} />
            Use asset
          </Button>
        </>
      }
    >
      {loading ? (
        <div className="flex min-h-48 items-center justify-center text-xs text-[var(--editor-text-muted)]">
          Loading assets…
        </div>
      ) : error ? (
        <div className="space-y-3">
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs leading-5 text-red-700">
            {error}
          </div>
          {onRetry ? (
            <Button variant="secondary" size="sm" onClick={onRetry}>
              Try again
            </Button>
          ) : null}
        </div>
      ) : assets.length === 0 ? (
        <EmptyAction
          className="min-h-48 justify-center"
          onClick={() => {
            onClose();
            onUploadRequest?.();
          }}
        >
          <Upload size={16} />
          <span>
            <span className="block font-medium">No image assets yet</span>
            <span className="mt-0.5 block text-[10px] text-[var(--editor-text-soft)]">
              Upload an image once, then reuse it anywhere in the project.
            </span>
          </span>
        </EmptyAction>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {assets.map((asset) => (
            <AssetTile
              key={asset.id}
              asset={asset}
              selected={asset.id === selectedAssetId}
              onSelect={() => setSelectedAssetId(asset.id)}
              onChoose={() => {
                onChoose(asset.id);
                onClose();
              }}
            />
          ))}
        </div>
      )}
    </Dialog>
  );
}

function AssetTile({
  asset,
  selected,
  onSelect,
  onChoose,
}: {
  asset: AssetRef;
  selected: boolean;
  onSelect(): void;
  onChoose(): void;
}) {
  const preview = useAssetUrl(asset.id);

  return (
    <button
      type="button"
      data-editor-ignore
      title={asset.name}
      aria-pressed={selected}
      className={cx(
        "group overflow-hidden rounded-lg border bg-[var(--editor-surface)] text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--editor-accent-soft)]",
        selected
          ? "border-[var(--editor-accent)] ring-1 ring-[var(--editor-accent)]"
          : "border-[var(--editor-border)] hover:border-[var(--editor-accent-border)]"
      )}
      onClick={onSelect}
      onDoubleClick={onChoose}
    >
      <div className="relative flex aspect-square items-center justify-center overflow-hidden bg-[var(--editor-surface-muted)]">
        {preview.url ? (
          <img
            src={preview.url}
            alt=""
            className="size-full object-contain"
            draggable={false}
          />
        ) : (
          <ImageIcon size={22} className="text-[var(--editor-text-soft)]" />
        )}
        {selected ? (
          <div className="absolute right-1.5 top-1.5 flex size-5 items-center justify-center rounded-full bg-[var(--editor-accent)] text-white shadow-sm">
            <Check size={12} />
          </div>
        ) : null}
      </div>
      <div className="min-w-0 px-2 py-1.5">
        <div className="truncate text-[10px] font-medium text-[var(--editor-text)]">
          {asset.name}
        </div>
        <div className="mt-0.5 truncate text-[9px] text-[var(--editor-text-soft)]">
          {formatFileSize(asset.size)}
        </div>
      </div>
    </button>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kilobytes = bytes / 1024;
  if (kilobytes < 1024) return `${kilobytes.toFixed(kilobytes < 10 ? 1 : 0)} KB`;
  const megabytes = kilobytes / 1024;
  return `${megabytes.toFixed(megabytes < 10 ? 1 : 0)} MB`;
}
