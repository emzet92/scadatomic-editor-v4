let ws: WebSocket | null = null;

function getWebSocketUrl() {
  const protocol =
    window.location.protocol === "https:"
      ? "wss"
      : "ws";

  const host =
    window.location.hostname;

  const backendPort =
    "8080";

  return `${protocol}://${host}:${backendPort}/ws`;
}

export function getWs() {
  if (
    !ws ||
    ws.readyState === WebSocket.CLOSED
  ) {
    const url = getWebSocketUrl();

    console.log("Connecting WS:", url);

    ws = new WebSocket(url);

    ws.onopen = () => {
      console.log("WS connected");
    };

    ws.onclose = () => {
      console.log("WS closed");
    };

    ws.onerror = (error) => {
      console.error("WS error", error);
    };
  }

  return ws;
}