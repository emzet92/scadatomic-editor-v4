// components/RuntimeButton.tsx

import { getWs } from "../websocket";
import { Button } from "./Button";

export function RuntimeButton({
  id,
  onClickEvent,
  ...props
}) {
  return (
    <Button
      {...props}
      onClick={
        onClickEvent
          ? () => {
              getWs().send(
                JSON.stringify({
                  event:
                    onClickEvent,
                  nodeId: id,
                })
              );
            }
          : undefined
      }
    />
  );
}