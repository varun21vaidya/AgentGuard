import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { usePipelineStore } from '../../store/pipelineStore';
import { Node } from '../../types/pipeline';

export default function InputNode({ id, data, isConnectable }: NodeProps<Node['data']>) {
  const { updateNodeData } = usePipelineStore();

  return (
    <div className="bg-white border border-blue-300 rounded-lg p-3 min-w-[200px] shadow-md">
      <div className="text-xs font-bold text-blue-600 mb-2">INPUT</div>
      <input
        type="text"
        value={data.value || ''}
        onChange={(e) => updateNodeData(id, { value: e.target.value })}
        placeholder="Enter initial value..."
        className="w-full px-2 py-1 border rounded text-sm"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
      />
    </div>
  );
}
