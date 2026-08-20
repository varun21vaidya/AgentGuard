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
      const { email, password } = req.body;
      const user = await User.findOne({ email: (email || '').toLowerCase() });

      if (!user) return res.status(401).json({ error: 'Invalid credentials' });

      const valid = await user.comparePassword(password || '');
      if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

      res.json({
        token: signToken(user),
        user: { id: user._id, email: user.email, name: user.name }
      });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (err) {
    console.error('[LOGIN]', err);
    res.status(500).json({ error: err.message });
  }
};
