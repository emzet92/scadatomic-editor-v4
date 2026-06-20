// RuntimeProvider.tsx

import { useEffect } from "react";
import { useRuntimeStore } from "./runtime-store";
import { useEditorStore } from "./editor-store";
import { getWs } from "./websocket";

type Props = {
  onScreenUpdated?: () => void;
};

export function RuntimeProvider({
  onScreenUpdated,
}: Props) {
  const updateValue =
    useRuntimeStore(
      (s) => s.updateValue
    );

  useEffect(() => {
    const ws = getWs();

    const handleMessage = (
      event: MessageEvent
    ) => {
      try {
        const payload =
          JSON.parse(
            event.data
          );

        console.log(
          "WS message:",
          payload
        );

        //
        // Screen deployment
        //
        if (
          payload.event ===
          "screen.publish"
        ) {
          console.log(
            "Screen updated"
          );

          useEditorStore
            .getState()
            .setNodes(
              payload.nodes
            );

          onScreenUpdated?.();

          return;
        }

        //
        // Node property update
        //
        if (
          payload.event ===
          "node.update"
        ) {
          useEditorStore
            .getState()
            .updateNode(
              payload.nodeId,
              (node) => ({
                ...node,
                props: {
                  ...node.props,
                  [payload.property]:
                    payload.value,
                },
              })
            );

          return;
        }

        //
        // Runtime tag update
        //
        if (
          payload.source !==
          undefined
        ) {
          updateValue(
            payload.source,
            payload.value
          );

          return;
        }
      } catch (error) {
        console.error(
          "Failed to parse WS message",
          error
        );
      }
    };

    ws.addEventListener(
      "message",
      handleMessage
    );

    return () => {
      ws.removeEventListener(
        "message",
        handleMessage
      );
    };
  }, [
    updateValue,
    onScreenUpdated,
  ]);

  return null;
}