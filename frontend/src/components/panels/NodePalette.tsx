import React from 'react';

const NODES = [
  { type: 'input', label: 'Input', color: 'bg-blue-100 text-blue-700' },
  { type: 'claudeNode', label: 'Claude AI', color: 'bg-purple-100 text-purple-700' },
  { type: 'geminiNode', label: 'Gemini AI', color: 'bg-blue-100 text-blue-700' },
  { type: 'firecrawlNode', label: 'Firecrawl', color: 'bg-red-100 text-red-700' },
  { type: 'mcpTool', label: 'MCP Tool', color: 'bg-green-100 text-green-700' },
  { type: 'condition', label: 'Condition', color: 'bg-orange-100 text-orange-700' },
  { type: 'output', label: 'Output', color: 'bg-blue-100 text-blue-700' },
];

export default function NodePalette() {
  const onDragStart = (event: React.DragEvent, type: string) => {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('application/reactflow', type);
  };

  return (
    <div className="w-48 border-r border-gray-200 p-4 bg-gray-50 overflow-y-auto">
      <h2 className="text-sm font-bold text-gray-800 mb-4">Node Palette</h2>
      <div className="flex flex-col gap-2">
        {NODES.map((node) => (
          <div
            key={node.type}
            draggable
            onDragStart={(e) => onDragStart(e, node.type)}
            className={`p-2 rounded cursor-move text-xs font-semibold select-none ${node.color} hover:opacity-80 transition`}
          >
            {node.label}
          </div>
        ))}
      </div>
    </div>
  );
}
