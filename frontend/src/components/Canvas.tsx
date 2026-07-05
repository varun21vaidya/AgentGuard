import React, { useCallback, useEffect, useRef } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  applyNodeChanges,
  applyEdgeChanges,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { usePipelineStore } from '../store/pipelineStore';
import { useWebSocket } from '../hooks/useWebSocket';
import InputNode from './nodes/InputNode';
import ClaudeNode from './nodes/ClaudeNode';
import GeminiNode from './nodes/GeminiNode';
import FirecrawlNode from './nodes/FirecrawlNode';
import MCPToolNode from './nodes/MCPToolNode';
import ConditionNode from './nodes/ConditionNode';
import OutputNode from './nodes/OutputNode';

const nodeTypes = {
  input: InputNode,
  claudeNode: ClaudeNode,
  geminiNode: GeminiNode,
  firecrawlNode: FirecrawlNode,
  mcpTool: MCPToolNode,
  condition: ConditionNode,
  output: OutputNode,
};

export default function Canvas() {
  const { nodes, edges, setNodes, setEdges, addNode, addEdge: storeAddEdge, deleteNode, deleteEdge, setSelectedNode, updateNodeData } = usePipelineStore();
  const [rfNodes, setNodesState, onNodesChangeRF] = useNodesState(nodes);
  const [rfEdges, setEdgesState, onEdgesChangeRF] = useEdgesState(edges);
  const ws = useWebSocket();
  const rfNodesRef = useRef(rfNodes);
  rfNodesRef.current = rfNodes;

  useEffect(() => {
    if (!ws) return;
    const handle = (event: MessageEvent) => {
      const msg = JSON.parse(event.data);
      const cur = rfNodesRef.current;
      if (msg.type === 'node:complete') {
        const rfNode = cur.find(n => n.id === msg.nodeId);
        if (rfNode?.type === 'output' && msg.output) {
          const updated = cur.map(n =>
            n.id === msg.nodeId
              ? { ...n, data: { ...n.data, lastOutput: msg.output } }
              : n
          );
          setNodesState(updated);
          updateNodeData(msg.nodeId, { lastOutput: msg.output });
        }
      }
      if (msg.type === 'execution:started') {
        const updated = cur.map(n =>
          n.type === 'output'
            ? { ...n, data: { ...n.data, lastOutput: '' } }
            : n
        );
        setNodesState(updated);
        cur.filter(n => n.type === 'output').forEach(n => updateNodeData(n.id, { lastOutput: '' }));
      }
    };
    ws.addEventListener('message', handle);
    return () => ws.removeEventListener('message', handle);
  }, [ws, setNodesState, updateNodeData]);

  const onNodesChange = useCallback(
    (changes: any) => {
      setNodesState((prev: any[]) => {
        const updated = applyNodeChanges(changes, prev);
        setNodes(updated);
        return updated;
      });
    },
    [setNodes, setNodesState]
  );

  const onEdgesChange = useCallback(
    (changes: any) => {
      setEdgesState((prev: any[]) => {
        const updated = applyEdgeChanges(changes, prev);
        setEdges(updated);
        return updated;
      });
    },
    [setEdges, setEdgesState]
  );

  const onNodesDelete = useCallback(
    (deleted: any[]) => {
      for (const node of deleted) {
        deleteNode(node.id);
      }
    },
    [deleteNode]
  );

  const onEdgesDelete = useCallback(
    (deleted: any[]) => {
      for (const edge of deleted) {
        deleteEdge(edge.id);
      }
    },
    [deleteEdge]
  );

  const onConnect = useCallback(
    (params: any) => {
      const newEdge = {
        id: `${params.source}-${params.target}-${Date.now()}`,
        source: params.source,
        target: params.target,
        sourceHandle: params.sourceHandle,
        targetHandle: params.targetHandle,
      };
      storeAddEdge(newEdge);
      setEdgesState((els: any) => addEdge(params, els));
    },
    [storeAddEdge, setEdgesState]
  );

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const type = event.dataTransfer.getData('application/reactflow');
      if (!type) return;

      const reactFlowBounds = (event.currentTarget as HTMLElement).getBoundingClientRect();
      const position = {
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      };

      const newNode = {
        id: `${type}-${Date.now()}`,
        type,
        position,
        data: { label: type },
      };

      addNode(newNode);
      setNodesState((prev: any[]) => [...prev, newNode]);
    },
    [addNode, setNodesState]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodesDelete={onNodesDelete}
        onEdgesDelete={onEdgesDelete}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onNodeClick={(_, node) => setSelectedNode(node.id)}
        onPaneClick={() => setSelectedNode(null)}
        deleteKeyCode={['Backspace', 'Delete']}
        fitView
      >
        <Background variant="dots" gap={16} />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
}
