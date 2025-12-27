# Deploying to Vercel

## Prerequisites
- A Vercel account (sign up at https://vercel.com)
- Your code pushed to a Git repository (GitHub, GitLab, or Bitbucket)

## Option 1: Deploy via Vercel CLI

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy from your project directory**:
   ```bash
   cd /Users/james/Cursor/real-estate
   vercel
   ```

4. **Follow the prompts**:
   - Link to existing project or create new
   - Confirm project settings
   - Vercel will build and deploy your app

5. **For production deployment**:
   ```bash
   vercel --prod
   ```

## Option 2: Deploy via GitHub Integration (Recommended for Continuous Deployment)

1. **Push your code to GitHub** (if not already):
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Go to Vercel Dashboard**:
   - Visit https://vercel.com/dashboard
   - Click "Add New Project"
   - Import your GitHub repository

3. **Configure Project Settings**:
   - Framework Preset: Next.js (auto-detected)
   - Root Directory: `./` (default)
   - Build Command: `npm run build` (default)
   - Output Directory: `.next` (default)

4. **Set Environment Variables**:
   - Go to Project Settings → Environment Variables
   - Add the following:
     - `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` = Your Google Maps API key
     - `NEXT_PUBLIC_WALKING_THRESHOLD_MINUTES` = 10 (optional)

5. **Deploy**:
   - Click "Deploy"
   - Vercel will automatically build and deploy your app
   - Future pushes to your main branch will trigger automatic deployments

## Important Notes

### Environment Variables
Make sure to set these in Vercel Dashboard → Project Settings → Environment Variables:
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` - Required for the shared key feature and as fallback
- `NEXT_PUBLIC_WALKING_THRESHOLD_MINUTES` - Optional, defaults to 10

### Build Settings
- Vercel will auto-detect Next.js
- Build command: `npm run build`
- Output directory: `.next`

### Custom Domain (Optional)
- After deployment, you can add a custom domain in Project Settings → Domains

### Environment Variables for Different Environments
You can set different values for:
- Production
- Preview (for pull requests)
- Development

## Troubleshooting

If build fails:
1. Check build logs in Vercel dashboard
2. Ensure all environment variables are set
3. Verify `package.json` has correct build scripts
4. Check that all dependencies are listed in `package.json`

## Post-Deployment

After deployment:
1. Your app will be available at `https://your-project-name.vercel.app`
2. Test the shared API key feature
3. Verify that users can enter their own API keys
4. Check that the logo displays correctly


