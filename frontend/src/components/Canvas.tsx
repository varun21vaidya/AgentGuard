import React, { useCallback, useEffect } from 'react';
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  Node,
  Edge,
} from 'reactflow';
import { NodeData, Node as PipelineNode } from '../types/pipeline';
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
  const {
    nodes, edges, setNodes, setEdges,
    addNode, addEdge: storeAddEdge, deleteNode, deleteEdge,
    setSelectedNode, updateNodeData,
  } = usePipelineStore();
  const ws = useWebSocket();

  useEffect(() => {
    if (!ws) return;
    const handle = (event: MessageEvent) => {
      const msg = JSON.parse(event.data);
      if (msg.type === 'node:complete' && msg.output) {
        updateNodeData(msg.nodeId, { lastOutput: msg.output });
      }
      if (msg.type === 'execution:started') {
        nodes.filter(n => n.type === 'output').forEach(n =>
          updateNodeData(n.id, { lastOutput: '' })
        );
      }
    };
    ws.addEventListener('message', handle);
    return () => ws.removeEventListener('message', handle);
  }, [ws, updateNodeData, nodes]);

  const onNodesChange = useCallback(
    (changes: any) => setNodes(applyNodeChanges(changes, nodes as Node<NodeData>[]) as unknown as PipelineNode[]),
    [nodes, setNodes]
  );

  const onEdgesChange = useCallback(
    (changes: any) => setEdges(applyEdgeChanges(changes, edges as Edge[]) as typeof edges),
    [edges, setEdges]
  );

  const onNodesDelete = useCallback(
    (deleted: any[]) => deleted.forEach((node) => deleteNode(node.id)),
    [deleteNode]
  );

  const onEdgesDelete = useCallback(
    (deleted: any[]) => deleted.forEach((edge) => deleteEdge(edge.id)),
    [deleteEdge]
  );

  const onConnect = useCallback(
    (params: any) => {
      storeAddEdge({
        id: `${params.source}-${params.target}-${Date.now()}`,
        source: params.source,
        target: params.target,
        sourceHandle: params.sourceHandle,
        targetHandle: params.targetHandle,
      });
    },
    [storeAddEdge]
  );

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const type = event.dataTransfer.getData('application/reactflow');
      if (!type) return;

      const bounds = (event.currentTarget as HTMLElement).getBoundingClientRect();
      const position = { x: event.clientX - bounds.left, y: event.clientY - bounds.top };

      addNode({
        id: `${type}-${Date.now()}`,
        type: type as PipelineNode['type'],
        position,
        data: { label: type },
      });
    },
    [addNode]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
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
        <Background variant={BackgroundVariant.Dots} gap={16} />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
}
