import React, { useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { usePipelineStore } from '../../store/pipelineStore';
import { NodeData } from '../../types/pipeline';
import CostBadge from '../common/CostBadge';

interface GeminiNodeData extends NodeData {
  streamOutput?: string;
  status?: 'idle' | 'running' | 'done' | 'error';
  actualCost?: number;
  estimatedCost?: number;
}

const statusColors: Record<string, string> = {
  idle: 'border-gray-300',
  running: 'border-blue-500 bg-blue-50',
  done: 'border-green-500 bg-green-50',
  error: 'border-red-500 bg-red-50',
};

export default function GeminiNode({ id, data, isConnectable }: NodeProps<GeminiNodeData>) {
  const { updateNodeData } = usePipelineStore();

  const status = data.status || 'idle';

  return (
    <div className={`bg-white border-2 rounded-lg p-3 min-w-[250px] shadow-md ${statusColors[status]}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs font-bold text-blue-600 mb-2">GEMINI AI</div>
        <CostBadge estimatedCost={data.estimatedCost} actualCost={data.actualCost} />
      </div>

      <select
        value={data.model || 'gemini-2.0-flash'}
        onChange={(e) => updateNodeData(id, { model: e.target.value })}
        className="w-full mb-2 px-2 py-1 border rounded text-xs"
      >
        <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
        <option value="gemini-2.0-pro">Gemini 2.0 Pro</option>
        <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
      </select>

      <textarea
        value={data.systemPrompt || ''}
        onChange={(e) => updateNodeData(id, { systemPrompt: e.target.value })}
        placeholder="System prompt..."
        rows={3}
        className="w-full mb-2 px-2 py-1 border rounded text-xs resize-none"
      />

      <input
        type="number"
        value={data.maxTokens || 1024}
        onChange={(e) => updateNodeData(id, { maxTokens: parseInt(e.target.value) })}
        placeholder="Max tokens"
        className="w-full mb-2 px-2 py-1 border rounded text-xs"
      />

      {data.streamOutput && (
        <div className="mt-2 p-2 bg-gray-100 rounded text-xs max-h-[100px] overflow-auto">
          {data.streamOutput}
        </div>
      )}

      <Handle type="target" position={Position.Top} isConnectable={isConnectable} />
      <Handle type="source" position={Position.Bottom} isConnectable={isConnectable} />
    </div>
  );
}
