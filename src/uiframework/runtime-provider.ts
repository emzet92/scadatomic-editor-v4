import { useEffect } from "react";

import { useEditorStore } from "./editor-store";
import { useRuntimeStore } from "./runtime-store";
import { getWs } from "./websocket";

type RuntimeProviderProps = {
  onScreenUpdated?: () => void;
  onNodeUpdated?: () => void;
};

export function RuntimeProvider({
  onScreenUpdated,
  onNodeUpdated,
}: RuntimeProviderProps) {
  const updateValue = useRuntimeStore(
    (state) => state.updateValue
  );

  useEffect(() => {
    const ws = getWs();

    const handleMessage = (
      event: MessageEvent
    ) => {
      try {
        const payload =
          JSON.parse(event.data);

        console.log(
          "WS message:",
          payload
        );

        //
        // Publish screen from editor to runtime
        //
        if (
          payload.event ===
          "screen.publish"
        ) {
          if (!payload.nodes) {
            console.warn(
              "screen.publish without nodes",
              payload
            );

            return;
          }

          useEditorStore
            .getState()
            .setNodes(payload.nodes);

          onScreenUpdated?.();

          return;
        }

        //
        // Runtime script / backend can update one node prop
        //
        if (
          payload.event ===
          "node.update"
        ) {
          if (
            !payload.nodeId ||
            !payload.property
          ) {
            console.warn(
              "node.update without nodeId/property",
              payload
            );

            return;
          }

          useEditorStore
            .getState()
            .updateNode(
              payload.nodeId,
              (node) => ({
                ...node,
                props: {
                  ...(node.props ?? {}),
                  [payload.property]:
                    payload.value,
                },
              })
            );

          onNodeUpdated?.();

          return;
        }

        //
        // Signal value update
        //
        // Supports both:
        // { source: "station1.tank.levelLiters", value: 123 }
        // { tag: "station1.tank.levelLiters", value: 123 }
        //
        const signalTag =
          payload.source ??
          payload.tag;

        if (
          signalTag !== undefined
        ) {
          console.log(
            "Runtime signal:",
            signalTag,
            payload.value
          );

          updateValue(
            String(signalTag),
            payload.value
          );

          return;
        }

        console.warn(
          "Unhandled WS payload:",
          payload
        );
      } catch (error) {
        console.error(
          "Failed to parse WS message",
          error,
          event.data
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

      //
      // Important:
      // do NOT close ws here.
      // It is a shared singleton used also by toolbar/publish.
      //
    };
  }, [
    updateValue,
    onScreenUpdated,
    onNodeUpdated,
  ]);

  return null;
}