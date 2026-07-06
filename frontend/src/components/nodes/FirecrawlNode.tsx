import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { usePipelineStore } from '../../store/pipelineStore';
import { NodeData } from '../../types/pipeline';

interface FirecrawlNodeData extends NodeData {
  action?: 'search' | 'scrape' | 'interact';
  query?: string;
  url?: string;
  limit?: number;
  actions?: Array<{ type: string; selector?: string; value?: string }>;
  status?: 'idle' | 'running' | 'done' | 'error';
  output?: string;
}

const statusColors: Record<string, string> = {
  idle: 'border-gray-300',
  running: 'border-green-500 bg-green-50',
  done: 'border-green-500 bg-green-50',
  error: 'border-red-500 bg-red-50',
  skipped: 'border-gray-300 bg-gray-100 opacity-50',
};

export default function FirecrawlNode({ id, data, isConnectable }: NodeProps<FirecrawlNodeData>) {
  const { updateNodeData } = usePipelineStore();

  const status = data.status || 'idle';

  return (
    <div className={`bg-white border-2 rounded-lg p-3 min-w-[250px] shadow-md ${statusColors[status]}`}>
      <div className="text-xs font-bold text-red-600 mb-2">FIRECRAWL</div>

      <select
        value={data.action || 'search'}
        onChange={(e) => updateNodeData(id, { action: e.target.value as any })}
        className="w-full mb-2 px-2 py-1 border rounded text-xs"
      >
        <option value="search">Search</option>
        <option value="scrape">Scrape</option>
        <option value="interact">Interact</option>
      </select>

      {(data.action === 'search') && (
        <div className="mb-2">
          <input
            type="text"
            value={data.query || ''}
            onChange={(e) => updateNodeData(id, { query: e.target.value })}
            placeholder="Search query..."
            className="w-full mb-1 px-2 py-1 border rounded text-xs"
          />
          <input
            type="number"
            value={data.limit || 10}
            onChange={(e) => updateNodeData(id, { limit: parseInt(e.target.value) || 10 })}
            placeholder="Result limit"
            className="w-full px-2 py-1 border rounded text-xs"
          />
        </div>
      )}

      {(data.action === 'scrape' || data.action === 'interact') && (
        <input
          type="text"
          value={data.url || ''}
          onChange={(e) => updateNodeData(id, { url: e.target.value })}
          placeholder="URL..."
          className="w-full mb-2 px-2 py-1 border rounded text-xs"
        />
      )}

      {data.output && (
        <div className="mt-2 p-2 bg-gray-100 rounded text-xs max-h-[100px] overflow-auto">
          {data.output.slice(0, 500)}
          {data.output.length > 500 ? '...' : ''}
        </div>
      )}

      <Handle type="target" position={Position.Top} isConnectable={isConnectable} />
      <Handle type="source" position={Position.Bottom} isConnectable={isConnectable} />
    </div>
  );
}
