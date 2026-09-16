import {
  useEffect,
  useId,
  useRef,
  type ReactNode,
  type RefObject,
} from "react";
import { X } from "lucide-react";
import { Button } from "../atoms/Button";
import { Icon } from "../atoms/Icon";
import { Box, Inline, Stack } from "../atoms/Layout";
import { Overlay } from "../atoms/Overlay";
import { Surface } from "../atoms/Surface";
import { Heading, Text } from "../atoms/Typography";
import { cx } from "../utils/cx";

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
    <Overlay
      data-editor-ignore
      fixed
      center
      className="z-[100] p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <Surface
        role={role}
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        radius="lg"
        padding="none"
        shadow="md"
        className={cx("flex max-h-[82vh] w-full flex-col overflow-hidden", sizeClassNames[size])}
      >
        <Inline align="start" gap="md" className="shrink-0 border-b border-[var(--editor-border)] p-4">
          {icon ? <Box className="shrink-0">{icon}</Box> : null}
          <Stack gap="none" className="min-w-0 flex-1">
            <Heading id={titleId} level={2} size="sm">{title}</Heading>
            {description ? (
              <Text id={descriptionId} as="p" variant="body-sm" tone="muted" className="mt-1">
                {description}
              </Text>
            ) : null}
          </Stack>
          <Button ref={closeRef} variant="ghost" aria-label="Close dialog" title="Close" size="icon-xs" onClick={onClose}>
            <Icon glyph={X} size="sm" />
          </Button>
        </Inline>

        {children ? <Box className="min-h-0 flex-1 overflow-auto p-4">{children}</Box> : null}

        {footer ? (
          <Inline justify="end" className="shrink-0 border-t border-[var(--editor-border)] p-3">
            {footer}
          </Inline>
        ) : null}
      </Surface>
    </Overlay>
  );
}
