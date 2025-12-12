# Deploy Frontend to GitHub Pages

## Quick Setup Steps

### 1. Update Configuration Files

**a) Update [package.json](college-search-frontend/package.json#L5)**
Replace `erosey` with your GitHub username:
```json
"homepage": "https://YOUR_GITHUB_USERNAME.github.io/DB_final_project",
```

**b) Update [.env.production](college-search-frontend/.env.production)**
Add your GCP backend URL (after deploying backend):
```
REACT_APP_API_URL=https://YOUR_PROJECT_ID.appspot.com/api
```

### 2. Enable GitHub Pages

1. Go to your GitHub repository: `https://github.com/YOUR_USERNAME/DB_final_project`
2. Click **Settings** → **Pages**
3. Under "Build and deployment":
   - **Source**: Select "GitHub Actions"
4. Click **Save**

### 3. Add GitHub Secret

1. In your repository, go to **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Add:
   - **Name**: `REACT_APP_API_URL`
   - **Value**: `https://YOUR_PROJECT_ID.appspot.com/api`
4. Click **Add secret**

### 4. Deploy

**Option A: Automatic Deploy (Recommended)**
```bash
git add .
git commit -m "Configure GitHub Pages deployment"
git push origin main
```

The GitHub Action will automatically build and deploy your site!

**Option B: Manual Trigger**
1. Go to **Actions** tab in GitHub
2. Click "Deploy to GitHub Pages"
3. Click "Run workflow"

### 5. View Your Site

After deployment (2-3 minutes), visit:
```
https://YOUR_GITHUB_USERNAME.github.io/DB_final_project
```

## Deployment Workflow

The deployment happens automatically via [.github/workflows/deploy.yml](.github/workflows/deploy.yml):

1. **Trigger**: Pushes to `main` branch
2. **Build**: Installs dependencies and builds React app
3. **Deploy**: Publishes to GitHub Pages
4. **Live**: Site updates in 2-3 minutes

## Verify Deployment

Check deployment status:
1. Go to **Actions** tab in GitHub
2. Look for green checkmark ✓ on latest workflow
3. Click workflow to see detailed logs

## Troubleshooting

### Build Fails

**Check workflow logs:**
```
GitHub → Actions → Failed workflow → View logs
```

**Common issues:**
- Missing `package-lock.json`: Run `npm install` in frontend folder
- TypeScript errors: Fix errors shown in logs
- Missing environment variable: Add `REACT_APP_API_URL` to GitHub Secrets

### Site Not Loading

**Check these:**
1. Verify GitHub Pages is enabled (Settings → Pages)
2. Ensure source is set to "GitHub Actions"
3. Check that homepage in package.json matches your repo name
4. Wait 5-10 minutes for DNS propagation

### API Not Connecting

**CORS errors:**
1. Update backend [app.yaml](app.yaml) with your GitHub Pages URL:
   ```yaml
   env_variables:
     CORS_ORIGINS: "https://YOUR_USERNAME.github.io"
   ```
2. Redeploy backend: `./deploy.sh`

**Wrong API URL:**
1. Check [.env.production](college-search-frontend/.env.production)
2. Verify GitHub Secret `REACT_APP_API_URL`
3. Re-run deployment workflow

### Routing Issues (404 on refresh)

Already handled by:
- [.nojekyll](college-search-frontend/public/.nojekyll) file
- `basename={process.env.PUBLIC_URL}` in App.tsx

## Local Testing

Test production build locally:

```bash
cd college-search-frontend

# Set production API URL temporarily
export REACT_APP_API_URL=https://YOUR_PROJECT_ID.appspot.com/api

# Build
npm run build

# Serve locally
npx serve -s build -l 3000
```

Visit: http://localhost:3000

## Update Deployment

To deploy changes:

```bash
# Make your changes
git add .
git commit -m "Your update message"
git push origin main
```

Deployment happens automatically!

## Custom Domain (Optional)

To use a custom domain like `www.yoursite.com`:

1. Add a `CNAME` file in `public/` folder:
   ```
   www.yoursite.com
   ```

2. In your domain registrar, add DNS records:
   ```
   Type: CNAME
   Name: www
   Value: YOUR_USERNAME.github.io
   ```

3. In GitHub Settings → Pages:
   - Enter your custom domain
   - Enable "Enforce HTTPS"

## Monitoring

**View deployment status:**
```
https://github.com/YOUR_USERNAME/DB_final_project/deployments
```

**Check site health:**
```bash
curl -I https://YOUR_USERNAME.github.io/DB_final_project
```

## Cost

GitHub Pages is **FREE** for public repositories!
- Bandwidth: 100GB/month
- Build time: 10 builds/hour
- Perfect for frontend hosting

## Next Steps

1. ✅ Deploy backend to GCP
2. ✅ Update `.env.production` with backend URL
3. ✅ Update `package.json` homepage
4. ✅ Add GitHub Secret for API URL
5. ✅ Push to GitHub
6. ✅ Enable GitHub Pages
7. ✅ Visit your live site!
