import express from 'express';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { PipelineExecutor } from './services/orchestrator.js';
import { mcpClientManager } from './services/mcpClientManager.js';
import { approvalQueue } from './services/approvalQueue.js';
import { checkRateLimit } from './middleware/rateLimiter.js';
import { verifyWsToken } from './middleware/authMiddleware.js';
import pipelinesRouter from './routes/pipelines.js';
import publicRouter from './routes/public.js';
import auditRouter from './routes/audit.js';
import authRouter from './routes/auth.js';
import Pipeline from './models/Pipeline.js';
import Execution from './models/Execution.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

if (!process.env.FRONTEND_URL) {
  console.error('[STARTUP] FRONTEND_URL not set — refusing to start with open CORS.');
  process.exit(1);
}
if (!process.env.JWT_SECRET) {
  console.error('[STARTUP] JWT_SECRET not set.');
  process.exit(1);
}

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

app.use(cors({ origin: process.env.FRONTEND_URL }));
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/public', publicRouter);
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

wss.on('connection', (ws, req) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const token = url.searchParams.get('token');
  const payload = verifyWsToken(token);

  if (!payload) {
    ws.send(JSON.stringify({ type: 'error', error: 'Unauthorized' }));
    ws.close();
    return;
  }

  ws.userId = payload.sub;
  console.log('[WS] Client connected:', payload.email);

  ws.on('message', async (raw) => {
    try {
      const msg = JSON.parse(raw);

      if (msg.type === 'execute') {
        const pipeline = await Pipeline.findOne({ _id: msg.pipelineId, createdBy: ws.userId });
        if (!pipeline) {
          ws.send(JSON.stringify({ type: 'error', error: 'Pipeline not found' }));
          return;
        }

        const rateCheck = checkRateLimit(ws.userId);
        if (!rateCheck.allowed) {
          ws.send(JSON.stringify({
            type: 'error',
            error: `Rate limited. Retry in ${Math.ceil(rateCheck.retryAfterMs / 1000)}s.`,
          }));
          return;
        }

        const execution = new Execution({
          pipelineId: msg.pipelineId,
          pipelineName: pipeline.name,
          status: msg.dryRun ? 'dry-run' : 'running',
        });
        await execution.save();

        const executionKey = execution._id.toString();
        const executor = new PipelineExecutor(ws, pipeline, execution._id, { dryRun: !!msg.dryRun });
        executors.set(executionKey, executor);

        ws.send(JSON.stringify({ type: 'execution:started', executionId: execution._id }));

        executor.execute()
          .catch((err) => {
            ws.send(JSON.stringify({ type: 'error', error: err.message }));
          })
          .finally(() => {
            executors.delete(executionKey);
          });
      }

      if (msg.type === 'abort') {
        const executor = executors.get(msg.executionId);
        if (executor) {
          executor.abort();
          executors.delete(msg.executionId);
          ws.send(JSON.stringify({ type: 'execution:aborted' }));
        }
      }

      if (msg.type === 'approve') {
        await approvalQueue.approveNode(msg.executionId, msg.nodeId, msg.decidedBy, msg.decision);
        ws.send(JSON.stringify({ type: 'node:approved', nodeId: msg.nodeId }));
      }

      if (msg.type === 'reject') {
        await approvalQueue.rejectNode(msg.executionId, msg.nodeId, msg.decidedBy, msg.decision);
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
