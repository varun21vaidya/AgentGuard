import { create } from 'zustand';
import { Node, Edge, Pipeline } from '../types/pipeline';

interface PipelineStore {
  nodes: Node[];
  edges: Edge[];
  selectedNodeId: string | null;
  pipeline: Pipeline | null;

  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  addNode: (node: Node) => void;
  updateNode: (nodeId: string, data: Partial<Node>) => void;
  updateNodeData: (nodeId: string, data: Partial<Node['data']>) => void;
  deleteNode: (nodeId: string) => void;

  addEdge: (edge: Edge) => void;
  deleteEdge: (edgeId: string) => void;

  setPipeline: (pipeline: Pipeline) => void;
  setSelectedNode: (nodeId: string | null) => void;
}

export const usePipelineStore = create<PipelineStore>((set) => ({
  nodes: [],
  edges: [],
  selectedNodeId: null,
  pipeline: null,

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),

  addNode: (node) => set((state) => ({ nodes: [...state.nodes, node] })),

  updateNode: (nodeId, data) =>
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === nodeId ? { ...n, ...data } : n
      ),
    })),

  updateNodeData: (nodeId, data) =>
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === nodeId
          ? { ...n, data: { ...n.data, ...data } }
          : n
      ),
    })),

  deleteNode: (nodeId) =>
    set((state) => ({
      nodes: state.nodes.filter((n) => n.id !== nodeId),
      edges: state.edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
    })),

  addEdge: (edge) =>
    set((state) => ({
      edges: [...state.edges, edge],
    })),

  deleteEdge: (edgeId) =>
    set((state) => ({
      edges: state.edges.filter((e) => e.id !== edgeId),
    })),

  setPipeline: (pipeline) => set((state) => ({
    pipeline,
    nodes: pipeline.nodes ?? state.nodes,
    edges: pipeline.edges ?? state.edges,
  })),

  setSelectedNode: (nodeId) => set({ selectedNodeId: nodeId }),
}));
