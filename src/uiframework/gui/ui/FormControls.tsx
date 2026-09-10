import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
} from "react";
import { cx } from "./cx";

export type ControlSize = "sm" | "md";

type SharedControlProps = {
  controlSize?: ControlSize | undefined;
  invalid?: boolean | undefined;
  mono?: boolean | undefined;
};

const controlSizeClassNames: Record<ControlSize, string> = {
  sm: "h-8 px-2.5 text-xs",
  md: "h-9 px-3 text-sm",
};

export type TextInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "size"
> &
  SharedControlProps;

export function TextInput({
  controlSize = "md",
  invalid = false,
  mono = false,
  className,
  ...props
}: TextInputProps) {
  return (
    <input
      data-editor-ignore
      aria-invalid={invalid || undefined}
      className={cx(
        "w-full rounded-md border bg-[var(--editor-surface)] text-[var(--editor-text)] outline-none transition placeholder:text-[var(--editor-text-soft)] focus:ring-2 focus:ring-[var(--editor-accent-soft)] disabled:cursor-not-allowed disabled:opacity-50",
        invalid
          ? "border-red-400 focus:border-red-500"
          : "border-[var(--editor-border)] focus:border-[var(--editor-accent)]",
        controlSizeClassNames[controlSize],
        mono && "font-mono",
        className
      )}
      {...props}
    />
  );
}

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement> &
  SharedControlProps;

export function Select({
  controlSize = "md",
  invalid = false,
  mono = false,
  className,
  ...props
}: SelectProps) {
  return (
    <select
      data-editor-ignore
      aria-invalid={invalid || undefined}
      className={cx(
        "w-full rounded-md border bg-[var(--editor-surface)] text-[var(--editor-text)] outline-none transition focus:ring-2 focus:ring-[var(--editor-accent-soft)] disabled:cursor-not-allowed disabled:opacity-50",
        invalid
          ? "border-red-400 focus:border-red-500"
          : "border-[var(--editor-border)] focus:border-[var(--editor-accent)]",
        controlSizeClassNames[controlSize],
        mono && "font-mono",
        className
      )}
      {...props}
    />
  );
}

export type CheckboxProps = InputHTMLAttributes<HTMLInputElement>;

export function Checkbox({ className, ...props }: CheckboxProps) {
  return (
    <input
      data-editor-ignore
      type="checkbox"
      className={cx(
        "size-4 rounded border-[var(--editor-border-strong)] text-[var(--editor-accent)] focus:ring-[var(--editor-accent-soft)]",
        className
      )}
      {...props}
    />
  );
}

type FormFieldProps = {
  label: ReactNode;
  children: ReactNode;
  description?: ReactNode | undefined;
  error?: ReactNode | undefined;
  className?: string | undefined;
  compact?: boolean | undefined;
};

export function FormField({
  label,
  children,
  description,
  error,
  className,
  compact = false,
}: FormFieldProps) {
  return (
    <label className={cx("block space-y-1.5", className)}>
      <span
        className={cx(
          compact
            ? "block text-[9px] font-semibold uppercase tracking-wide text-[var(--editor-text-muted)]"
            : "block text-xs font-medium text-[var(--editor-text-muted)]"
        )}
      >
        {label}
      </span>
      {children}
      {error ? (
        <span className="block text-[10px] leading-4 text-red-600">{error}</span>
      ) : description ? (
        <span className="block text-[10px] leading-4 text-[var(--editor-text-soft)]">
          {description}
        </span>
      ) : null}
    </label>
  );
}
