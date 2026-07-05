export type NodeStatus = 'idle' | 'running' | 'done' | 'error';

export const statusColors: Record<NodeStatus, string> = {
  idle: 'border-gray-300',
  running: 'border-purple-500 bg-purple-50',
  done: 'border-green-500 bg-green-50',
  error: 'border-red-500 bg-red-50',
};
