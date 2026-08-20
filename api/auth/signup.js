import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import User from '../../backend/src/models/User.js';

// Ensure DB connection
async function ensureDbConnection() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI);
  }
}

function signToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export default async (req, res) => {
  res.setHeader('Content-Type', 'application/json');

  // Enable CORS
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  try {
    await ensureDbConnection();

    if (req.method === 'POST') {
      const { email, password, name } = req.body;

      if (!email || !password || password.length < 8) {
        return res.status(400).json({ error: 'Email and an 8+ character password are required' });
      }

      const existing = await User.findOne({ email: email.toLowerCase() });
      if (existing) return res.status(409).json({ error: 'Email already registered' });

      const passwordHash = await User.hashPassword(password);
      const user = await User.create({ email, passwordHash, name });

      res.status(201).json({
        token: signToken(user),
        user: { id: user._id, email: user.email, name: user.name }
      });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (err) {
    console.error('[SIGNUP]', err);
    res.status(500).json({ error: err.message });
  }
};
