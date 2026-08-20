import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Express app
const app = express();

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || process.env.VITE_API_URL,
  credentials: true
}));

app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ ok: true, timestamp: new Date() });
});

// Note: WebSocket connections are handled separately via a backend service
// This export works for Vercel's serverless environment
export default async (req, res) => {
  // Ensure MongoDB connection
  if (mongoose.connection.readyState === 0) {
    try {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('[DB] Connected to MongoDB');
    } catch (err) {
      console.error('[DB] Connection failed:', err);
      return res.status(503).json({ error: 'Database unavailable' });
    }
  }

  // Route the request to Express
  return app(req, res);
};
