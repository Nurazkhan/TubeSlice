# Vercel Deployment Guide

## Fix 404 Error on Vercel

If your frontend builds successfully locally but shows **404** on Vercel, follow these steps:

### 1. Set Environment Variable on Vercel

Go to your Vercel project dashboard:

1. **Settings** → **Environment Variables**
2. Add a new variable:
   - **Name**: `NEXT_PUBLIC_API_BASE_URL`
   - **Value**: `http://103.85.112.171` (your VPS IP)
   - **Environments**: Production, Preview, Development

3. **Save** and trigger a new deployment

### 2. Redeploy on Vercel

```bash
# Option A: Push to trigger auto-deploy
git push

# Option B: Manually redeploy in Vercel dashboard
# Dashboard → Deployments → Click "Redeploy" on the latest build
```

### 3. Verify the Deployment

Once redeployed, check:
- Your Vercel app URL (should load without 404)
- Swagger UI at `http://103.85.112.171/docs`

---

## Common Issues

| Issue | Solution |
|-------|----------|
| Still shows 404 | Clear Vercel cache: Settings → Git → Disconnect → Reconnect |
| API calls fail | Check `NEXT_PUBLIC_API_BASE_URL` is set correctly to your VPS IP |
| CORS errors | Ensure backend Nginx allows Vercel domain |
| Blank page | Check browser console for JavaScript errors |

---

## Production Checklist

- [ ] `NEXT_PUBLIC_API_BASE_URL` set to your VPS or domain
- [ ] Backend running on VPS (`http://103.85.112.171`)
- [ ] Nginx configured on VPS
- [ ] Frontend redeployed after env var change
- [ ] Test login and video download on Vercel

---

## If Still Not Working

1. **Check Vercel build logs** for errors
2. **Check browser console** (F12 → Console tab) for JavaScript errors
3. **Test backend directly**: `curl http://103.85.112.171/docs`
4. **Verify env var is set**: In Vercel project, hover over NEXT_PUBLIC_API_BASE_URL to see its value
