import React, { useEffect, useState } from 'react';
import { useWebSocket } from '../../hooks/useWebSocket';

export default function ExecutionPanel() {
  const ws = useWebSocket();
  const [output, setOutput] = useState('');
  const [status, setStatus] = useState<'idle' | 'running' | 'complete' | 'error'>('idle');
  const [cost, setCost] = useState(0);

  useEffect(() => {
    if (!ws) return;

    const handleMessage = (event: MessageEvent) => {
      const msg = JSON.parse(event.data);

      if (msg.type === 'execution:started') {
        setOutput('');
        setStatus('running');
        setCost(0);
      }
      if (msg.type === 'node:stream') {
        setOutput((prev) => prev + msg.delta);
      }
      if (msg.type === 'node:complete') {
        if (msg.nodeType === 'output') {
          setOutput((prev) => prev + (msg.output || ''));
        }
        setCost((prev) => prev + (msg.actualCost || 0));
      }
      if (msg.type === 'node:error') {
        setOutput((prev) => prev + `\n[ERROR] ${msg.error}\n`);
      }
      if (msg.type === 'pipeline:complete') {
        setStatus('complete');
      }
      if (msg.type === 'pipeline:error') {
        setStatus('error');
        setOutput((prev) => prev + `\n[PIPELINE ERROR] ${msg.error}\n`);
      }
    };

    ws.addEventListener('message', handleMessage);
    return () => ws.removeEventListener('message', handleMessage);
  }, [ws]);

  return (
    <div className="w-80 border-l border-gray-200 p-4 bg-gray-50 overflow-y-auto flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-gray-800">Execution Output</h2>
        <span className={`text-xs px-2 py-1 rounded ${status === 'running' ? 'bg-yellow-200' : status === 'complete' ? 'bg-green-200' : 'bg-gray-200'}`}>
          {status}
        </span>
      </div>

      <div className="flex-1 bg-white border rounded p-2 mb-4 font-mono text-xs overflow-auto max-h-[300px]">
        {output || '(waiting for output...)'}
      </div>

      <div className="bg-white border rounded p-2">
        <div className="text-xs font-semibold text-gray-700">Total Cost</div>
        <div className="text-lg font-bold text-purple-600">${cost.toFixed(6)}</div>
      </div>
    </div>
  );
}
