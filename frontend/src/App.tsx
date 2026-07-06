import React, { useEffect, useState, useCallback, useRef } from 'react';
import Canvas from './components/Canvas';
import NodePalette from './components/panels/NodePalette';
import NodeConfigPanel from './components/panels/NodeConfigPanel';
import ExecutionPanel from './components/panels/ExecutionPanel';
import RunSummaryPanel from './components/panels/RunSummaryPanel';
import ApprovalModal from './components/panels/ApprovalModal';
import DryRunPanel from './components/common/DryRunPanel';
import { usePipeline } from './hooks/usePipeline';
import { useExecution } from './hooks/useExecution';
import { useWebSocket } from './hooks/useWebSocket';
import { usePipelineStore } from './store/pipelineStore';
import { useToast } from './components/common/Toast';
import { Pipeline } from './types/pipeline';
import { fetchAudit, fetchTemplates, instantiateTemplate } from './services/api';

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
  const { showToast } = useToast();

  const [pendingApproval, setPendingApproval] = useState<{
    executionId?: string;
    nodeId: string;
    nodeLabel: string;
    actionDescription: string;
    estimatedCost?: number;
  } | null>(null);
  const currentExecutionId = useRef<string | null>(null);

  const [showHistory, setShowHistory] = useState(false);
  const [runs, setRuns] = useState<RunSummary[]>([]);
  const [selectedRun, setSelectedRun] = useState<RunSummary | null>(null);
  const [dryRunReport, setDryRunReport] = useState<any>(null);
  const [showDryRun, setShowDryRun] = useState(false);
  const [templates, setTemplates] = useState<Array<{ name: string; description: string }>>([]);
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
    fetchTemplates().then(setTemplates).catch(() => {});
  }, []);

  useEffect(() => {
    if (!ws) return;

    const handleMessage = (event: MessageEvent) => {
      const msg = JSON.parse(event.data);

      if (msg.type === 'execution:started') {
        currentExecutionId.current = msg.executionId;
        setRuns([]);
        const curNodes = nodesRef.current;
        curNodes.forEach(n => {
          if (n.type === 'output') updateNodeData(n.id, { lastOutput: '' });
        });
      }

      if (msg.type === 'node:awaiting_approval') {
        setPendingApproval({
          executionId: msg.executionId || currentExecutionId.current || undefined,
          nodeId: msg.nodeId,
          nodeLabel: msg.nodeLabel,
          actionDescription: msg.actionDescription,
          estimatedCost: msg.estimatedCost,
        });
      }

      if (msg.type === 'node:complete') {
        const curNodes = nodesRef.current;
        const node = curNodes.find(n => n.id === msg.nodeId);
        if (node?.type === 'output' && msg.output) {
          updateNodeData(node.id, { lastOutput: msg.output });
        }
      }

      if (msg.type === 'node:skipped') {
        updateNodeData(msg.nodeId, { status: 'skipped' });
      }

      if (msg.type === 'pipeline:complete' || msg.type === 'pipeline:error') {
        const curPipeline = pipelineRef.current;
        if (curPipeline?._id) {
          fetchAudit(curPipeline._id).then((data) => {
            setRuns(data || []);
          }).catch(console.error);
        }
      }

      if (msg.type === 'dryrun:complete') {
        setDryRunReport(msg.report);
        setShowDryRun(true);
      }

      if (msg.type === 'error') {
        showToast(msg.error, 'error');
      }
    };

    ws.addEventListener('message', handleMessage);
    return () => ws.removeEventListener('message', handleMessage);
  }, [ws, updateNodeData, showToast]);

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

  const handleRun = useCallback(async () => {
    const result = await runPipeline(pipeline || null);
    if (result && !result.ok) {
      showToast(result.error || 'Failed to run pipeline', 'error');
    }
  }, [runPipeline, pipeline, showToast]);

  const handleDryRun = useCallback(() => {
    if (ws && ws.readyState === WebSocket.OPEN && pipeline?._id) {
      ws.send(JSON.stringify({ type: 'execute', pipelineId: pipeline._id, dryRun: true }));
    } else {
      showToast('WebSocket not connected', 'error');
    }
  }, [ws, pipeline, showToast]);

  const handleShare = useCallback(() => {
    if (pipeline?.shareId) {
      const url = `${window.location.origin}?shareId=${pipeline.shareId}`;
      navigator.clipboard.writeText(url);
      showToast('Share link copied!', 'success');
    }
  }, [pipeline, showToast]);

  const loadTemplate = useCallback(async (name: string) => {
    try {
      const result = await instantiateTemplate(name);
      if (result._id) {
        setPipeline(result);
        showToast(`Template "${name}" loaded`, 'success');
      }
    } catch {
      showToast('Failed to load template', 'error');
    }
  }, [setPipeline, showToast]);

  if (!pipeline && templates.length > 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-6">AgentGuard</h1>
          <p className="text-gray-500 mb-6">Choose a starter template or create a blank pipeline</p>
          <div className="flex gap-4 justify-center">
            {templates.map(t => (
              <button
                key={t.name}
                onClick={() => loadTemplate(t.name)}
                className="bg-white border rounded-lg p-6 w-64 text-left hover:shadow-md transition-shadow"
              >
                <h3 className="font-semibold mb-2">{t.name}</h3>
                <p className="text-sm text-gray-500">{t.description}</p>
              </button>
            ))}
            <button
              onClick={() => setPipeline({ name: 'Untitled Pipeline', nodes: [], edges: [] } as any)}
              className="bg-white border border-dashed rounded-lg p-6 w-64 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:border-gray-400"
            >
              + Blank Pipeline
            </button>
          </div>
        </div>
      </div>
    );
  }

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
              <button onClick={handleShare} className="px-3 py-2 bg-gray-100 text-gray-700 rounded font-semibold hover:bg-gray-200 text-sm">
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
              onClick={handleDryRun}
              className="px-3 py-2 bg-purple-100 text-purple-700 rounded font-semibold hover:bg-purple-200 text-sm"
            >
              Dry Run
            </button>
            <button
              onClick={handleRun}
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

      {showDryRun && dryRunReport && (
        <DryRunPanel report={dryRunReport} onClose={() => setShowDryRun(false)} />
      )}
    </div>
  );
}
