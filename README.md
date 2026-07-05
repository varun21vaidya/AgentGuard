# AgentGuard — AI Workflow Builder with Cost Governance & Approval Gates

Build, execute, and audit multi-step AI agent pipelines with live cost tracking, human approval gates, and MCP tool integration.

## Architecture

```
Browser (React + React Flow)
  │
  ├── WebSocket (real-time streaming + approval events)
  └── REST API (CRUD pipelines, audit export)
        │
  Node.js Backend (Express + ws)
  │
  ├── PipelineExecutor (topological sort, node dispatch)
  ├── CostEstimator (pre/post run cost per model)
  ├── RiskClassifier (safe / reversible / irreversible)
  ├── ApprovalQueue (promise-based human-in-the-loop)
  ├── ClaudeService (Anthropic streaming)
  └── MCPClientManager (Filesystem, Brave Search, GitHub)
        │
  MongoDB ────── Claude API ────── MCP Servers
```

## Quick Start

```bash
# Backend
cd backend
cp .env.example .env   # Edit with your API keys
npm install
npm run dev            # http://localhost:3001

# Frontend (separate terminal)
cd frontend
npm install
npm run dev            # http://localhost:5173

# MongoDB (Docker)
docker run -d -p 27017:27017 --name agentguard-mongo mongo:7
```

## Features

- **5 node types:** Input, Claude AI, MCP Tool, Condition, Output
- **Live streaming:** Claude tokens stream via WebSocket with real-time cost
- **Cost tracking:** Pre-run estimates + actual cost per model
- **Approval gates:** Irreversible actions pause for human review
- **Audit trail:** Every execution logged to MongoDB, exportable as JSON/CSV
- **MCP integration:** Filesystem, Brave Search, GitHub tools
- **Pipeline sharing:** UUID-based shareable links
- **Run history:** Past executions with cost and duration

## Deployment

### Backend → Railway

```bash
cd backend
railway login && railway init && railway up
# Add env vars in Railway dashboard
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
` Ctrl+Z — Undo (via Zustand history)`
