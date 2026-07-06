import express from 'express';
import Pipeline from '../models/Pipeline.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { STARTER_TEMPLATES } from '../data/templates.js';

const router = express.Router();
router.use(requireAuth);

router.get('/templates/list', (req, res) => {
  res.json(STARTER_TEMPLATES.map(({ name, description }) => ({ name, description })));
});

router.post('/templates/:name/instantiate', async (req, res) => {
  const template = STARTER_TEMPLATES.find(t => t.name === req.params.name);
  if (!template) return res.status(404).json({ error: 'Template not found' });

  const pipeline = await Pipeline.create({
    name: template.name,
    description: template.description,
    nodes: template.nodes,
    edges: template.edges,
    createdBy: req.user.id,
  });
  res.status(201).json(pipeline);
});

router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 0;
    const limit = parseInt(req.query.limit) || 20;
    const skip = page * limit;

    const pipelines = await Pipeline.find({ createdBy: req.user.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Pipeline.countDocuments({ createdBy: req.user.id });
    res.json({ pipelines, total, page, limit });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const pipeline = await Pipeline.findOne({ _id: req.params.id, createdBy: req.user.id });
    if (!pipeline) return res.status(404).json({ error: 'Not found' });
    res.json(pipeline);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, description, nodes, edges } = req.body;
    const pipeline = await Pipeline.create({
      name: name || 'Untitled Pipeline',
      description: description || '',
      nodes: nodes || [],
      edges: edges || [],
      createdBy: req.user.id,
    });
    res.status(201).json(pipeline);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, description, nodes, edges, isPublic, tags } = req.body;
    const pipeline = await Pipeline.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user.id },
      { name, description, nodes, edges, isPublic, tags },
      { new: true }
    );
    if (!pipeline) return res.status(404).json({ error: 'Not found' });
    res.json(pipeline);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await Pipeline.findOneAndDelete({ _id: req.params.id, createdBy: req.user.id });
    if (!result) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
