// RuntimeProvider.tsx

import { useEffect } from "react";
import { useRuntimeStore } from "./runtime-store";
import { getWs } from "./websocket";

export function RuntimeProvider() {
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

        if (
          payload.source !==
          undefined
        ) {
          updateValue(
            payload.source,
            payload.value
          );
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
  }, [updateValue]);

  return null;
}