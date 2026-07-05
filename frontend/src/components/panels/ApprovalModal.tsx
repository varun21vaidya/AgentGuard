import React from 'react';
import { useWebSocket } from '../../hooks/useWebSocket';

interface ApprovalModalProps {
  nodeId: string;
  nodeLabel: string;
  actionDescription: string;
  estimatedCost?: number;
  onClose: () => void;
}

export default function ApprovalModal({
  nodeId,
  nodeLabel,
  actionDescription,
  estimatedCost,
  onClose,
}: ApprovalModalProps) {
  const ws = useWebSocket();

  const handleApprove = () => {
    if (ws && ws.readyState === 1) {
      ws.send(JSON.stringify({
        type: 'approve',
        nodeId,
        decidedBy: 'user',
        decision: 'Approved by user',
      }));
    }
    onClose();
  };

  const handleReject = () => {
    if (ws && ws.readyState === 1) {
      ws.send(JSON.stringify({
        type: 'reject',
        nodeId,
        decidedBy: 'user',
        decision: 'Rejected by user',
      }));
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-lg">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Approval Required</h2>

        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
          <div className="text-sm font-semibold text-gray-700 mb-1">{nodeLabel}</div>
          <div className="text-sm text-gray-600">{actionDescription}</div>
          {estimatedCost && (
            <div className="text-sm text-purple-600 font-semibold mt-2">
              Estimated cost: ${estimatedCost.toFixed(6)}
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleApprove}
            className="flex-1 bg-green-500 text-white rounded px-4 py-2 font-semibold hover:bg-green-600"
          >
            Approve
          </button>
          <button
            onClick={handleReject}
            className="flex-1 bg-red-500 text-white rounded px-4 py-2 font-semibold hover:bg-red-600"
          >
            Reject
          </button>
        </div>
      </div>
    </div>
  );
}
