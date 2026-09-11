import {
  useEffect,
  useId,
  useRef,
  type ReactNode,
  type RefObject,
} from "react";
import { X } from "lucide-react";
import { Button } from "./Button";
import { cx } from "./cx";

export type DialogSize = "sm" | "md" | "lg";

export type DialogProps = {
  open: boolean;
  title: ReactNode;
  description?: ReactNode | undefined;
  children?: ReactNode | undefined;
  footer?: ReactNode | undefined;
  icon?: ReactNode | undefined;
  size?: DialogSize | undefined;
  role?: "dialog" | "alertdialog" | undefined;
  initialFocusRef?: RefObject<HTMLElement | null> | undefined;
  onClose(): void;
};

const sizeClassNames: Record<DialogSize, string> = {
  sm: "max-w-sm",
  md: "max-w-xl",
  lg: "max-w-3xl",
};

export function Dialog({
  open,
  title,
  description,
  children,
  footer,
  icon,
  size = "md",
  role = "dialog",
  initialFocusRef,
  onClose,
}: DialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    const previousActiveElement = document.activeElement as HTMLElement | null;
    const frame = requestAnimationFrame(() => {
      (initialFocusRef?.current ?? closeRef.current)?.focus();
    });

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("keydown", handleKeyDown);
      previousActiveElement?.focus();
    };
  }, [initialFocusRef, onClose, open]);

  if (!open) return null;

  return (
    <div
      data-editor-ignore
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/35 p-4 backdrop-blur-[1px]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role={role}
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className={cx(
          "flex max-h-[82vh] w-full flex-col overflow-hidden rounded-xl border border-[var(--editor-border)] bg-[var(--editor-surface)] shadow-2xl",
          sizeClassNames[size]
        )}
      >
        <div className="flex shrink-0 items-start gap-3 border-b border-[var(--editor-border)] p-4">
          {icon ? <div className="shrink-0">{icon}</div> : null}
          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="text-sm font-semibold text-[var(--editor-text)]">
              {title}
            </h2>
            {description ? (
              <p
                id={descriptionId}
                className="mt-1 text-xs leading-5 text-[var(--editor-text-muted)]"
              >
                {description}
              </p>
            ) : null}
          </div>
          <Button
            ref={closeRef}
            variant="ghost"
            aria-label="Close dialog"
            title="Close"
            size="icon-xs"
            onClick={onClose}
          >
            <X size={13} />
          </Button>
        </div>

        {children ? (
          <div className="min-h-0 flex-1 overflow-auto p-4">{children}</div>
        ) : null}

        {footer ? (
          <div className="flex shrink-0 items-center justify-end gap-2 border-t border-[var(--editor-border)] p-3">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
