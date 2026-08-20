# Vercel Deployment Guide for AgentGuard

## Prerequisites

- Vercel CLI (`npm i -g vercel`) or GitHub integration
- MongoDB Atlas account (free tier works)
- Node.js 18+ locally

## Architecture Notes

This application has two deployment options:

### Option 1: Hybrid (Recommended for Vercel)
- **Frontend**: Deploy to Vercel (Serverless)
- **Backend**: Deploy to a platform that supports long-running processes (Railway, Render, Fly.io)
- **WebSocket Server**: Separate WebSocket server (Pusher, Socket.io on Railway, or Ably)

### Option 2: Full Serverless
- All components deploy to Vercel as Serverless Functions
- **Limitations**: WebSocket-based pipeline execution won't work; switch to polling

---

## MongoDB Atlas Setup

### 1. Create Cluster
1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Create a free tier cluster (M0)
3. Select a region near your users

### 2. Configure Network Access
1. Go to **Network Access** → **IP Access List**
2. Add `0.0.0.0/0` (allows Vercel's IP addresses) or use VPC peering

### 3. Create Database User
1. **Database Access** → **Add New Database User**
2. Username: `agentguard`
3. Password: Generate a strong password
4. Role: `Database User`

### 4. Get Connection String
1. **Database** → **Connect** → **Connect your application**
2. Copy the connection string:
   ```
   mongodb+srv://agentguard:<password>@cluster0.xxx.mongodb.net/agentguard?retryWrites=true&w=majority
   ```
3. Replace `<password>` with your actual password

---

## Deploy to Vercel

### Option A: GitHub Integration (Recommended)

1. **Push to GitHub**
   ```bash
   cd agentguard
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Framework Preset: `Other` / `Vite`
   - Build Command: `cd frontend && npm install && npm run build`
   - Output Directory: `frontend/dist`

3. **Environment Variables**
   Add these in Vercel dashboard (Settings → Environment Variables):

   | Variable | Value |
   |----------|-------|
   | `FRONTEND_URL` | `https://your-project.vercel.app` |
   | `VITE_API_URL` | `https://your-backend-url.com` |
   | `VITE_WS_URL` | `wss://your-websocket-server.com` |

4. **Deploy**
   - Click **Deploy**
   - Vercel will build and deploy automatically on future pushes

### Option B: Vercel CLI

```bash
cd agentguard
vercel login
vercel --yes
```

---

## Deploy Backend (for Hybrid Deployment)

### Using Railway (Recommended for Backend)

1. Go to [Railway.app](https://railway.app)
2. **New Project** → **Deploy from GitHub repo**
3. Select your `agentguard` repository
4. Set root directory: `backend`
5. **Environment Variables** in Railway:
   ```
   MONGODB_URI=mongodb+srv://agentguard:<password>@cluster0.xxx.mongodb.net/agentguard
   ANTHROPIC_API_KEY=sk-ant-api03-...
   GEMINI_API_KEY=your-gemini-key
   FIRECRAWL_API_KEY=fc-...
   GITHUB_PAT=ghp_...
   JWT_SECRET=your-secure-random-string
   PORT=3001
   NODE_ENV=production
   FRONTEND_URL=https://your-vercel-project.vercel.app
   ```
6. Deploy

### Alternative: Render

1. Create a **Web Service** on Render
2. Connect your GitHub repo
3. Root directory: `backend`
4. Build command: `npm install`
5. Start command: `npm start`
6. Add environment variables (same as above)

---

## WebSocket Server (Required for Real-time Execution)

The pipeline execution uses WebSockets. For hybrid deployment:

### Option A: Deploy WebSocket Server with Backend

The backend already has WebSocket support. Deploy with Railway/Render and note the WebSocket URL.

### Option B: Use Pusher (Managed WebSockets)

1. Create account at [pusher.com](https://pusher.com)
2. Create a Channels app
3. Get credentials (app_id, key, secret, cluster)
4. Update backend to use Pusher instead of raw WebSockets

---

## Update Frontend Environment

After deploying backend, create `frontend/.env.production`:

```env
VITE_API_URL=https://your-railway-app.railway.app
VITE_WS_URL=wss://your-railway-app.railway.app/ws
```

Redeploy frontend to Vercel after updating.

---

## Testing Locally with Production Build

```bash
# Build frontend
cd frontend && npm run build

# Serve locally
npx serve dist -p 3000

# Test against production backend URL
# Open http://localhost:3000
```

---

## Troubleshooting

### CORS Errors
- Ensure `FRONTEND_URL` matches your Vercel deployment URL exactly
- Include protocol (https://) and no trailing slash

### MongoDB Connection Failed
- Verify IP whitelist in MongoDB Atlas includes `0.0.0.0/0`
- Check connection string password is URL-encoded

### WebSocket Not Connecting
- Verify WebSocket server is deployed and accessible
- Check browser console for connection errors
- Ensure `VITE_WS_URL` uses `wss://` (not `https://`)

### Build Fails
- Ensure Node.js version is 18+ in `package.json`
- Check all dependencies are installed (`npm install` in both frontend and backend)

---

## Quick Reference: Deployment URLs

After deployment, you'll have:

| Component | URL |
|-----------|-----|
| Frontend | `https://agentguard.vercel.app` |
| Backend API | `https://agentguard-api.railway.app` |
| WebSocket | `wss://agentguard-api.railway.app/ws` |