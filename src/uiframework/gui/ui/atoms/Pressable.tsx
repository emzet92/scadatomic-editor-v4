import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cx } from "../utils/cx";

export type PressableProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  focusRing?: boolean | undefined;
};

export const Pressable = forwardRef<HTMLButtonElement, PressableProps>(function Pressable(
  { type = "button", focusRing = true, className, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      data-editor-ignore
      type={type}
      className={cx(
        "disabled:pointer-events-none disabled:opacity-50",
        focusRing && "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--editor-accent-soft)]",
        className
      )}
      {...props}
    />
  );
});
