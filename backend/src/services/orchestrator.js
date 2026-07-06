import { costEstimator } from './costEstimator.js';
import { riskClassifier } from './riskClassifier.js';
import { approvalQueue } from './approvalQueue.js';
import { claudeService } from './claudeService.js';
import { geminiService } from './geminiService.js';
import { firecrawlService } from './firecrawlService.js';
import { mcpClientManager } from './mcpClientManager.js';
import { auditLogger } from './auditLogger.js';
import Execution from '../models/Execution.js';
import Approval from '../models/Approval.js';

export class PipelineExecutor {
  constructor(ws, pipelineDoc, executionId) {
    this.ws = ws;
    this.pipelineDoc = pipelineDoc;
    this.executionId = executionId;
    this.results = {};
    this.aborted = false;
    this.startTime = Date.now();
  }

  async execute() {
    const { nodes, edges } = this.pipelineDoc;

    try {
      const order = this.topologicalSort(nodes, edges);
      const skipped = new Set();

      const estimates = {};
      for (const node of nodes) {
        if (node.type === 'claudeNode') {
          estimates[node.id] = await costEstimator.estimateClaudeCall(node.data);
        }
        if (node.type === 'geminiNode') {
          estimates[node.id] = await costEstimator.estimateGeminiCall(node.data);
        }
      }
      this.emit({ type: 'pipeline:estimates', estimates });

      for (const nodeId of order) {
        if (this.aborted) break;
        if (skipped.has(nodeId)) {
          this.emit({ type: 'node:skipped', nodeId });
          continue;
        }

        const node = nodes.find(n => n.id === nodeId);
        const inputs = this.collectInputs(nodeId, edges);

        this.emit({ type: 'node:start', nodeId });

        try {
          const result = await this.executeNode(node, inputs);
          this.results[nodeId] = result;

          if (node.type === 'condition' && result.branchTaken) {
            const untakenHandle = result.branchTaken === 'true' ? 'false' : 'true';
            const untakenEdges = edges.filter(
              e => e.source === nodeId && e.sourceHandle === untakenHandle
            );
            for (const edge of untakenEdges) {
              this.markDownstreamSkipped(edge.target, nodes, edges, skipped);
            }
          }

          await auditLogger.logNodeComplete(this.executionId, nodeId, result);

          this.emit({
            type: 'node:complete',
            nodeId,
            nodeType: node.type,
            output: result.output,
            actualCost: result.actualCost,
            durationMs: result.durationMs,
          });
        } catch (err) {
          this.emit({ type: 'node:error', nodeId, error: err.message });
          throw err;
        }
      }

      const totalActualCost = Object.values(this.results)
        .reduce((sum, r) => sum + (r.actualCost || 0), 0);

      const durationMs = Date.now() - this.startTime;
      await Execution.updateOne(
        { _id: this.executionId },
        {
          status: 'complete',
          totalActualCost,
          completedAt: new Date(),
          durationMs,
        }
      );

      this.emit({ type: 'pipeline:complete', totalCost: totalActualCost, durationMs });
    } catch (err) {
      this.emit({ type: 'pipeline:error', error: err.message });
      await Execution.updateOne(
        { _id: this.executionId },
        { status: 'error', completedAt: new Date() }
      );
      throw err;
    }
  }

  markDownstreamSkipped(startNodeId, nodes, edges, skipped) {
    const queue = [startNodeId];
    while (queue.length > 0) {
      const id = queue.shift();
      if (skipped.has(id)) continue;

      const incoming = edges.filter(e => e.target === id);
      const hasLiveIncoming = incoming.some(e => !skipped.has(e.source) && e.source !== startNodeId);
      if (hasLiveIncoming && id !== startNodeId) continue;

      skipped.add(id);
      const outgoing = edges.filter(e => e.source === id);
      for (const edge of outgoing) queue.push(edge.target);
    }
  }

