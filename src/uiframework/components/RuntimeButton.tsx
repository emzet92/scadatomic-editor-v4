import type { HandlerRef } from "../core/document";
import { Button } from "./Button";
import { sendRuntimeEvent } from "./runtime-helpers";

type RuntimeButtonProps = React.ComponentProps<typeof Button> & {
  runtimeEvents?: Record<string, HandlerRef>;
  runtimeProjectId?: string | undefined;
  runtimePageId?: string | undefined;
  "data-node-id"?: string;
};

export function RuntimeButton({
  runtimeEvents,
  runtimeProjectId,
  runtimePageId,
  "data-node-id": nodeId,
  ...props
}: RuntimeButtonProps) {
  function executeEvent(eventName: string) {
    const handlerId = runtimeEvents?.[eventName]?.handlerId;
    if (!handlerId || !nodeId || !runtimeProjectId) {
      return;
    }

    sendRuntimeEvent({
      handlerId,
      eventName,
      nodeId,
      projectId: runtimeProjectId,
      pageId: runtimePageId,
    });
  }

  return (
    <Button
      {...props}
      data-node-id={nodeId}
      onClick={() => executeEvent("click")}
      onDoubleClick={() => executeEvent("doubleClick")}
    />
  );
}
