import Approval from '../models/Approval.js';

export class ApprovalQueue {
  constructor() {
    this.pendingApprovals = new Map();
  }

  async waitForApproval(executionId, nodeId, nodeData, actionDescription, timeoutMs = 300000) {
    const approval = await Approval.create({
      executionId,
      nodeId,
      nodeType: nodeData.type,
      nodeLabel: nodeData.label || nodeId,
      riskLevel: nodeData.riskLevel || 'reversible',
      actionDescription,
      estimatedCost: nodeData.estimatedCost || 0,
      toolName: nodeData.toolName,
      arguments: nodeData.args || {},
      expiresAt: new Date(Date.now() + timeoutMs),
    });

    return new Promise((resolve, reject) => {
      const timeoutHandle = setTimeout(() => {
        Approval.updateOne({ _id: approval._id }, { status: 'rejected', decision: 'Timeout' });
        reject(new Error(`Approval timeout for node ${nodeId}`));
      }, timeoutMs);

      this.pendingApprovals.set(nodeId, {
        approval,
        resolve,
        reject,
        timeout: timeoutHandle,
      });
    });
  }

  async approveNode(nodeId, decidedBy, decision = '') {
    const pending = this.pendingApprovals.get(nodeId);
    if (!pending) return;

    clearTimeout(pending.timeout);

    await Approval.updateOne(
      { _id: pending.approval._id },
      {
        status: 'approved',
        decidedBy,
        decision,
        decidedAt: new Date(),
      }
    );

    pending.resolve(true);
    this.pendingApprovals.delete(nodeId);
  }

  async rejectNode(nodeId, decidedBy, decision = '') {
    const pending = this.pendingApprovals.get(nodeId);
    if (!pending) return;

    clearTimeout(pending.timeout);

    await Approval.updateOne(
      { _id: pending.approval._id },
      {
        status: 'rejected',
        decidedBy,
        decision,
        decidedAt: new Date(),
      }
    );

    pending.reject(new Error(`Approval rejected: ${decision}`));
    this.pendingApprovals.delete(nodeId);
  }

  getPendingApprovals() {
    return [...this.pendingApprovals.keys()];
  }
}

export const approvalQueue = new ApprovalQueue();
