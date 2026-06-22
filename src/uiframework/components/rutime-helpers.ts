// runtime-events.ts

import { getWs } from "../websocket";


export function sendRuntimeEvent({
    event,
    nodeId,
}: {
    event: string;
    nodeId: string;
}) {
    getWs().send(
        JSON.stringify({
            event,
            nodeId,
        })
    );
}