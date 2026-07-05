import React, { useEffect, useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { usePipelineStore } from '../../store/pipelineStore';
import { NodeData } from '../../types/pipeline';

interface MCPToolNodeData extends NodeData {
  status?: 'idle' | 'running' | 'done' | 'error';
  output?: string;
}

interface ToolInfo {
  name: string;
  description?: string;
  inputSchema?: Record<string, unknown>;
}

export default function MCPToolNode({ id, data, isConnectable }: NodeProps<MCPToolNodeData>) {
  const { updateNodeData } = usePipelineStore();
  const [servers, setServers] = useState<Array<{ id: string; label: string; toolCount: number }>>([]);
  const [tools, setTools] = useState<ToolInfo[]>([]);

  useEffect(() => {
    fetch('/api/mcp/servers')
      .then((r) => r.json())
      .then(setServers)
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (data.serverId) {
      fetch(`/api/mcp/tools/${data.serverId}`)
        .then((r) => r.json())
        .then(setTools)
        .catch(console.error);
    }
  }, [data.serverId]);

  return (
    <div className="bg-white border-2 border-green-300 rounded-lg p-3 min-w-[220px] shadow-md">
      <div className="text-xs font-bold text-green-600 mb-2">MCP TOOL</div>

      <select
        value={data.serverId || ''}
        onChange={(e) => updateNodeData(id, { serverId: e.target.value, toolName: '', args: {} })}
        className="w-full mb-2 px-2 py-1 border rounded text-xs"
      >
        <option value="">Select server...</option>
        {servers.map((s) => (
          <option key={s.id} value={s.id}>
            {s.label} ({s.toolCount} tools)
          </option>
        ))}
      </select>

      {data.serverId && (
        <select
          value={data.toolName || ''}
          onChange={(e) => updateNodeData(id, { toolName: e.target.value })}
          className="w-full mb-2 px-2 py-1 border rounded text-xs"
        >
          <option value="">Select tool...</option>
          {tools.map((t) => (
            <option key={t.name} value={t.name}>
              {t.name}
            </option>
          ))}
        </select>
      )}

      {data.output && (
        <div className="mt-2 p-2 bg-gray-100 rounded text-xs max-h-[80px] overflow-auto">
          {data.output}
        </div>
      )}

      <Handle type="target" position={Position.Top} isConnectable={isConnectable} />
      <Handle type="source" position={Position.Bottom} isConnectable={isConnectable} />
    </div>
  );
}
