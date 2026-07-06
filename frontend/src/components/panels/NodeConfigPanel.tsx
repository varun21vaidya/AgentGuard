import React from 'react';
import { usePipelineStore } from '../../store/pipelineStore';

export default function NodeConfigPanel() {
  const { selectedNodeId, nodes, updateNodeData } = usePipelineStore();

  if (!selectedNodeId) {
    return (
      <div className="w-80 border-l border-gray-200 p-4 bg-gray-50 flex items-center justify-center h-full">
        <p className="text-sm text-gray-500">Select a node to configure</p>
      </div>
    );
  }

  const node = nodes.find((n) => n.id === selectedNodeId);
  if (!node) return null;

  const { type, data } = node;

  return (
    <div className="w-80 border-l border-gray-200 p-4 bg-gray-50 overflow-y-auto">
      <h2 className="text-sm font-bold text-gray-800 mb-4">{type}</h2>

      <div className="mb-4">
        <label className="block text-xs font-semibold text-gray-700 mb-1">Risk Level</label>
        <select
          value={data.riskLevel || 'safe'}
          onChange={(e) => updateNodeData(selectedNodeId, { riskLevel: e.target.value as any })}
          className="w-full px-2 py-1 border rounded text-xs"
        >
          <option value="safe">Safe</option>
          <option value="reversible">Reversible</option>
          <option value="irreversible">Irreversible</option>
        </select>
      </div>

      {type === 'input' && (
        <div className="mb-4">
          <label className="block text-xs font-semibold text-gray-700 mb-1">Value</label>
          <textarea
            value={data.value || ''}
            onChange={(e) => updateNodeData(selectedNodeId, { value: e.target.value })}
            rows={4}
            className="w-full px-2 py-1 border rounded text-xs resize-none"
          />
        </div>
      )}

      {type === 'claudeNode' && (
        <>
          <div className="mb-4">
            <label className="block text-xs font-semibold text-gray-700 mb-1">Model</label>
            <select
              value={data.model || 'claude-sonnet-4-6'}
              onChange={(e) => updateNodeData(selectedNodeId, { model: e.target.value })}
              className="w-full px-2 py-1 border rounded text-xs"
            >
              <option value="claude-opus-4-6">Opus 4.6</option>
              <option value="claude-sonnet-4-6">Sonnet 4.6</option>
              <option value="claude-haiku-4-5-20251001">Haiku 4.5</option>
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-xs font-semibold text-gray-700 mb-1">System Prompt</label>
            <textarea
              value={data.systemPrompt || ''}
              onChange={(e) => updateNodeData(selectedNodeId, { systemPrompt: e.target.value })}
              rows={3}
              className="w-full px-2 py-1 border rounded text-xs resize-none"
            />
          </div>
          <div className="mb-4">
            <label className="block text-xs font-semibold text-gray-700 mb-1">Max Tokens</label>
            <input
              type="number"
              value={data.maxTokens || 1024}
              onChange={(e) => updateNodeData(selectedNodeId, { maxTokens: parseInt(e.target.value) })}
              className="w-full px-2 py-1 border rounded text-xs"
            />
          </div>
          <div className="mb-4">
            <label className="block text-xs font-semibold text-gray-700 mb-1">Temperature</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={data.temperature || 1}
              onChange={(e) => updateNodeData(selectedNodeId, { temperature: parseFloat(e.target.value) })}
              className="w-full"
            />
            <div className="text-xs text-gray-600 mt-1">{(data.temperature || 1).toFixed(1)}</div>
          </div>
        </>
      )}

      {type === 'geminiNode' && (
        <>
          <div className="mb-4">
            <label className="block text-xs font-semibold text-gray-700 mb-1">Model</label>
            <select
              value={data.model || 'gemini-2.0-flash'}
              onChange={(e) => updateNodeData(selectedNodeId, { model: e.target.value })}
              className="w-full px-2 py-1 border rounded text-xs"
            >
              <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
              <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
              <option value="gemini-2.0-pro">Gemini 2.0 Pro</option>
              <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-xs font-semibold text-gray-700 mb-1">System Prompt</label>
            <textarea
              value={data.systemPrompt || ''}
              onChange={(e) => updateNodeData(selectedNodeId, { systemPrompt: e.target.value })}
              rows={3}
              className="w-full px-2 py-1 border rounded text-xs resize-none"
            />
          </div>
          <div className="mb-4">
            <label className="block text-xs font-semibold text-gray-700 mb-1">Max Tokens</label>
            <input
              type="number"
              value={data.maxTokens || 1024}
              onChange={(e) => updateNodeData(selectedNodeId, { maxTokens: parseInt(e.target.value) })}
              className="w-full px-2 py-1 border rounded text-xs"
            />
          </div>
          <div className="mb-4">
            <label className="block text-xs font-semibold text-gray-700 mb-1">Temperature</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={data.temperature || 1}
              onChange={(e) => updateNodeData(selectedNodeId, { temperature: parseFloat(e.target.value) })}
              className="w-full"
            />
            <div className="text-xs text-gray-600 mt-1">{(data.temperature || 1).toFixed(1)}</div>
          </div>
        </>
      )}

      {type === 'firecrawlNode' && (
        <>
          <div className="mb-4">
            <label className="block text-xs font-semibold text-gray-700 mb-1">Action</label>
            <select
              value={data.action || 'search'}
              onChange={(e) => updateNodeData(selectedNodeId, { action: e.target.value as any })}
              className="w-full px-2 py-1 border rounded text-xs"
            >
              <option value="search">Search</option>
              <option value="scrape">Scrape</option>
              <option value="interact">Interact</option>
            </select>
          </div>

          {(data.action === 'search') && (
            <>
              <div className="mb-4">
                <label className="block text-xs font-semibold text-gray-700 mb-1">Query</label>
                <textarea
                  value={data.query || ''}
                  onChange={(e) => updateNodeData(selectedNodeId, { query: e.target.value })}
                  rows={2}
                  className="w-full px-2 py-1 border rounded text-xs resize-none"
                />
              </div>
              <div className="mb-4">
                <label className="block text-xs font-semibold text-gray-700 mb-1">Result Limit</label>
                <input
                  type="number"
                  value={data.limit || 10}
                  onChange={(e) => updateNodeData(selectedNodeId, { limit: parseInt(e.target.value) || 10 })}
                  className="w-full px-2 py-1 border rounded text-xs"
                />
              </div>
            </>
          )}

          {(data.action === 'scrape' || data.action === 'interact') && (
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-700 mb-1">URL</label>
              <input
                type="text"
                value={data.url || ''}
                onChange={(e) => updateNodeData(selectedNodeId, { url: e.target.value })}
                className="w-full px-2 py-1 border rounded text-xs"
              />
            </div>
          )}
        </>
      )}

      {type === 'condition' && (
        <>
          <div className="mb-4">
            <label className="block text-xs font-semibold text-gray-700 mb-1">Operator</label>
            <select
              value={data.operator || '=='}
              onChange={(e) => updateNodeData(selectedNodeId, { operator: e.target.value as any })}
              className="w-full px-2 py-1 border rounded text-xs"
            >
              <option value="==">==</option>
              <option value="!=">!=</option>
              <option value=">">&gt;</option>
              <option value="<">&lt;</option>
              <option value="contains">contains</option>
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-xs font-semibold text-gray-700 mb-1">Value</label>
            <input
              type="text"
              value={data.value || ''}
              onChange={(e) => updateNodeData(selectedNodeId, { value: e.target.value })}
              className="w-full px-2 py-1 border rounded text-xs"
            />
          </div>
        </>
      )}

      {type === 'output' && (
        <>
          <div className="mb-4">
            <label className="block text-xs font-semibold text-gray-700 mb-1">Label</label>
            <input
              type="text"
              value={data.label || ''}
              onChange={(e) => updateNodeData(selectedNodeId, { label: e.target.value })}
              placeholder="e.g. Claude Summary"
              className="w-full px-2 py-1 border rounded text-xs"
            />
          </div>
          <div className="mb-4">
            <label className="block text-xs font-semibold text-gray-700 mb-1">Template</label>
            <textarea
              value={data.value || ''}
              onChange={(e) => updateNodeData(selectedNodeId, { value: e.target.value })}
              placeholder="{{input}}"
              rows={3}
              className="w-full px-2 py-1 border rounded text-xs resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">Use {'{{handle}}'} to interpolate connected node output</p>
          </div>
        </>
      )}
    </div>
  );
}
