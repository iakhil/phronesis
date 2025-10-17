# 🚀 Phronesis Deployment Guide (Render)

## Prerequisites
- GitHub account
- Render account (free): https://render.com
- API keys for:
  - Google Gemini API
  - Daily.co API
  - Tavus API

## Step-by-Step Deployment

### 1. Push Your Code to GitHub
```bash
git add .
git commit -m "Prepare for deployment"
git push origin master
```

### 2. Create New Web Service on Render

1. Go to https://dashboard.render.com
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Select the `phronesis` repository

### 3. Configure the Service

Render will auto-detect settings from `render.yaml`, but verify:

- **Name**: `phronesis` (or your preferred name)
- **Region**: Oregon (or closest to you)
- **Branch**: `master`
- **Runtime**: Python 3
- **Build Command**: 
  ```bash
  pip install -r requirements.txt && cd frontend && npm install && npm run build && cd .. && cp -r frontend/dist/* dist/
  ```
- **Start Command**: 
  ```bash
  uvicorn app:app --host 0.0.0.0 --port $PORT
  ```

### 4. Add Environment Variables

In the Render dashboard, add these environment variables:

| Key | Value |
|-----|-------|
| `GEMINI_API_KEY` | Your Gemini API key |
| `DAILY_API_KEY` | Your Daily.co API key |
| `TAVUS_API_KEY` | Your Tavus API key |
| `PYTHON_VERSION` | `3.11.0` |

### 5. Deploy!

Click **"Create Web Service"**

Render will:
- Install Python dependencies
- Build the frontend
- Copy frontend to dist/
- Start the server

⏱️ First deployment takes ~5-10 minutes

### 6. Access Your App

Once deployed, your app will be available at:
```
https://phronesis-XXXX.onrender.com
```

## ⚠️ Important Notes

### Database Persistence
**CRITICAL**: The free tier uses ephemeral storage. Your SQLite database (`phronesis.db`) will be **reset on every deployment or restart**.

**Solutions:**
1. **For Demo/Hackathon**: Accept data loss (curriculum is regenerated)
2. **For Production**: Upgrade to use PostgreSQL
   - Add PostgreSQL database in Render
   - Update `database.py` to use PostgreSQL URL
   - Add `psycopg2-binary` to `requirements.txt`

### Cold Starts
Free tier services spin down after 15 minutes of inactivity. First request may take 30-60 seconds.

### Upgrade to Paid ($7/month) for:
- Always-on (no cold starts)
- Persistent disk (keeps SQLite data)
- More resources

## Monitoring

View logs in real-time:
1. Go to your service dashboard
2. Click **"Logs"** tab
3. Watch for errors during deployment

## Troubleshooting

### Build Failed
- Check that `frontend/package.json` exists
- Ensure `requirements.txt` is valid
- Check build logs for specific errors

### 500 Error on Load
- Verify all environment variables are set
- Check logs for missing API keys
- Ensure frontend built correctly

### API Requests Failing
- Check CORS settings in `app.py`
- Verify API keys are valid
- Check browser console for errors

## Testing Production Build Locally

Before deploying, test the production build:

```bash
# Build frontend
cd frontend
npm run build
cd ..

# Copy to dist
cp -r frontend/dist/* dist/

# Run with production settings
uvicorn app:app --host 0.0.0.0 --port 5000
```

Visit `http://localhost:5000` to verify everything works.

## Updating Your Deployment

Push changes to GitHub:
```bash
git add .
git commit -m "Update feature"
git push origin master
```

Render auto-deploys on push! 🎉

## Custom Domain (Optional)

1. In Render dashboard, go to **Settings**
2. Add your custom domain
3. Update DNS records as instructed
4. SSL certificate is automatic

## Questions?

Check the logs first, then:
- Render docs: https://render.com/docs
- Render community: https://community.render.com

