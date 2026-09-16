import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Pressable } from "./Pressable";
import { cx } from "../utils/cx";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "text";
export type ButtonSize = "xs" | "sm" | "md" | "icon-xs" | "icon-sm" | "icon";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant | undefined;
  size?: ButtonSize | undefined;
  leadingIcon?: ReactNode | undefined;
  trailingIcon?: ReactNode | undefined;
};

const variantClassNames: Record<ButtonVariant, string> = {
  primary: "bg-[var(--editor-accent)] text-white hover:bg-[var(--editor-accent-hover)]",
  secondary:
    "border border-[var(--editor-border)] bg-[var(--editor-surface)] text-[var(--editor-text)] hover:border-[var(--editor-accent-border)] hover:bg-[var(--editor-accent-soft)]",
  ghost:
    "text-[var(--editor-text-muted)] hover:bg-[var(--editor-surface-muted)] hover:text-[var(--editor-text)]",
  danger: "text-[var(--editor-text-muted)] hover:bg-red-50 hover:text-[var(--editor-danger)]",
  text: "text-[var(--editor-accent)] hover:bg-[var(--editor-accent-soft)]",
};

const sizeClassNames: Record<ButtonSize, string> = {
  xs: "h-7 px-2 text-[11px]",
  sm: "h-8 px-2.5 text-xs",
  md: "h-9 px-3 text-sm",
  "icon-xs": "size-6",
  "icon-sm": "size-7",
  icon: "size-8",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "secondary",
    size = "sm",
    leadingIcon,
    trailingIcon,
    children,
    className,
    type = "button",
    ...props
  },
  ref
) {
  return (
    <Pressable
      ref={ref}
      type={type}
      className={cx(
        "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-md font-medium transition focus-visible:ring-[var(--editor-accent-soft)]",
        variantClassNames[variant],
        sizeClassNames[size],
        className
      )}
      {...props}
    >
      {leadingIcon}
      {children}
      {trailingIcon}
    </Pressable>
  );
});

export type IconButtonProps = Omit<ButtonProps, "children" | "aria-label" | "leadingIcon" | "trailingIcon"> & {
  "aria-label": string;
  children: ReactNode;
};

export function IconButton({
  variant = "ghost",
  size = "icon-sm",
  title,
  "aria-label": ariaLabel,
  ...props
}: IconButtonProps) {
  return (
    <Button
      variant={variant}
      size={size}
      aria-label={ariaLabel}
      title={title ?? ariaLabel}
      {...props}
    />
  );
}
