import React from 'react';

interface DryRunReport {
  totalEstimatedCost: number;
  nodesWouldRun: Array<{ nodeId: string; type: string; estimatedCost: number }>;
  nodesWouldSkip: Array<{ nodeId: string; type: string; reason: string }>;
  approvalsWouldTrigger: Array<{ nodeId: string; nodeType: string; label: string; reason: string }>;
  warnings: Array<{ nodeId: string; message: string }>;
}

export default function DryRunPanel({ report, onClose }: { report: DryRunReport; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-lg w-full shadow-lg max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">Dry Run Report</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">✕</button>
        </div>

        <div className="mb-4 p-3 bg-blue-50 rounded">
          <div className="text-xs text-gray-600">Estimated cost if this pipeline ran for real</div>
          <div className="text-xl font-bold text-blue-700">${report.totalEstimatedCost.toFixed(4)}</div>
        </div>

        {report.approvalsWouldTrigger.length > 0 && (
          <div className="mb-4">
            <div className="text-xs font-semibold text-gray-700 mb-2">
              {report.approvalsWouldTrigger.length} node(s) would require approval
            </div>
            {report.approvalsWouldTrigger.map((a) => (
              <div key={a.nodeId} className="text-xs bg-yellow-50 border border-yellow-200 rounded p-2 mb-1">
                <strong>{a.label}</strong> ({a.nodeType}) — {a.reason}
              </div>
            ))}
          </div>
        )}

        {report.warnings.length > 0 && (
          <div className="mb-4">
            <div className="text-xs font-semibold text-gray-700 mb-2">Warnings</div>
            {report.warnings.map((w, i) => (
              <div key={i} className="text-xs bg-red-50 border border-red-200 rounded p-2 mb-1">{w.message}</div>
            ))}
          </div>
        )}

        <div className="text-xs text-gray-500">
          {report.nodesWouldRun.length} node(s) would execute &middot; {report.nodesWouldSkip.length} would be skipped
        </div>
      </div>
    </div>
  );
}
