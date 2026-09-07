import type { Binding } from "../core/document";
import { useRuntimeSignal } from "../runtime-signals";
import { Text } from "./Text";

type RuntimeTextProps = React.ComponentProps<typeof Text> & {
  runtimeBindings?: Record<string, Binding>;
};

export function RuntimeText({
  runtimeBindings,
  value,
  ...props
}: RuntimeTextProps) {
  const valueBinding = runtimeBindings?.value;
  const runtimeValue = useRuntimeSignal(
    valueBinding?.kind === "tag" ? valueBinding.path : undefined
  );

  const displayValue =
    runtimeValue === undefined
      ? value
      : typeof runtimeValue === "string" || typeof runtimeValue === "number"
        ? runtimeValue
        : String(runtimeValue ?? "");

  return (
    <Text
      {...props}
      {...(displayValue === undefined ? {} : { value: displayValue })}
    />
  );
}
