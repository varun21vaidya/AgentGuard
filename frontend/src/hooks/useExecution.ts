import { useCallback, useEffect, useState } from 'react';
import { usePipelineStore } from '../store/pipelineStore';
import { useWebSocket } from './useWebSocket';
import { Pipeline } from '../types/pipeline';
import { updatePipeline } from '../services/api';

export function useExecution() {
  const [executionId, setExecutionId] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'running' | 'complete' | 'error'>('idle');
  const ws = useWebSocket();
  const nodes = usePipelineStore(s => s.nodes);
  const edges = usePipelineStore(s => s.edges);
  const setPipeline = usePipelineStore(s => s.setPipeline);

  useEffect(() => {
    if (!ws) return;
    const handle = (event: MessageEvent) => {
      const msg = JSON.parse(event.data);
      if (msg.type === 'execution:started') {
        setExecutionId(msg.executionId);
        setStatus('running');
      }
      if (msg.type === 'pipeline:complete') setStatus('complete');
      if (msg.type === 'pipeline:error' || msg.type === 'error') setStatus('error');
      if (msg.type === 'execution:aborted') { setStatus('idle'); setExecutionId(null); }
    };
    ws.addEventListener('message', handle);
    return () => ws.removeEventListener('message', handle);
  }, [ws]);

  const runPipeline = useCallback(
    async (pipeline: Pipeline | null) => {
      if (!pipeline || !pipeline._id) {
        alert('Please save the pipeline first');
        return;
      }

      if (!ws || ws.readyState !== WebSocket.OPEN) {
        alert('WebSocket not connected. Is the backend running on port 3001?');
        console.error('[Run] WS not ready. State:', ws?.readyState);
        return;
      }

      // Save latest nodes/edges to backend before running
      try {
        const saved = await updatePipeline(pipeline._id, { ...pipeline, nodes, edges });
        setPipeline(saved);
      } catch (err) {
        console.error('[Run] Save before execute failed:', err);
      }

      setStatus('running');

      ws.send(JSON.stringify({
        type: 'execute',
        pipelineId: pipeline._id,
      }));
    },
    [ws, nodes, edges, setPipeline]
  );

  const abortPipeline = useCallback(() => {
    if (ws && ws.readyState === WebSocket.OPEN && executionId) {
      ws.send(JSON.stringify({
        type: 'abort',
        executionId,
      }));
      setStatus('idle');
    }
  }, [ws, executionId]);

  return { executionId, status, runPipeline, abortPipeline };
}
