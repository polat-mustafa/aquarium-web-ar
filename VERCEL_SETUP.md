# Vercel Deployment Setup

## Environment Variables for Vercel

Your app is deployed on Vercel with auto-build from GitHub. **Important:** The `.env` file is NOT pushed to GitHub (for security), so you need to configure environment variables in Vercel's dashboard.

### Required Environment Variable

Add this in your Vercel project settings:

**Variable Name:** `REPLICATE_API_TOKEN`
**Value:** `[Your Replicate API token from .env.local file]`

### How to Add Environment Variables in Vercel

1. Go to your Vercel dashboard: https://vercel.com/dashboard
2. Select your project (aquarium-web-ar)
3. Go to **Settings** → **Environment Variables**
4. Click **Add New**
5. Enter:
   - **Key:** `REPLICATE_API_TOKEN`
   - **Value:** Copy the token from your `.env.local` file (starts with `r8_`)
   - **Environment:** Select all (Production, Preview, Development)
6. Click **Save**
7. **Redeploy** your app (go to Deployments → click the three dots → Redeploy)

### After Adding the Variable

- Vercel will rebuild your app with the environment variable
- The API route `/api/generate-video` will have access to the token
- Video generation will work in production

### Testing

After deployment, test the environment variable:
```
https://your-app.vercel.app/api/test-env
```

This should return `tokenExists: true` if configured correctly.

---

**Security Note:** Never commit `.env` or `.env.local` files to GitHub. Always set sensitive variables through Vercel's dashboard.