  async executeNode(node, inputs) {
    const startTime = Date.now();
    let actualCost = 0;
    let output = '';

    switch (node.type) {
      case 'input': {
        output = this.interpolate(node.data.value || '', inputs);
        break;
      }

      case 'claudeNode': {
        const prompt = this.interpolate(node.data.systemPrompt || '', inputs);
        const riskLevel = riskClassifier.getEffectiveRisk(node.data);

        if (riskLevel === 'irreversible') {
          const approval = await approvalQueue.waitForApproval(
            this.ws,
            this.executionId,
            node.id,
            node.data,
            'Claude call marked as irreversible',
            riskLevel
          );
          if (!approval) throw new Error('Approval denied or timed out');
        }

        const result = await claudeService.streamCompletion({
          systemPrompt: node.data.systemPrompt || '',
          model: node.data.model || 'claude-sonnet-4-6',
          maxTokens: node.data.maxTokens || 1024,
          temperature: node.data.temperature || 1,
          prompt,
          onDelta: (delta) => {
            output += delta;
            this.emit({ type: 'node:stream', nodeId: node.id, delta });
          },
        });

        actualCost = result.actualCostUsd;
        break;
      }

      case 'geminiNode': {
        const prompt = this.interpolate(node.data.systemPrompt || '', inputs);
        const riskLevel = riskClassifier.getEffectiveRisk(node.data);

        if (riskLevel === 'irreversible') {
          const approval = await approvalQueue.waitForApproval(
            this.ws,
            this.executionId,
            node.id,
            node.data,
            'Gemini call marked as irreversible',
            riskLevel
          );
          if (!approval) throw new Error('Approval denied or timed out');
        }

        const result = await geminiService.streamCompletion({
          systemPrompt: node.data.systemPrompt || '',
          model: node.data.model || 'gemini-2.0-flash',
          maxTokens: node.data.maxTokens || 1024,
          temperature: node.data.temperature || 1,
          prompt,
          onDelta: (delta) => {
            output += delta;
            this.emit({ type: 'node:stream', nodeId: node.id, delta });
          },
        });

        actualCost = result.actualCostUsd;
        break;
      }

      case 'firecrawlNode': {
        const action = node.data.action || 'search';
        const riskLevel = riskClassifier.getEffectiveRisk(node.data);

        if (riskLevel === 'irreversible') {
          const approval = await approvalQueue.waitForApproval(
            this.ws,
            this.executionId,
            node.id,
            node.data,
            `Firecrawl ${action}: ${node.data.query || node.data.url || ''}`,
            riskLevel
          );
          if (!approval) throw new Error('Approval denied or timed out');
        }

        switch (action) {
          case 'search': {
            const query = this.interpolate(node.data.query || '', inputs);
            const results = await firecrawlService.search(query, node.data.limit || 10);
            output = results.map(r => `[${r.title}](${r.url})\n${r.description}`).join('\n\n');
            break;
          }
          case 'scrape': {
            const url = this.interpolate(node.data.url || '', inputs);
            const result = await firecrawlService.scrape(url);
            output = result.content;
            break;
          }
          case 'interact': {
            const url = this.interpolate(node.data.url || '', inputs);
            const actions = node.data.actions || [{ type: 'click', selector: 'body' }];
            const result = await firecrawlService.interact(url, actions);
            output = result.content;
            break;
          }
          default:
            throw new Error(`Unknown firecrawl action: ${action}`);
        }
        break;
      }

      case 'mcpTool': {
        const riskLevel = riskClassifier.getEffectiveRisk(node.data);

        if (riskLevel === 'irreversible') {
          const approval = await approvalQueue.waitForApproval(
            this.ws,
            this.executionId,
            node.id,
            node.data,
            `MCP call: ${node.data.serverId}/${node.data.toolName}`,
            riskLevel
          );
          if (!approval) throw new Error('Approval denied or timed out');
        }

        const client = mcpClientManager.getClient(node.data.serverId);
        const args = this.interpolateObject(node.data.args || {}, inputs);

        const result = await client.callTool({
          name: node.data.toolName,
          arguments: args,
        });

        output = result.content?.[0]?.text || '';
        break;
      }

      case 'condition': {
        const left = inputs[node.data.leftHandle || 'input'] || '';
        const right = node.data.value || '';
        const op = node.data.operator;

        let conditionResult = false;
        switch (op) {
          case '==': conditionResult = left === right; break;
          case '!=': conditionResult = left !== right; break;
          case '>': conditionResult = parseFloat(left) > parseFloat(right); break;
          case '<': conditionResult = parseFloat(left) < parseFloat(right); break;
          case 'contains': conditionResult = String(left).includes(right); break;
        }

        output = left;
        return {
          output,
          actualCost: 0,
          durationMs: Date.now() - startTime,
          branchTaken: conditionResult ? 'true' : 'false',
        };
      }

      case 'output': {
        output = this.interpolate(node.data.value || '', inputs);
        break;
      }

      default:
        throw new Error(`Unknown node type: ${node.type}`);
    }

    return {
      output,
      actualCost,
      durationMs: Date.now() - startTime,
    };
  }

  topologicalSort(nodes, edges) {
    const adj = new Map(nodes.map(n => [n.id, []]));
    const inDegree = new Map(nodes.map(n => [n.id, 0]));

    for (const edge of edges) {
      if (!adj.has(edge.source)) adj.set(edge.source, []);
      adj.get(edge.source).push(edge.target);
      inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
    }

    const queue = [...inDegree].filter(([, degree]) => degree === 0).map(([id]) => id);
    const sorted = [];

    while (queue.length > 0) {
      const nodeId = queue.shift();
      sorted.push(nodeId);

      for (const neighbor of adj.get(nodeId) || []) {
        inDegree.set(neighbor, inDegree.get(neighbor) - 1);
        if (inDegree.get(neighbor) === 0) {
          queue.push(neighbor);
        }
      }
    }

    if (sorted.length !== nodes.length) {
      throw new Error('Cycle detected in pipeline');
    }

    return sorted;
  }

  collectInputs(nodeId, edges) {
    const inputs = {};
    for (const edge of edges) {
      if (edge.target === nodeId) {
        const handle = edge.targetHandle || 'input';
        inputs[handle] = this.results[edge.source]?.output || '';
      }
    }
    return inputs;
  }

  interpolate(template, inputs) {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
      return inputs[key] || inputs.input || '';
    });
  }

  interpolateObject(obj, inputs) {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        result[key] = this.interpolate(value, inputs);
      } else if (typeof value === 'object' && value !== null) {
        result[key] = this.interpolateObject(value, inputs);
      } else {
        result[key] = value;
      }
    }
    return result;
  }

  emit(data) {
    if (this.ws && this.ws.readyState === 1) {
      this.ws.send(JSON.stringify(data));
    }
  }

  abort() {
    this.aborted = true;
  }
}
