import express from 'express';
import Pipeline from '../models/Pipeline.js';

const router = express.Router();

router.get('/pipelines/share/:shareId', async (req, res) => {
  try {
    const pipeline = await Pipeline.findOne({ shareId: req.params.shareId, isPublic: true });
    if (!pipeline) return res.status(404).json({ error: 'Not found' });
    res.json(pipeline);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
