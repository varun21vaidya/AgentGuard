import mongoose from 'mongoose';

const NodeResultSchema = new mongoose.Schema({
  nodeId: { type: String, required: true },
  nodeType: { type: String },
  status: { type: String, enum: ['pending', 'running', 'complete', 'error', 'awaiting_approval'] },
  output: { type: String },
  error: { type: String },
  startedAt: { type: Date },
  completedAt: { type: Date },
  durationMs: { type: Number },
  inputsUsed: { type: Map, of: mongoose.Schema.Types.Mixed },
  estimatedCost: { type: Number },
  actualCost: { type: Number },
  approvalRequired: { type: Boolean, default: false },
  approvalId: { type: String },
}, { _id: true });

const ExecutionSchema = new mongoose.Schema({
  pipelineId: { type: mongoose.Schema.Types.ObjectId, ref: 'Pipeline', required: true },
  pipelineName: { type: String },
  status: { type: String, enum: ['running', 'complete', 'error', 'aborted'], default: 'running' },
  nodeResults: { type: [NodeResultSchema], default: [] },
  totalEstimatedCost: { type: Number, default: 0 },
  totalActualCost: { type: Number, default: 0 },
  approvalsSummary: {
    total: { type: Number, default: 0 },
    approved: { type: Number, default: 0 },
    rejected: { type: Number, default: 0 },
  },
  startedAt: { type: Date, default: () => new Date() },
  completedAt: { type: Date },
  durationMs: { type: Number },
  triggeredBy: { type: String },
  abortedAt: { type: Date },
}, { timestamps: true });

ExecutionSchema.index({ pipelineId: 1, createdAt: -1 });
ExecutionSchema.index({ status: 1 });

export default mongoose.model('Execution', ExecutionSchema);
