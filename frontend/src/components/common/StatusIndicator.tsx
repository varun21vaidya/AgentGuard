import React from 'react';

interface StatusIndicatorProps {
  status: 'idle' | 'running' | 'done' | 'error';
}

const colors: Record<string, string> = {
  idle: 'bg-gray-400',
  running: 'bg-yellow-400 animate-pulse',
  done: 'bg-green-500',
  error: 'bg-red-500',
};

export default function StatusIndicator({ status }: StatusIndicatorProps) {
  return (
    <span className={`inline-block w-2 h-2 rounded-full ${colors[status]}`} />
  );
}
