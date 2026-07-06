import { describe, it, expect, beforeEach } from 'vitest';
import { usePipelineStore } from '../pipelineStore';

beforeEach(() => {
  usePipelineStore.setState({ nodes: [], edges: [], selectedNodeId: null, pipeline: null });
});

describe('pipelineStore', () => {
  describe('addNode', () => {
    it('adds a node to empty list', () => {
      usePipelineStore.getState().addNode({
        id: 'n1', type: 'input', position: { x: 0, y: 0 }, data: { label: 'Input' },
      });
      expect(usePipelineStore.getState().nodes).toHaveLength(1);
      expect(usePipelineStore.getState().nodes[0].id).toBe('n1');
    });

    it('appends multiple nodes', () => {
      const store = usePipelineStore.getState();
      store.addNode({ id: 'n1', type: 'input', position: { x: 0, y: 0 }, data: {} });
      store.addNode({ id: 'n2', type: 'output', position: { x: 10, y: 10 }, data: {} });
      expect(usePipelineStore.getState().nodes).toHaveLength(2);
    });
  });

  describe('updateNodeData', () => {
    it('updates existing node data', () => {
      const store = usePipelineStore.getState();
      store.addNode({ id: 'n1', type: 'input', position: { x: 0, y: 0 }, data: { value: '' } });
      store.updateNodeData('n1', { value: 'hello' });
      expect(usePipelineStore.getState().nodes[0].data.value).toBe('hello');
    });

    it('merges partial data', () => {
      const store = usePipelineStore.getState();
      store.addNode({ id: 'n1', type: 'claudeNode', position: { x: 0, y: 0 }, data: { model: 'sonnet' } });
      store.updateNodeData('n1', { systemPrompt: 'Be helpful' });
      const data = usePipelineStore.getState().nodes[0].data;
      expect(data.model).toBe('sonnet');
      expect(data.systemPrompt).toBe('Be helpful');
    });

    it('does nothing for nonexistent node', () => {
      const store = usePipelineStore.getState();
      store.addNode({ id: 'n1', type: 'input', position: { x: 0, y: 0 }, data: {} });
      store.updateNodeData('nonexistent', { value: 'x' });
      expect(usePipelineStore.getState().nodes[0].data.value).toBeUndefined();
    });
  });

  describe('deleteNode', () => {
    it('removes node and connected edges', () => {
      const store = usePipelineStore.getState();
      store.addNode({ id: 'a', type: 'input', position: { x: 0, y: 0 }, data: {} });
      store.addNode({ id: 'b', type: 'output', position: { x: 10, y: 10 }, data: {} });
      store.addEdge({ id: 'e1', source: 'a', target: 'b' });
      store.deleteNode('a');
      const state = usePipelineStore.getState();
      expect(state.nodes).toHaveLength(1);
      expect(state.nodes[0].id).toBe('b');
      expect(state.edges).toHaveLength(0);
    });
  });

  describe('addEdge', () => {
    it('adds an edge', () => {
      usePipelineStore.getState().addEdge({ id: 'e1', source: 'a', target: 'b' });
      expect(usePipelineStore.getState().edges).toHaveLength(1);
      expect(usePipelineStore.getState().edges[0].id).toBe('e1');
    });

    it('stores sourceHandle when provided', () => {
      usePipelineStore.getState().addEdge({ id: 'e1', source: 'a', target: 'b', sourceHandle: 'true' });
      expect(usePipelineStore.getState().edges[0].sourceHandle).toBe('true');
    });
  });

  describe('deleteEdge', () => {
    it('removes specific edge', () => {
      const store = usePipelineStore.getState();
      store.addEdge({ id: 'e1', source: 'a', target: 'b' });
      store.addEdge({ id: 'e2', source: 'b', target: 'c' });
      store.deleteEdge('e1');
      expect(usePipelineStore.getState().edges).toHaveLength(1);
      expect(usePipelineStore.getState().edges[0].id).toBe('e2');
    });
  });

  describe('setSelectedNode', () => {
    it('sets selectedNodeId', () => {
      usePipelineStore.getState().setSelectedNode('n1');
      expect(usePipelineStore.getState().selectedNodeId).toBe('n1');
    });

    it('clears selection with null', () => {
      const store = usePipelineStore.getState();
      store.setSelectedNode('n1');
      store.setSelectedNode(null);
      expect(usePipelineStore.getState().selectedNodeId).toBeNull();
    });
  });

  describe('setPipeline', () => {
    it('replaces nodes and edges', () => {
      usePipelineStore.getState().setPipeline({
        name: 'Test',
        nodes: [{ id: 'a', type: 'input', position: { x: 0, y: 0 }, data: {} }],
        edges: [],
      });
      const state = usePipelineStore.getState();
      expect(state.pipeline?.name).toBe('Test');
      expect(state.nodes).toHaveLength(1);
    });

    it('keeps existing nodes when pipeline has none', () => {
      const store = usePipelineStore.getState();
      store.addNode({ id: 'n1', type: 'input', position: { x: 0, y: 0 }, data: {} });
      store.setPipeline({ name: 'Test', nodes: undefined, edges: undefined } as any);
      expect(usePipelineStore.getState().nodes).toHaveLength(1);
    });
  });

  describe('setNodes and setEdges', () => {
    it('replaces all nodes', () => {
      usePipelineStore.getState().setNodes([
        { id: 'x', type: 'output', position: { x: 1, y: 1 }, data: {} },
      ]);
      expect(usePipelineStore.getState().nodes).toHaveLength(1);
    });

    it('replaces all edges', () => {
      usePipelineStore.getState().setEdges([
        { id: 'e1', source: 'a', target: 'b' },
      ]);
      expect(usePipelineStore.getState().edges).toHaveLength(1);
    });
  });

  describe('updateNode', () => {
    it('updates node properties', () => {
      const store = usePipelineStore.getState();
      store.addNode({ id: 'n1', type: 'input', position: { x: 0, y: 0 }, data: {} });
      store.updateNode('n1', { position: { x: 100, y: 200 } });
      expect(usePipelineStore.getState().nodes[0].position).toEqual({ x: 100, y: 200 });
    });

    it('does nothing for nonexistent node', () => {
      const store = usePipelineStore.getState();
      store.addNode({ id: 'n1', type: 'input', position: { x: 0, y: 0 }, data: {} });
      store.updateNode('nonexistent', { position: { x: 99, y: 99 } });
      expect(usePipelineStore.getState().nodes[0].position).toEqual({ x: 0, y: 0 });
    });
  });
});
