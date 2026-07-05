import mongoose from 'mongoose';

const ApprovalSchema = new mongoose.Schema({
  executionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Execution', required: true },
  nodeId: { type: String, required: true },
  nodeType: { type: String },
  nodeLabel: { type: String },
  riskLevel: { type: String, enum: ['reversible', 'irreversible'] },
  actionDescription: { type: String },
  estimatedCost: { type: Number },
  toolName: { type: String },
  arguments: { type: Map, of: mongoose.Schema.Types.Mixed },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  decision: { type: String },
  decidedBy: { type: String },
  decidedAt: { type: Date },
  timeoutMs: { type: Number, default: 300000 },
  expiresAt: { type: Date },
}, { timestamps: true });

ApprovalSchema.index({ executionId: 1, nodeId: 1 });
ApprovalSchema.index({ status: 1, expiresAt: 1 });
ApprovalSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0, sparse: true });

export default mongoose.model('Approval', ApprovalSchema);
