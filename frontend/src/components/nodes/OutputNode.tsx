import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { usePipelineStore } from '../../store/pipelineStore';
import { NodeData } from '../../types/pipeline';

export default function OutputNode({ id, data, isConnectable }: NodeProps<NodeData>) {
  const { updateNodeData } = usePipelineStore();

  return (
    <div className="bg-white border-2 border-blue-300 rounded-lg p-3 min-w-[220px] shadow-md">
      <div className="text-xs font-bold text-blue-600 mb-2">OUTPUT</div>

      <input
        type="text"
        value={data.label || ''}
        onChange={(e) => updateNodeData(id, { label: e.target.value })}
        placeholder="Output label (e.g. Claude Summary)"
        className="w-full mb-2 px-2 py-1 border rounded text-xs font-medium"
      />

      <textarea
        value={data.value || ''}
        onChange={(e) => updateNodeData(id, { value: e.target.value })}
        placeholder="{{input}}"
        rows={3}
        className="w-full mb-2 px-2 py-1 border rounded text-xs resize-none"
      />

      <div className="p-2 bg-gray-100 rounded text-xs min-h-[40px] max-h-[80px] overflow-auto break-all">
        {data.lastOutput || '(run to see output)'}
      </div>

      <button
        onClick={() => {
          if (data.value) {
            navigator.clipboard.writeText(data.value);
          }
        }}
        className="w-full mt-2 px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
      >
        Copy
      </button>

      <Handle type="target" position={Position.Top} isConnectable={isConnectable} />
    </div>
  );
}
