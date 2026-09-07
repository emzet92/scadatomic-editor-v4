import type { HandlerRef } from "../core/document";
import { Button } from "./Button";
import { sendRuntimeEvent } from "./runtime-helpers";

type RuntimeButtonProps = React.ComponentProps<typeof Button> & {
  runtimeEvents?: Record<string, HandlerRef>;
  runtimeProjectId?: string | undefined;
  "data-node-id"?: string;
};

export function RuntimeButton({
  runtimeEvents,
  runtimeProjectId,
  "data-node-id": nodeId,
  ...props
}: RuntimeButtonProps) {
  return (
    <Button
      {...props}
      data-node-id={nodeId}
      onClick={() => {
        const handlerId = runtimeEvents?.click?.handlerId;
        if (!handlerId || !nodeId) {
          return;
        }

        sendRuntimeEvent({
          event: handlerId,
          nodeId,
          projectId: runtimeProjectId,
        });
      }}
      onDoubleClick={() => {
        const handlerId = runtimeEvents?.doubleClick?.handlerId;
        if (!handlerId || !nodeId) {
          return;
        }

        sendRuntimeEvent({
          event: handlerId,
          nodeId,
          projectId: runtimeProjectId,
        });
      }}
    />
  );
}
