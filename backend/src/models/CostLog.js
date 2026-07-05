import mongoose from 'mongoose';

const CostLogSchema = new mongoose.Schema({
  executionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Execution', required: true },
  nodeId: { type: String, required: true },
  model: { type: String },
  inputTokens: { type: Number },
  outputTokens: { type: Number },
  totalTokens: { type: Number },
  estimatedCostUsd: { type: Number },
  actualCostUsd: { type: Number },
  costSavingsUsd: { type: Number },
  costSavingsPercent: { type: Number },
  optimizationSuggestion: { type: String },
}, { timestamps: true });

CostLogSchema.index({ executionId: 1 });
CostLogSchema.index({ model: 1, createdAt: -1 });

export default mongoose.model('CostLog', CostLogSchema);
