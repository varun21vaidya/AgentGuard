import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { usePipelineStore } from '../../store/pipelineStore';
import { NodeData } from '../../types/pipeline';

export default function ConditionNode({ id, data, isConnectable }: NodeProps<NodeData>) {
  const { updateNodeData } = usePipelineStore();

  return (
    <div className="bg-white border-2 border-orange-300 rounded-lg p-3 min-w-[200px] shadow-md">
      <div className="text-xs font-bold text-orange-600 mb-2">CONDITION</div>

      <select
        value={data.operator || '=='}
        onChange={(e) => updateNodeData(id, { operator: e.target.value as any })}
        className="w-full mb-2 px-2 py-1 border rounded text-xs"
      >
        <option value="==">==</option>
        <option value="!=">!=</option>
        <option value=">">&gt;</option>
        <option value="<">&lt;</option>
        <option value="contains">contains</option>
      </select>

      <input
        type="text"
        value={data.value || ''}
        onChange={(e) => updateNodeData(id, { value: e.target.value })}
        placeholder="Compare value"
        className="w-full px-2 py-1 border rounded text-xs"
      />

      <div className="text-[10px] font-semibold text-gray-600 mb-2">Routes</div>

      <div className="mb-2">
        <div className="flex items-center gap-1 mb-1">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-[10px] font-bold text-green-700">TRUE</span>
        </div>
        <Handle type="source" position={Position.Bottom} id="true" isConnectable={isConnectable} style={{ left: '30%' }} />
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-red-500" />
          <span className="text-[10px] font-bold text-red-700">FALSE</span>
        </div>
        <Handle type="source" position={Position.Bottom} id="false" isConnectable={isConnectable} style={{ left: '70%' }} />
      </div>

      <Handle type="target" position={Position.Top} isConnectable={isConnectable} />
    </div>
  );
}
