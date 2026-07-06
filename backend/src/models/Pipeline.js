import mongoose from 'mongoose';

const NodeDataSchema = new mongoose.Schema({
  value: { type: String },
  systemPrompt: { type: String },
  model: { type: String, enum: ['claude-opus-4-6', 'claude-sonnet-4-6', 'claude-haiku-4-5-20251001', 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.0-pro', 'gemini-1.5-pro'] },
  maxTokens: { type: Number, default: 1024 },
  temperature: { type: Number, min: 0, max: 1, default: 1 },
  serverId: { type: String },
  toolName: { type: String },
  args: { type: Map, of: mongoose.Schema.Types.Mixed },
  leftHandle: { type: String },
  operator: { type: String, enum: ['==', '!=', '>', '<', 'contains'] },
  label: { type: String },
  riskLevel: { type: String, enum: ['safe', 'reversible', 'irreversible'], default: 'safe' },
}, { _id: false });

const NodeSchema = new mongoose.Schema({
  id: { type: String, required: true },
  type: { type: String, required: true, enum: ['input', 'claudeNode', 'geminiNode', 'firecrawlNode', 'mcpTool', 'condition', 'output'] },
  position: { x: { type: Number }, y: { type: Number } },
  data: { type: NodeDataSchema, default: {} },
}, { _id: false });

const EdgeSchema = new mongoose.Schema({
  id: { type: String, required: true },
  source: { type: String, required: true },
  target: { type: String, required: true },
  sourceHandle: { type: String },
  targetHandle: { type: String },
}, { _id: false });

const PipelineSchema = new mongoose.Schema({
  name: { type: String, required: true, default: 'Untitled Pipeline' },
  description: { type: String, default: '' },
  nodes: { type: [NodeSchema], default: [] },
  edges: { type: [EdgeSchema], default: [] },
  shareId: { type: String, unique: true, sparse: true },
  isPublic: { type: Boolean, default: false },
  createdBy: { type: String },
  tags: { type: [String], default: [] },
}, { timestamps: true });

PipelineSchema.pre('save', function(next) {
  if (!this.shareId) {
    this.shareId = Math.random().toString(36).slice(2, 10);
  }
  next();
});

PipelineSchema.index({ shareId: 1 });
PipelineSchema.index({ createdBy: 1, createdAt: -1 });

export default mongoose.model('Pipeline', PipelineSchema);
