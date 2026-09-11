import { AlertTriangle } from "lucide-react";
import { useRef } from "react";
import { Button } from "./Button";
import { Dialog } from "./Dialog";

export type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string | undefined;
  cancelLabel?: string | undefined;
  destructive?: boolean | undefined;
  onConfirm(): void;
  onCancel(): void;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  return (
    <Dialog
      open={open}
      role="alertdialog"
      size="sm"
      title={title}
      description={description}
      onClose={onCancel}
      initialFocusRef={cancelRef}
      icon={
        <div className="flex size-8 items-center justify-center rounded-full bg-red-50 text-[var(--editor-danger)]">
          <AlertTriangle size={16} />
        </div>
      }
      footer={
        <>
          <Button ref={cancelRef} variant="secondary" size="sm" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button
            variant={destructive ? "danger" : "primary"}
            size="sm"
            className={
              destructive
                ? "border border-red-200 bg-red-50 text-[var(--editor-danger)] hover:bg-red-100"
                : undefined
            }
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </>
      }
    />
  );
}
