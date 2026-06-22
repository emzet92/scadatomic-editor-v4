import { Text } from "../components/Text";
import { useRuntimeStore } from "../runtime-store";

type RuntimeTextProps = React.ComponentProps<typeof Text> & {
  tag?: string;
};

export function RuntimeText({
  tag,
  value,
  ...props
}: RuntimeTextProps) {
  const runtimeValue = useRuntimeStore(
    (state) => tag ? state.values[tag] : undefined
  );

  return (
    <Text
      {...props}
      value={
        runtimeValue !== undefined
          ? runtimeValue
          : value
      }
    />
  );
}