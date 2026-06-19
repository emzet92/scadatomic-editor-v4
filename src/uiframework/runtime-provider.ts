// RuntimeProvider.tsx

import { useEffect } from "react";
import { useRuntimeStore } from "./runtime-store";

export function RuntimeProvider() {
    const updateValue =
        useRuntimeStore(
            (s) => s.updateValue
        );

    useEffect(() => {
        const ws = new WebSocket(
            "ws://localhost:8080/ws"
        );

        ws.onopen = () => {
            console.log(
                "WS connected"
            );
        };

        ws.onmessage = (event) => {
            const payload = JSON.parse(
                event.data
            );

            console.log(
                "I have message here:",
                payload
            );

            updateValue(
                payload.source,
                payload.value
            );
        };

        ws.onerror = (
            error
        ) => {
            console.error(
                error
            );
        };

        return () => {
            ws.close();
        };
    }, [updateValue]);

    return null;
}