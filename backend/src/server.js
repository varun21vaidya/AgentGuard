import express from 'express';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { PipelineExecutor } from './services/orchestrator.js';
import { mcpClientManager } from './services/mcpClientManager.js';
import { approvalQueue } from './services/approvalQueue.js';
import pipelinesRouter from './routes/pipelines.js';
import auditRouter from './routes/audit.js';
import Pipeline from './models/Pipeline.js';
import Execution from './models/Execution.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json());

app.use('/api/pipelines', pipelinesRouter);
app.use('/api/audit', auditRouter);

app.get('/api/mcp/servers', (_req, res) => {
  res.json(mcpClientManager.listServers());
});

app.get('/api/mcp/tools/:serverId', (req, res) => {
  try {
    const tools = mcpClientManager.getTools(req.params.serverId);
    res.json(tools);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

app.get('/health', (_req, res) => {
  res.json({ ok: true, timestamp: new Date() });
});

app.use(errorHandler);

const executors = new Map();

wss.on('connection', (ws) => {
  console.log('[WS] Client connected');

  ws.on('message', async (raw) => {
    try {
      const msg = JSON.parse(raw);

      if (msg.type === 'execute') {
        const pipeline = await Pipeline.findById(msg.pipelineId);
        if (!pipeline) {
          ws.send(JSON.stringify({ type: 'error', error: 'Pipeline not found' }));
          return;
        }

        const execution = new Execution({
          pipelineId: msg.pipelineId,
          pipelineName: pipeline.name,
        });
        await execution.save();

        const executor = new PipelineExecutor(ws, pipeline, execution._id);
        executors.set(execution._id.toString(), executor);

        ws.send(JSON.stringify({ type: 'execution:started', executionId: execution._id }));

        executor.execute().catch((err) => {
          ws.send(JSON.stringify({ type: 'error', error: err.message }));
        });
      }

      if (msg.type === 'abort') {
        const executor = executors.get(msg.executionId);
        if (executor) {
          executor.abort();
          ws.send(JSON.stringify({ type: 'execution:aborted' }));
        }
      }

      if (msg.type === 'approve') {
        await approvalQueue.approveNode(msg.nodeId, msg.decidedBy, msg.decision);
        ws.send(JSON.stringify({ type: 'node:approved', nodeId: msg.nodeId }));
      }

      if (msg.type === 'reject') {
        await approvalQueue.rejectNode(msg.nodeId, msg.decidedBy, msg.decision);
        ws.send(JSON.stringify({ type: 'node:rejected', nodeId: msg.nodeId }));
      }
    } catch (err) {
      console.error('[WS] Error:', err);
      ws.send(JSON.stringify({ type: 'error', error: err.message }));
    }
  });

  ws.on('close', () => {
    console.log('[WS] Client disconnected');
  });
});

async function start() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('[DB] Connected to MongoDB');

    await mcpClientManager.init();
    console.log('[MCP] Servers initialized');

    const PORT = process.env.PORT || 3001;
    server.listen(PORT, () => {
      console.log(`[SERVER] Listening on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('[STARTUP] Error:', err);
    process.exit(1);
  }
}

start();
