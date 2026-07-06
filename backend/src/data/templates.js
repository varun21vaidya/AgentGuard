export const STARTER_TEMPLATES = [
  {
    name: 'Research Agent',
    description: 'Searches the web, then summarizes findings with Claude',
    nodes: [
      { id: 'input-1', type: 'input', position: { x: 50, y: 50 }, data: { label: 'input', value: 'Latest developments in renewable energy' } },
      { id: 'firecrawl-1', type: 'firecrawlNode', position: { x: 300, y: 50 }, data: { label: 'firecrawlNode', action: 'search', query: '{{input}}', limit: 5, riskLevel: 'safe' } },
      { id: 'claude-1', type: 'claudeNode', position: { x: 550, y: 50 }, data: { label: 'claudeNode', model: 'claude-sonnet-4-6', systemPrompt: 'Summarize these search results in 3 bullet points: {{input}}', maxTokens: 512, riskLevel: 'safe' } },
      { id: 'output-1', type: 'output', position: { x: 800, y: 50 }, data: { label: 'output' } },
    ],
    edges: [
      { id: 'e1', source: 'input-1', target: 'firecrawl-1' },
      { id: 'e2', source: 'firecrawl-1', target: 'claude-1' },
      { id: 'e3', source: 'claude-1', target: 'output-1' },
    ],
  },
  {
    name: 'Safe File Writer',
    description: 'Demonstrates the approval gate — writing a file requires human sign-off',
    nodes: [
      { id: 'input-2', type: 'input', position: { x: 50, y: 50 }, data: { label: 'input', value: 'Hello from AgentGuard' } },
      { id: 'mcp-1', type: 'mcpTool', position: { x: 300, y: 50 }, data: { label: 'mcpTool', serverId: 'filesystem', toolName: 'write_file', args: { path: '/tmp/agentguard-demo.txt', content: '{{input}}' }, riskLevel: 'irreversible' } },
      { id: 'output-2', type: 'output', position: { x: 550, y: 50 }, data: { label: 'output' } },
    ],
    edges: [
      { id: 'e4', source: 'input-2', target: 'mcp-1' },
      { id: 'e5', source: 'mcp-1', target: 'output-2' },
    ],
  },
];
