import Approval from '../models/Approval.js';

export class ApprovalQueue {
  constructor() {
    this.pendingApprovals = new Map();
  }

  async waitForApproval(ws, executionId, nodeId, nodeData, actionDescription, effectiveRiskLevel, timeoutMs = 300000) {
    const approval = await Approval.create({
      executionId,
      nodeId,
      nodeType: nodeData.type,
      nodeLabel: nodeData.label || nodeId,
      riskLevel: effectiveRiskLevel,
      actionDescription,
      estimatedCost: nodeData.estimatedCost || 0,
      toolName: nodeData.toolName,
      arguments: nodeData.args || {},
      expiresAt: new Date(Date.now() + timeoutMs),
    });

    this.emit(ws, {
      type: 'node:awaiting_approval',
      nodeId,
      executionId: String(executionId),
      nodeLabel: nodeData.label || nodeId,
      actionDescription,
      estimatedCost: nodeData.estimatedCost || 0,
      riskLevel: effectiveRiskLevel,
    });

    const key = `${executionId}:${nodeId}`;

    return new Promise((resolve, reject) => {
      const timeoutHandle = setTimeout(async () => {
        await Approval.updateOne({ _id: approval._id }, { status: 'rejected', decision: 'Timeout' });
        this.pendingApprovals.delete(key);
        reject(new Error(`Approval timeout for node ${nodeId}`));
      }, timeoutMs);

      this.pendingApprovals.set(key, {
        approval,
        resolve,
        reject,
        timeout: timeoutHandle,
      });
    });
  }

  async approveNode(executionId, nodeId, decidedBy, decision = '') {
    const key = `${executionId}:${nodeId}`;
    const pending = this.pendingApprovals.get(key);
    if (!pending) return;

    clearTimeout(pending.timeout);

    await Approval.updateOne(
      { _id: pending.approval._id },
      { status: 'approved', decidedBy, decision, decidedAt: new Date() }
    );

    pending.resolve(true);
    this.pendingApprovals.delete(key);
  }

  async rejectNode(executionId, nodeId, decidedBy, decision = '') {
    const key = `${executionId}:${nodeId}`;
    const pending = this.pendingApprovals.get(key);
    if (!pending) return;

    clearTimeout(pending.timeout);

    await Approval.updateOne(
      { _id: pending.approval._id },
      { status: 'rejected', decidedBy, decision, decidedAt: new Date() }
    );

    pending.reject(new Error(`Approval rejected: ${decision}`));
    this.pendingApprovals.delete(key);
  }

  emit(ws, data) {
    if (ws && ws.readyState === 1) {
      ws.send(JSON.stringify(data));
    }
  }

  getPendingApprovals() {
    return [...this.pendingApprovals.keys()];
  }
}

export const approvalQueue = new ApprovalQueue();
