import express from 'express';
import Pipeline from '../models/Pipeline.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 0;
    const limit = parseInt(req.query.limit) || 20;
    const skip = page * limit;

    const pipelines = await Pipeline.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Pipeline.countDocuments();
    res.json({ pipelines, total, page, limit });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const pipeline = await Pipeline.findById(req.params.id);
    if (!pipeline) return res.status(404).json({ error: 'Not found' });
    res.json(pipeline);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/share/:shareId', async (req, res) => {
  try {
    const pipeline = await Pipeline.findOne({ shareId: req.params.shareId });
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
    });
    res.status(201).json(pipeline);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, description, nodes, edges, isPublic, tags } = req.body;
    const pipeline = await Pipeline.findByIdAndUpdate(
      req.params.id,
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
    const result = await Pipeline.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
