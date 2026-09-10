import { ImageIcon, Trash2, Upload } from "lucide-react";
import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { useAssetManager, useAssetUrl } from "../../assets";
import { Button, PanelCard } from "../ui";

export function ImageAssetPicker({
  assetId,
  onChange,
}: {
  assetId?: string | undefined;
  onChange(assetId: string | undefined): void;
}) {
  const manager = useAssetManager();
  const asset = useAssetUrl(assetId);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  async function upload(file: File | undefined) {
    if (!file) return;

    try {
      setUploading(true);
      setError(null);
      const storedAsset = await manager.uploadImage(file);
      onChange(storedAsset.id);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to store image.");
    } finally {
      setUploading(false);
      setDragging(false);
    }
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    void upload(file);
    event.target.value = "";
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    void upload(file);
  }

  const previewUrl = asset.assetId === assetId ? asset.url : null;

  return (
    <div className="space-y-2">
      <PanelCard
        className={`overflow-hidden p-0 transition ${
          dragging ? "border-[var(--editor-accent)] bg-[var(--editor-accent-soft)]" : ""
        }`}
      >
        <div
          data-editor-ignore
          className="relative flex min-h-28 items-center justify-center overflow-hidden"
          onDragEnter={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={(event) => {
            const relatedTarget = event.relatedTarget;
            if (
              !(relatedTarget instanceof Node) ||
              !event.currentTarget.contains(relatedTarget)
            ) {
              setDragging(false);
            }
          }}
          onDrop={handleDrop}
        >
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Selected asset preview"
              className="h-32 w-full object-contain bg-[var(--editor-surface-muted)]"
            />
          ) : (
            <button
              type="button"
              data-editor-ignore
              className="flex min-h-28 w-full flex-col items-center justify-center gap-2 px-4 py-5 text-center text-[var(--editor-text-muted)] transition hover:bg-[var(--editor-accent-soft)] hover:text-[var(--editor-accent)]"
              onClick={() => fileInputRef.current?.click()}
            >
              <ImageIcon size={24} strokeWidth={1.5} />
              <span className="text-xs font-medium">
                {assetId && asset.missing ? "Asset unavailable — replace image" : "Drop image or choose a file"}
              </span>
              <span className="text-[10px] text-[var(--editor-text-soft)]">
                PNG, JPEG, WebP, GIF, AVIF, SVG
              </span>
            </button>
          )}

          {dragging ? (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-[var(--editor-accent-soft)]/90 text-xs font-semibold text-[var(--editor-accent)]">
              Drop to upload
            </div>
          ) : null}
        </div>
      </PanelCard>

      <input
        ref={fileInputRef}
        data-editor-ignore
        type="file"
        accept="image/*,.svg"
        className="hidden"
        onChange={handleInputChange}
      />

      <div className="flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          className="flex-1"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload size={13} />
          {uploading ? "Uploading…" : assetId ? "Replace" : "Upload image"}
        </Button>
        {assetId ? (
          <Button
            variant="danger"
            size="icon"
            title="Remove image from component"
            aria-label="Remove image from component"
            disabled={uploading}
            onClick={() => {
              setError(null);
              onChange(undefined);
            }}
          >
            <Trash2 size={14} />
          </Button>
        ) : null}
      </div>

      {assetId ? (
        <div className="truncate font-mono text-[9px] text-[var(--editor-text-soft)]" title={assetId}>
          asset: {assetId}
        </div>
      ) : null}

      {error ? <div className="text-[10px] leading-4 text-red-600">{error}</div> : null}
    </div>
  );
}
