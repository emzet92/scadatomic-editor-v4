// websocket.ts

let ws: WebSocket | null = null;

export function getWs() {
  if (!ws) {
    ws = new WebSocket(
      "ws://localhost:8080/ws"
    );

    ws.onopen = () =>
      console.log(
        "WS connected"
      );

    ws.onclose = () =>
      console.log(
        "WS closed"
      );

    ws.onerror = (e) =>
      console.log(
        "WS error",
        e
      );
  }

  return ws;
}