import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const SERVERS_CONFIG = {
  filesystem: {
    label: 'Filesystem',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-filesystem', '/tmp'],
    env: {},
  },

  github: {
    label: 'GitHub',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-github'],
    env: { GITHUB_PERSONAL_ACCESS_TOKEN: process.env.GITHUB_PAT || '' },
  },
};

export class MCPClientManager {
  constructor() {
    this.clients = new Map();
  }

  async init() {
    for (const [id, config] of Object.entries(SERVERS_CONFIG)) {
      try {
        await this.connect(id, config);
        console.log(`[MCP] Connected: ${id}`);
      } catch (err) {
        console.warn(`[MCP] Failed to connect ${id}:`, err.message);
      }
    }
  }

  async connect(serverId, config) {
    const env = { ...process.env, ...config.env };
    const transport = new StdioClientTransport({
      command: config.command,
      args: config.args,
      env,
    });

    const client = new Client({
      name: 'agentguard',
      version: '1.0.0',
    });

    await client.connect(transport);
    const { tools } = await client.listTools();

    this.clients.set(serverId, { client, tools });
  }

  getClient(serverId) {
    const entry = this.clients.get(serverId);
    if (!entry) {
      throw new Error(`MCP server not connected: ${serverId}`);
    }
    return entry.client;
  }

  getTools(serverId) {
    const entry = this.clients.get(serverId);
    return entry?.tools || [];
  }

  listServers() {
    return [...this.clients].map(([id, { tools }]) => ({
      id,
      label: SERVERS_CONFIG[id]?.label || id,
      toolCount: tools.length,
      tools: tools.map(t => ({ name: t.name, description: t.description, inputSchema: t.inputSchema })),
    }));
  }
}

export const mcpClientManager = new MCPClientManager();
