let wsInstance: WebSocket | null = null;

export function getWebSocket(): WebSocket | null {
  if (wsInstance && wsInstance.readyState === WebSocket.OPEN) {
    return wsInstance;
  }

  const wsUrl = import.meta.env.VITE_WS_URL || `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/ws`;
  const socket = new WebSocket(wsUrl);

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
