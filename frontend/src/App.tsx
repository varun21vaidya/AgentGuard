import React, { useEffect, useState, useCallback, useRef } from 'react';
import Canvas from './components/Canvas';
import NodePalette from './components/panels/NodePalette';
import NodeConfigPanel from './components/panels/NodeConfigPanel';
import ExecutionPanel from './components/panels/ExecutionPanel';
import RunSummaryPanel from './components/panels/RunSummaryPanel';
import ApprovalModal from './components/panels/ApprovalModal';
import { usePipeline } from './hooks/usePipeline';
import { useExecution } from './hooks/useExecution';
import { useWebSocket } from './hooks/useWebSocket';
import { usePipelineStore } from './store/pipelineStore';
import { Pipeline } from './types/pipeline';
import { fetchAudit } from './services/api';

interface RunSummary {
  executionId: string;
  status: string;
  totalActualCost: number;
  totalEstimatedCost: number;
  durationMs?: number;
  startedAt: string;
  completedAt?: string;
  nodeResults: Array<{
    nodeId: string;
    status: string;
    actualCost?: number;
    durationMs?: number;
  }>;
  approvalsSummary: {
    total: number;
    approved: number;
    rejected: number;
  };
}

export default function App() {
  const { pipeline, savePipeline, loadPipeline } = usePipeline();
  const setPipeline = usePipelineStore(s => s.setPipeline);
  const updateNodeData = usePipelineStore(s => s.updateNodeData);
  const nodes = usePipelineStore(s => s.nodes);
  const { runPipeline, abortPipeline } = useExecution();
  const ws = useWebSocket();

  const [pendingApproval, setPendingApproval] = useState<{
    nodeId: string;
    nodeLabel: string;
    actionDescription: string;
    estimatedCost: number;
  } | null>(null);

  const [showHistory, setShowHistory] = useState(false);
  const [runs, setRuns] = useState<RunSummary[]>([]);
  const [selectedRun, setSelectedRun] = useState<RunSummary | null>(null);
  const nodesRef = useRef(nodes);
  nodesRef.current = nodes;
  const pipelineRef = useRef(pipeline);
  pipelineRef.current = pipeline;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shareId = params.get('shareId');
    if (shareId) {
      loadPipeline(shareId);
    }
  }, [loadPipeline]);

  useEffect(() => {
    if (!ws) return;

    const handleMessage = (event: MessageEvent) => {
      const msg = JSON.parse(event.data);

      if (msg.type === 'node:awaiting_approval') {
        setPendingApproval({
          nodeId: msg.nodeId,
          nodeLabel: msg.nodeLabel,
          actionDescription: msg.actionDescription,
          estimatedCost: msg.estimatedCost,
        });
      }

      if (msg.type === 'execution:started') {
        setRuns([]);
        const curNodes = nodesRef.current;
        curNodes.forEach(n => {
          if (n.type === 'output') updateNodeData(n.id, { lastOutput: '' });
        });
      }

      if (msg.type === 'node:complete') {
        const curNodes = nodesRef.current;
        const node = curNodes.find(n => n.id === msg.nodeId);
        if (node?.type === 'output' && msg.output) {
          updateNodeData(node.id, { lastOutput: msg.output });
        }
      }

      if (msg.type === 'pipeline:complete' || msg.type === 'pipeline:error') {
        const curPipeline = pipelineRef.current;
        if (curPipeline?._id) {
          fetchAudit(curPipeline._id).then((data) => {
            setRuns(data || []);
          }).catch(console.error);
        }
      }
    };

    ws.addEventListener('message', handleMessage);
    return () => ws.removeEventListener('message', handleMessage);
  }, [ws]);

  const handleSave = useCallback(() => {
    if (pipeline) {
      savePipeline(pipeline);
    }
  }, [pipeline, savePipeline]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      handleSave();
    }
  }, [handleSave]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="flex h-screen bg-white">
      <NodePalette />
      <div className="flex-1 flex flex-col">
        <div className="border-b border-gray-200 p-4 flex items-center justify-between bg-white">
          <input
            type="text"
            value={pipeline?.name || ''}
            onChange={(e) => {
              const updated = { ...pipeline, name: e.target.value } as Pipeline;
              setPipeline(updated);
              savePipeline(updated);
            }}
            placeholder="Pipeline name..."
            className="text-lg font-semibold border-b-2 border-transparent focus:border-blue-500 outline-none"
          />
          <div className="flex gap-2">
            {pipeline?.shareId && (
              <button
                onClick={() => {
                  const url = `${window.location.origin}?shareId=${pipeline.shareId}`;
                  navigator.clipboard.writeText(url);
                  alert('Share link copied!');
                }}
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded font-semibold hover:bg-gray-200 text-sm"
              >
                Share
              </button>
            )}
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="px-3 py-2 bg-gray-100 text-gray-700 rounded font-semibold hover:bg-gray-200 text-sm"
            >
              {showHistory ? 'Output' : 'History'}
            </button>
            <button
              onClick={() => runPipeline(pipeline || null)}
              className="px-4 py-2 bg-blue-500 text-white rounded font-semibold hover:bg-blue-600"
            >
              Run
            </button>
            <button
              onClick={abortPipeline}
              className="px-4 py-2 bg-red-500 text-white rounded font-semibold hover:bg-red-600"
            >
              Abort
            </button>
          </div>
        </div>
        <div className="flex flex-1 overflow-hidden">
          <Canvas />
          {showHistory ? (
            <RunSummaryPanel runs={runs} onSelectRun={setSelectedRun} selectedRun={selectedRun} />
          ) : (
            <ExecutionPanel />
          )}
        </div>
      </div>
      <NodeConfigPanel />

      {pendingApproval && (
        <ApprovalModal
          {...pendingApproval}
          onClose={() => setPendingApproval(null)}
        />
      )}
    </div>
  );
}
