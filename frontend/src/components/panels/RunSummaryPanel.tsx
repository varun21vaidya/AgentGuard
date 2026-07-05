import React from 'react';
import { formatCost, formatDuration, formatTimestamp } from '../../utils/formatters';

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
    nodeType?: string;
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

interface RunSummaryPanelProps {
  runs: RunSummary[];
  onSelectRun: (run: RunSummary) => void;
  selectedRun?: RunSummary | null;
}

function optimizerNote(run: RunSummary): string | null {
  for (const nr of run.nodeResults) {
    if (nr.actualCost && nr.actualCost > 0.01) {
      return 'Consider using Haiku instead of Opus for simpler tasks';
    }
  }
  return null;
}

export default function RunSummaryPanel({ runs, onSelectRun, selectedRun }: RunSummaryPanelProps) {
  return (
    <div className="w-80 border-l border-gray-200 p-4 bg-gray-50 overflow-y-auto">
      <h2 className="text-sm font-bold text-gray-800 mb-4">Run History</h2>

      {runs.length === 0 && (
        <p className="text-xs text-gray-500">No runs yet. Execute a pipeline to see results.</p>
      )}

      <div className="flex flex-col gap-3">
        {runs.map((run) => (
          <div
            key={run.executionId}
            className={`bg-white border rounded p-3 cursor-pointer hover:shadow-md transition ${
              selectedRun?.executionId === run.executionId ? 'border-blue-500' : 'border-gray-200'
            }`}
            onClick={() => onSelectRun(run)}
          >
            <div className="flex items-center justify-between mb-2">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                run.status === 'complete' ? 'bg-green-100 text-green-700' :
                run.status === 'running' ? 'bg-yellow-100 text-yellow-700' :
                run.status === 'error' ? 'bg-red-100 text-red-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {run.status}
              </span>
              <span className="text-xs text-gray-500">{formatTimestamp(run.startedAt)}</span>
            </div>

            <div className="text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-600">Cost:</span>
                <span className="font-semibold">{formatCost(run.totalActualCost)}</span>
              </div>
              {run.durationMs && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Duration:</span>
                  <span className="font-semibold">{formatDuration(run.durationMs)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Approvals:</span>
                <span className="font-semibold">{run.approvalsSummary?.approved || 0}/{run.approvalsSummary?.total || 0}</span>
              </div>
            </div>

            {optimizerNote(run) && (
              <div className="mt-2 text-xs text-purple-600 bg-purple-50 rounded p-1.5">
                {optimizerNote(run)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
