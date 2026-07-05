export interface WsEvent {
  type: string;
  [key: string]: unknown;
}

export interface NodeStartEvent extends WsEvent {
  type: 'node:start';
  nodeId: string;
}

export interface NodeStreamEvent extends WsEvent {
  type: 'node:stream';
  nodeId: string;
  delta: string;
}

export interface NodeCompleteEvent extends WsEvent {
  type: 'node:complete';
  nodeId: string;
  output: string;
  actualCost: number;
  durationMs: number;
}

export interface NodeErrorEvent extends WsEvent {
  type: 'node:error';
  nodeId: string;
  error: string;
}

export interface NodeAwaitingApprovalEvent extends WsEvent {
  type: 'node:awaiting_approval';
  nodeId: string;
  nodeLabel: string;
  actionDescription: string;
  estimatedCost: number;
}

export interface PipelineEstimatesEvent extends WsEvent {
  type: 'pipeline:estimates';
  estimates: Record<string, { estimatedCostUsd: number; model: string }>;
}

export interface PipelineCompleteEvent extends WsEvent {
  type: 'pipeline:complete';
  totalCost: number;
  durationMs: number;
}

export interface PipelineErrorEvent extends WsEvent {
  type: 'pipeline:error';
  error: string;
}
