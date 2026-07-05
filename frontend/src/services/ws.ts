let wsInstance: WebSocket | null = null;

export function getWebSocket(): WebSocket | null {
  if (wsInstance && wsInstance.readyState === WebSocket.OPEN) {
    return wsInstance;
  }

  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
  const host = window.location.host;
  const socket = new WebSocket(`${protocol}://${host}/ws`);

  socket.onopen = () => {
    console.log('[WS] Connected');
  };

  socket.onclose = () => {
    console.log('[WS] Disconnected');
    wsInstance = null;
  };

  wsInstance = socket;
  return socket;
}
