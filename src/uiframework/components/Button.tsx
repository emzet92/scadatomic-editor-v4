type ButtonProps =
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    label?: string;
  };

export function Button({
  label,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      className="
        inline-flex
        items-center
        justify-center
        gap-2
        h-9
        px-4

        rounded-md

        bg-sky-600
        hover:bg-sky-500

        text-white
        text-sm
        font-medium

        transition-colors

        disabled:opacity-50
        disabled:pointer-events-none
      "
    >
      {String(label ?? "Button")}
    </button>
  );
}