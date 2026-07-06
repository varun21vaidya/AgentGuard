# AgentGuard — AI Workflow Builder with Cost Governance & Approval Gates

Build, execute, and audit multi-step AI agent pipelines with live cost tracking, human approval gates, and MCP tool integration.

## Architecture

```
Browser (React + React Flow + Zustand)
  │
  ├── WebSocket (real-time streaming + approval events)
  └── REST API (CRUD pipelines, audit export, cost history)
        │
  Node.js Backend (Express + ws)
  │
  ├── PipelineExecutor — topological sort, DAG validation, node dispatch
  ├── CostEstimator — pre-run estimate + actual cost per model
  ├── RiskClassifier — safe / reversible / irreversible
  ├── ApprovalQueue — promise-based human-in-the-loop
  ├── ClaudeService — Anthropic Claude streaming (Opus, Sonnet, Haiku)
  ├── GeminiService — Google Gemini streaming (2.5 Flash, 2.0 Flash, Pro)
  ├── FirecrawlService — web search + scraping (direct REST)
  └── MCPClientManager — Filesystem, GitHub tool servers
        │
  MongoDB ────── Claude API ────── Gemini API ────── MCP Servers
```

## Quick Start

```bash
# Prerequisites: Node.js 20+, MongoDB 7+

# Backend
cd backend
cp .env.example .env   # Add your API keys
npm install
npm run dev            # http://localhost:3001

# Frontend (separate terminal)
cd frontend
npm install
npm run dev            # http://localhost:5173

# MongoDB (Docker)
docker run -d -p 27017:27017 --name agentguard-mongo mongo:7
```

## Interview Demo Pipeline

Build this 8-node pipeline to showcase the full platform:

```
[Input: "What are the latest breakthroughs in AI agents?"]
       │
       ▼
[Firecrawl: search "{{input1}}" limit=5]
       │
       ▼
[Gemini 2.5 Flash: "{{input}}\n\nSummarize these. Highlight key players."]
       │
       ▼
[Condition: contains "breakthrough"]
       │                    │
      true                 false
       │                    │
       ▼                    ▼
[Claude: bullish alert]   [Claude: neutral summary]
       │                    │
       ▼                    ▼
[Output: "BREAKTHROUGH!"] [Output: "General Update"]
```

**What it demonstrates:**
- Multi-provider chaining (Gemini cheap → Claude expensive)
- Web enrichment via Firecrawl (live search mid-pipeline)
- Conditional branching with dead-branch skipping
- Streaming token output via WebSocket
- Real-time cost estimation per node
- Human approval gates (set a node to "irreversible" to trigger)

## Features

| Feature | Description |
|---|---|
| **7 node types** | Input, Claude AI, Gemini AI, Firecrawl, MCP Tool, Condition, Output |
| **Live streaming** | Claude & Gemini tokens stream via WebSocket in real-time |
| **Cost tracking** | Pre-run estimates + actual cost per model, per execution |
| **Approval gates** | Irreversible actions pause pipeline for human review (5-min timeout) |
| **Audit trail** | Every execution logged to MongoDB, exportable as JSON/CSV |
| **Condition branching** | True/false routing with `==`, `!=`, `>`, `<`, `contains` operators |
| **MCP tools** | Filesystem (read/write), GitHub (PRs, issues, repos) |
| **Firecrawl** | Web search, scrape, and browser interact (direct REST API) |
| **Pipeline sharing** | Auto-generated share links via `shareId` |
| **Run history** | Past executions with cost, duration, and output |

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `MONGODB_URI` | Yes | MongoDB connection string |
| `GEMINI_API_KEY` | One of | Google Gemini API key |
| `ANTHROPIC_API_KEY` | One of | Anthropic Claude API key |
| `FIRECRAWL_API_KEY` | No | Firecrawl for web search/scrape |
| `GITHUB_PAT` | No | GitHub personal access token for MCP |
| `PORT` | No | Backend port (default 3001) |
| `FRONTEND_URL` | No | CORS origin (default http://localhost:5173) |
| `NODE_ENV` | No | `development` or `production` |

## Deployment

### Backend → Railway

```bash
cd backend
railway login && railway init && railway up
# Set env vars in Railway dashboard
```

### Frontend → Vercel

```bash
cd frontend
vercel --prod
# Set VITE_API_URL and VITE_WS_URL in Vercel dashboard
```

## Keyboard Shortcuts

- `Ctrl+S` — Save pipeline
- `Delete` — Remove selected node
- `Ctrl+Z` — Undo (via Zustand history)
