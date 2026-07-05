import { useEffect, useState } from 'react';

let wsInstance: WebSocket | null = null;
const listeners = new Set<(ws: WebSocket) => void>();

function onInstanceReady(cb: (ws: WebSocket) => void) {
  if (wsInstance && wsInstance.readyState === WebSocket.OPEN) {
    cb(wsInstance);
  } else {
    listeners.add(cb);
  }
}

export function useWebSocket() {
  const [ws, setWs] = useState<WebSocket | null>(null);

  useEffect(() => {
    if (wsInstance && wsInstance.readyState === WebSocket.OPEN) {
      setWs(wsInstance);
      return;
    }

    if (wsInstance) {
      onInstanceReady(setWs);
      return;
    }

    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:3001/ws';
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log('[WS] Connected');
      wsInstance = socket;
      setWs(socket);
      listeners.forEach(cb => cb(socket));
      listeners.clear();
    };

    socket.onclose = () => {
      console.log('[WS] Disconnected');
      wsInstance = null;
    };

    socket.onerror = (err) => {
      console.error('[WS] Error:', err);
    };

    wsInstance = socket;
  }, []);

  return ws;
}
