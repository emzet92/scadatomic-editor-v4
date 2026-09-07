let ws: WebSocket | null = null;
let reconnectTimer: number | null = null;
const pendingMessages: string[] = [];

function getWebSocketUrl() {
  const protocol = window.location.protocol === "https:" ? "wss" : "ws";
  const host = window.location.hostname;
  return `${protocol}://${host}:8080/ws`;
}

export function getWs() {
  if (
    !ws ||
    ws.readyState === WebSocket.CLOSED ||
    ws.readyState === WebSocket.CLOSING
  ) {
    connect();
  }

  return ws!;
}

export function sendWsMessage(payload: unknown) {
  const message = JSON.stringify(payload);
  const socket = getWs();

  if (socket.readyState === WebSocket.OPEN) {
    socket.send(message);
    return;
  }

  pendingMessages.push(message);
}

function connect() {
  const url = getWebSocketUrl();
  ws = new WebSocket(url);

  ws.addEventListener("open", () => {
    if (reconnectTimer !== null) {
      window.clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }

    while (pendingMessages.length > 0 && ws?.readyState === WebSocket.OPEN) {
      const message = pendingMessages.shift();
      if (message) {
        ws.send(message);
      }
    }
  });

  ws.addEventListener("close", () => {
    if (reconnectTimer !== null) {
      return;
    }

    reconnectTimer = window.setTimeout(() => {
      reconnectTimer = null;
      connect();
    }, 1000);
  });

  ws.addEventListener("error", (error) => {
    console.error("WS error", error);
  });
}
