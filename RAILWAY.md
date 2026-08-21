# Railway Deployment Guide for AgentGuard Backend

## Quick Fix for Current Error

Railway can't build your app because it's trying to build from the root directory which has multiple folders. Here's how to fix it:

### Step 1: Set Root Directory in Railway

1. Go to your Railway service **Settings** tab
2. Scroll to **"Build"** section
3. Find **"Root Directory"** field
4. Enter: `backend`
5. Click **"Deploy"** again

This tells Railway to only deploy the backend folder.

### Step 2: Add Environment Variables

Before deployment succeeds, add these in Railway **Variables** tab:

#### Required Variables:

```
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/agentguard
ANTHROPIC_API_KEY=sk-ant-api03-...
GEMINI_API_KEY=AIza...
JWT_SECRET=<generate random 32+ char string>
FRONTEND_URL=https://your-app.vercel.app
PORT=3001
NODE_ENV=production
```

#### Optional Variables:
```
FIRECRAWL_API_KEY=fc-...
GITHUB_PAT=ghp_...
BRAVE_API_KEY=...
```

### Step 3: Generate JWT Secret

Run this locally to generate a secure JWT secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output and paste it as `JWT_SECRET` in Railway.

### Step 4: Get MongoDB URI

1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Create a free M0 cluster (if you haven't)
3. Go to **Database Access** → Add user with password
4. Go to **Network Access** → Add IP `0.0.0.0/0` (allows all)
5. Click **Connect** → **Connect your application**
6. Copy the connection string:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/agentguard?retryWrites=true&w=majority
   ```
7. Replace `<username>` and `<password>` with your actual credentials

### Step 5: Deploy and Get Backend URL

1. After setting root directory and environment variables, Railway will auto-deploy
2. Once deployed, go to **Settings** → **Networking**
3. Click **"Generate Domain"** to get a public URL like:
   ```
   https://agentguard-production-xxxx.up.railway.app
   ```
4. Copy this URL - you'll need it for Vercel frontend

### Step 6: Update Vercel Frontend

In Vercel dashboard, add these environment variables:

```
VITE_API_URL=https://agentguard-production-xxxx.up.railway.app
VITE_WS_URL=wss://agentguard-production-xxxx.up.railway.app
```

Then redeploy your Vercel frontend.

---

## Troubleshooting

### Build still failing?

Check Railway build logs. Common issues:

1. **"Module not found"** → Make sure root directory is set to `backend`
2. **"MongoDB connection failed"** → Check MONGODB_URI is correct and IP whitelist includes `0.0.0.0/0`
3. **"Port already in use"** → Railway automatically assigns PORT, you don't need to set it

### Check Backend Health

Once deployed, test your backend:
```
https://your-railway-url.up.railway.app/health
```

Should return: `{"ok": true, "timestamp": "..."}`

### WebSocket Connection

Your backend WebSocket endpoint will be at:
```
wss://your-railway-url.up.railway.app/ws
```

---

## Quick Reference

| What | Where |
|------|-------|
| Root Directory | `backend` (Railway Settings) |
| Backend URL | Railway → Settings → Networking |
| MongoDB | MongoDB Atlas (free M0) |
| Environment Variables | Railway → Variables tab |
| Health Check | `/health` endpoint |
| WebSocket Path | `/ws` |

---

## Alternative: Use railway.toml (Optional)

If you prefer config-as-code, create `railway.toml` in the root:

```toml
[build]
builder = "nixpacks"
buildCommand = "cd backend && npm install"

[deploy]
startCommand = "cd backend && npm start"
healthcheckPath = "/health"
healthcheckTimeout = 100
restartPolicyType = "on_failure"
restartPolicyMaxRetries = 10
```

Then commit and push to trigger a new deployment.
