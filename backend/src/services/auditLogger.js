import Execution from '../models/Execution.js';
import CostLog from '../models/CostLog.js';

export class AuditLogger {
  async logNodeComplete(executionId, nodeId, result) {
    await Execution.updateOne(
      { _id: executionId },
      {
        $push: {
          nodeResults: {
            nodeId,
            status: 'complete',
            output: result.output,
            actualCost: result.actualCost,
            durationMs: result.durationMs,
            completedAt: new Date(),
          },
        },
      }
    );

    if (result.actualCost) {
      await CostLog.create({
        executionId,
        nodeId,
        actualCostUsd: result.actualCost,
      });
    }
  }

  async logNodeError(executionId, nodeId, error) {
    await Execution.updateOne(
      { _id: executionId },
      {
        $push: {
          nodeResults: {
            nodeId,
            status: 'error',
            error: error.message,
            completedAt: new Date(),
          },
        },
      }
    );
  }

  async logApprovalDecision(executionId, nodeId, decision, decidedBy) {
    await Execution.updateOne(
      { _id: executionId },
      {
        $inc: {
          'approvalsSummary.total': 1,
          [`approvalsSummary.${decision === 'approved' ? 'approved' : 'rejected'}`]: 1,
        },
      }
    );
  }
}

export const auditLogger = new AuditLogger();
