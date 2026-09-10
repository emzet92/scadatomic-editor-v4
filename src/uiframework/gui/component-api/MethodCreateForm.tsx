import { X } from "lucide-react";
import { Button, IconButton, PanelCard, TextInput } from "../ui";

type MethodCreateFormProps = {
  title?: string | undefined;
  value: string;
  error: string | null;
  hint: string;
  disabled?: boolean | undefined;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  className?: string | undefined;
};

export function MethodCreateForm({
  title = "New method",
  value,
  error,
  hint,
  disabled = false,
  onChange,
  onSubmit,
  onCancel,
  className,
}: MethodCreateFormProps) {
  return (
    <PanelCard className={className}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="text-xs font-medium text-[var(--editor-text)]">{title}</div>
        <IconButton
          size="icon-xs"
          aria-label="Cancel adding method"
          title="Cancel"
          onClick={onCancel}
        >
          <X size={13} />
        </IconButton>
      </div>

      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <div className="relative">
            <TextInput
              autoFocus
              controlSize="sm"
              mono
              value={value}
              placeholder="enable"
              spellCheck={false}
              autoComplete="off"
              disabled={disabled}
              invalid={!!error}
              onChange={(event) => onChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  onSubmit();
                }
                if (event.key === "Escape") {
                  event.preventDefault();
                  onCancel();
                }
              }}
              className="pr-7"
            />
            <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 font-mono text-xs text-[var(--editor-text-soft)]">
              ()
            </span>
          </div>

          {error ? (
            <div className="mt-1 text-[11px] leading-4 text-red-600">{error}</div>
          ) : (
            <div className="mt-1 truncate text-[10px] text-[var(--editor-text-soft)]">
              {hint}
            </div>
          )}
        </div>

        <Button
          variant="primary"
          size="sm"
          disabled={disabled}
          onClick={onSubmit}
          className="text-[11px] font-semibold"
        >
          Add
        </Button>
      </div>
    </PanelCard>
  );
}
