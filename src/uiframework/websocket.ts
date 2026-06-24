let ws: WebSocket | null = null;

function getWebSocketUrl() {
  const protocol =
    window.location.protocol === "https:"
      ? "wss"
      : "ws";

  const host =
    window.location.hostname;

  return `${protocol}://${host}:8080/ws`;
}

export function getWs() {
  if (
    !ws ||
    ws.readyState === WebSocket.CLOSED ||
    ws.readyState === WebSocket.CLOSING
  ) {
    const url =
      getWebSocketUrl();

    console.log(
      "Connecting WS:",
      url
    );

    ws = new WebSocket(url);

    ws.onopen = () =>
      console.log("WS connected");

    ws.onclose = (event) =>
      console.log(
        "WS closed",
        event.code,
        event.reason
      );

    ws.onerror = (error) =>
      console.error(
        "WS error",
        error
      );
  }

  return ws;
}