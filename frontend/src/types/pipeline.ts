export interface Pipeline {
  _id?: string;
  name: string;
  description?: string;
  nodes: Node[];
  edges: Edge[];
  shareId?: string;
  isPublic?: boolean;
  createdBy?: string;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Node {
  id: string;
  type: 'input' | 'claudeNode' | 'geminiNode' | 'firecrawlNode' | 'mcpTool' | 'condition' | 'output';
  position: { x: number; y: number };
  data: NodeData;
}

export interface NodeData {
  label?: string;
  value?: string;
  systemPrompt?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  serverId?: string;
  toolName?: string;
  args?: Record<string, unknown>;
  leftHandle?: string;
  operator?: '==' | '!=' | '>' | '<' | 'contains';
  riskLevel?: 'safe' | 'reversible' | 'irreversible';
  lastOutput?: string;
  /** Firecrawl fields */
  action?: 'search' | 'scrape' | 'interact';
  query?: string;
  url?: string;
  limit?: number;
  /** MCP Tool fields */
  actions?: Array<{ type: string; selector?: string; value?: string }>;
  status?: 'idle' | 'running' | 'done' | 'error';
  output?: string;
}

export interface Edge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

export interface NodeResult {
  nodeId: string;
  status: 'pending' | 'running' | 'complete' | 'error' | 'awaiting_approval';
  output?: string;
  error?: string;
  actualCost?: number;
  durationMs?: number;
}

export interface Approval {
  _id?: string;
  nodeId: string;
  status: 'pending' | 'approved' | 'rejected';
  actionDescription: string;
  estimatedCost?: number;
}

export interface Execution {
  _id?: string;
  pipelineId: string;
  status: 'running' | 'complete' | 'error' | 'aborted';
  nodeResults: NodeResult[];
  totalEstimatedCost: number;
  totalActualCost: number;
  startedAt: string;
  completedAt?: string;
}
