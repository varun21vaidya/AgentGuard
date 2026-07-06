/// <reference types="vite/client" />
import { useEffect, useState, useRef } from 'react';

let wsInstance: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<(ws: WebSocket) => void>();

function onInstanceReady(cb: (ws: WebSocket) => void) {
  if (wsInstance && wsInstance.readyState === WebSocket.OPEN) {
    cb(wsInstance);
  } else {
    listeners.add(cb);
  }
}

function createConnection() {
  if (wsInstance) return;
  const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:3001/ws';
  const socket = new WebSocket(wsUrl);

  socket.onopen = () => {
    console.log('[WS] Connected');
    wsInstance = socket;
    listeners.forEach(cb => cb(socket));
    listeners.clear();
  };

  socket.onclose = () => {
    console.log('[WS] Disconnected');
    wsInstance = null;
    if (reconnectTimer) clearTimeout(reconnectTimer);
    reconnectTimer = setTimeout(createConnection, 3000);
  };

  socket.onerror = () => {};

  wsInstance = socket;
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
    createConnection();
    onInstanceReady(setWs);
    return () => {};
  }, []);

  return ws;
}
