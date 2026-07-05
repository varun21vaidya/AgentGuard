import express from 'express';
import Execution from '../models/Execution.js';
import Approval from '../models/Approval.js';
import CostLog from '../models/CostLog.js';

const router = express.Router();

router.get('/:pipelineId', async (req, res) => {
  try {
    const executions = await Execution.find({ pipelineId: req.params.pipelineId })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(executions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/execution/:executionId', async (req, res) => {
  try {
    const execution = await Execution.findById(req.params.executionId);
    if (!execution) return res.status(404).json({ error: 'Not found' });

    const approvals = await Approval.find({ executionId: req.params.executionId });
    const costs = await CostLog.find({ executionId: req.params.executionId });

    res.json({ execution, approvals, costs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:pipelineId/export/json', async (req, res) => {
  try {
    const executions = await Execution.find({ pipelineId: req.params.pipelineId })
      .sort({ createdAt: -1 });

    const details = await Promise.all(
      executions.map(async (exec) => {
        const approvals = await Approval.find({ executionId: exec._id });
        const costs = await CostLog.find({ executionId: exec._id });
        return { ...exec.toJSON(), approvals, costs };
      })
    );

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="audit-${req.params.pipelineId}.json"`);
    res.json(details);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:pipelineId/export/csv', async (req, res) => {
  try {
    const executions = await Execution.find({ pipelineId: req.params.pipelineId })
      .sort({ createdAt: -1 });

    let csv = 'ExecutionID,NodeID,Status,Cost,Duration,Approvals\n';
    for (const exec of executions) {
      for (const nodeResult of exec.nodeResults) {
        const approvals = await Approval.countDocuments({ executionId: exec._id });
        csv += `${exec._id},${nodeResult.nodeId},${nodeResult.status},${nodeResult.actualCost || 0},${nodeResult.durationMs || 0},${approvals}\n`;
      }
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="audit-${req.params.pipelineId}.csv"`);
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
