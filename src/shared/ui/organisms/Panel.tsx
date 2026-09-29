import type { ReactNode } from "react";
import { Pressable } from "../atoms/Pressable";
import { Surface, type SurfaceVariant } from "../atoms/Surface";
import { cx } from "../utils/cx";

export type PanelCardVariant = "default" | "muted" | "accent" | "warning" | "danger";
export type PanelCardPadding = "none" | "sm" | "md" | "lg";

export type PanelCardProps = {
  children: ReactNode;
  className?: string | undefined;
  accent?: boolean | undefined;
  variant?: PanelCardVariant | undefined;
  padding?: PanelCardPadding | undefined;
};

const panelVariantMap: Record<PanelCardVariant, SurfaceVariant> = {
  default: "default",
  muted: "muted",
  accent: "accent",
  warning: "warning",
  danger: "danger",
};

export function PanelCard({
  children,
  className,
  accent = false,
  variant = "default",
  padding = "md",
}: PanelCardProps) {
  const resolvedVariant = accent ? "accent" : variant;
  return (
    <Surface
      variant={panelVariantMap[resolvedVariant]}
      border={resolvedVariant === "accent" ? "accent" : "default"}
      radius="md"
      padding={padding}
      className={cx(
        resolvedVariant === "warning" && "border-amber-200",
        resolvedVariant === "danger" && "border-red-200",
        className
      )}
    >
      {children}
    </Surface>
  );
}

export function PanelSection({
  children,
  className,
  divided = false,
}: {
  children: ReactNode;
  className?: string | undefined;
  divided?: boolean | undefined;
}) {
  return (
    <section
      className={cx(
        "space-y-3",
        divided && "border-t border-[var(--editor-border)] pt-5",
        className
      )}
    >
      {children}
    </section>
  );
}

export type EmptyActionProps = {
  children: ReactNode;
  onClick: () => void;
  className?: string | undefined;
};

export function EmptyAction({ children, onClick, className }: EmptyActionProps) {
  return (
    <Pressable
      onClick={onClick}
      className={cx(
        "flex w-full items-center gap-2 rounded-lg border border-dashed border-[var(--editor-border)] px-3 py-3 text-left text-xs text-[var(--editor-text-muted)] transition hover:border-[var(--editor-accent-border)] hover:bg-[var(--editor-accent-soft)] hover:text-[var(--editor-accent)]",
        className
      )}
    >
      {children}
    </Pressable>
  );
}
