# ✅ Render Deployment Checklist

## Files Created for You
- ✅ `render.yaml` - Render configuration
- ✅ `build.sh` - Build script for frontend + backend
- ✅ `.node-version` - Node.js version specification
- ✅ `DEPLOYMENT.md` - Detailed deployment guide
- ✅ Updated `app.py` - Production CORS configuration

## Before You Deploy

### 1. Verify Your API Keys
Make sure you have:
- [ ] Google Gemini API key
- [ ] Daily.co API key  
- [ ] Tavus API key

### 2. Test Locally (Optional but Recommended)
```bash
# Test the build script
chmod +x build.sh
./build.sh

# Run the app
uvicorn app:app --host 0.0.0.0 --port 5000

# Visit http://localhost:5000 to verify
```

### 3. Commit and Push to GitHub
```bash
git add .
git commit -m "Add Render deployment configuration"
git push origin master
```

## Deploy to Render

### Quick Deploy (Using Blueprint)
1. Go to https://dashboard.render.com
2. Click **"New +"** → **"Blueprint"**
3. Connect your GitHub repo
4. Select `phronesis`
5. Render will read `render.yaml` automatically
6. Add your environment variables:
   - `GEMINI_API_KEY`
   - `DAILY_API_KEY`
   - `TAVUS_API_KEY`
7. Click **"Apply"**

### Manual Deploy
1. Go to https://dashboard.render.com
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repo
4. Configure:
   - **Build Command**: `chmod +x build.sh && ./build.sh`
   - **Start Command**: `uvicorn app:app --host 0.0.0.0 --port $PORT`
5. Add environment variables (same as above)
6. Click **"Create Web Service"**

## After Deployment

### Verify It Works
- [ ] Service shows "Live" status
- [ ] Visit your Render URL
- [ ] Homepage loads with topics
- [ ] Click on a topic to verify curriculum loads
- [ ] Test voice chat functionality

### Get Your URL
Your app will be at:
```
https://phronesis-XXXX.onrender.com
```
(Replace XXXX with your actual service name)

## ⚠️ Important Notes

### Database Warning
Your SQLite database will **reset on every deployment**. This is fine for:
- ✅ Demo/Hackathon purposes
- ✅ Content that regenerates (curriculum)

Not fine for:
- ❌ User accounts
- ❌ Saved progress
- ❌ Any data that needs to persist

**Solution for production**: Upgrade to paid plan + PostgreSQL

### Free Tier Limitations
- Service sleeps after 15 min of inactivity
- First request after sleep takes ~30-60 seconds
- 750 hours/month free compute
- No persistent disk (data resets)

### Monitoring
Watch your deployment:
```
Dashboard → Your Service → Logs
```

## Troubleshooting

### Build Fails
Check the build logs and verify:
- All files committed to git
- `package.json` exists in `frontend/`
- `requirements.txt` is valid

### App Loads but Features Don't Work
- Check environment variables are set
- Verify API keys are valid
- Check browser console for errors

### CORS Errors
Should be fixed with the updated `app.py`, but if issues persist:
- Check the production URL in logs
- Verify `RENDER_EXTERNAL_URL` is set automatically

## Next Steps

Once deployed:
1. [ ] Test all features thoroughly
2. [ ] Share the URL!
3. [ ] Monitor error logs
4. [ ] Consider upgrading for production use

## Cost Estimate

**Free Tier**: $0/month
- Perfect for demos and hackathons
- 750 hours/month
- Cold starts after inactivity

**Paid Tier**: $7/month
- Always on (no cold starts)
- Persistent disk for SQLite
- Better performance

**With PostgreSQL**: $14/month
- $7 web service + $7 database
- Data persistence
- Production-ready

---

**Questions?** Read `DEPLOYMENT.md` for detailed guide!

