# Deployment Guide

Successfully configured Docusaurus documentation to deploy at `/docs/` on existing `ethos.thebbz.xyz`.

## ✅ What Was Changed

### 1. Docusaurus Configuration ([docusaurus.config.ts](file:///Users/thebbz/siwETHOS-demo/docusaurus.config.ts))
- **url**: Set to `https://ethos.thebbz.xyz`
- **baseUrl**: Set to `/docs/`
- **routeBasePath**: Set to `/` (so docs are at `/docs/`, not `/docs/docs/`)

### 2. Build Process ([package.json](file:///Users/thebbz/siwETHOS-demo/package.json))
```json
{
  "scripts": {
    "build": "pnpm docs:build && pnpm build:next",
    "docs:build": "docusaurus build && rm -rf public/docs && cp -r build public/docs"
  }
}
```

**Build flow:**
1. `docs:build` - Builds Docusaurus → Copies to `public/docs/`
2. `build:next` - Builds Next.js (which includes `public/docs/`)

### 3. Next.js Configuration ([next.config.ts](file:///Users/thebbz/siwETHOS-demo/next.config.ts))
- Added `headers()` configuration for `/docs/*` paths
- Sets caching headers for static documentation files

### 4. Git Configuration ([.gitignore](file:///Users/thebbz/siwETHOS-demo/.gitignore))
Added to gitignore:
- `/build` - Docusaurus build output
- `/.docusaurus` - Docusaurus cache
- `/public/docs` - Copied documentation

---

## 🚀 Deployment Instructions

### Step 1: Build Locally (Optional Testing)

```bash
# Build everything
pnpm build

# Start production server
pnpm start
```

Visit http://localhost:3000/docs/ to test locally.

### Step 2: Deploy to Vercel

```bash
# Commit changes
git add .
git commit -m "Add Docusaurus documentation"
git push
```

Vercel will automatically:
1. Run `pnpm build` which executes:
   - Build Docusaurus docs
   - Copy to `public/docs/`
   - Build Next.js with docs included
2. Deploy everything

### Step 3: Verify Deployment

Once deployed, visit:
- **Production:** https://ethos.thebbz.xyz/docs/
- **SDK Docs:** https://ethos.thebbz.xyz/docs/sdk/installation
- **React Docs:** https://ethos.thebbz.xyz/docs/react/auth-modal

---

## 📁 File Structure

```
siwETHOS-demo/
├── build/                    # Docusaurus output (gitignored)
│   ├── index.html
│   ├── sdk/
│   ├── react/
│   └── ...
├── public/
│   └── docs/                 # Copied from build/ (gitignored)
│       └── [same as build/]
├── docs/                     # Source markdown files
│   ├── index.mdx
│   ├── sdk/
│   ├── react/
│   ├── providers/
│   └── guides/
├── docusaurus.config.ts      # baseUrl: '/docs/', routeBasePath: '/'
├── sidebars.ts               # Navigation structure
└── package.json              # Build scripts
```

---

## 🔧 Development Commands

| Command | Description | URL |
|---------|-------------|-----|
| `pnpm docs:dev` | Docusaurus dev server | http://localhost:3000 |
| `pnpm dev` | Next.js dev server* | http://localhost:3000 |
| `pnpm docs:build` | Build docs only | - |
| `pnpm build` | Build docs + Next.js | - |
| `pnpm start` | Preview production | http://localhost:3000/docs/ |

*Note: When running `pnpm dev`, the docs are NOT available. Use `pnpm docs:dev` for documentation development.

---

## 📝 How It Works

### Development
- **Docusaurus**: Run `pnpm docs:dev` on port 3000 for hot reload
- **Next.js**: Run `pnpm dev` for app development

### Production
1. `pnpm docs:build`:
   - Builds Docusaurus → `build/` directory
   - Copies `build/` → `public/docs/`
   
2. `pnpm build:next`:
   - Next.js bundles `public/docs/` as static assets
   - Serves docs at `/docs/*` paths

3. **Result**: Single deployment with both Next.js app and docs!

---

## 🌐 URL Mapping

| Source File | Built As | Served At |
|------------|----------|-----------|
| `docs/index.mdx` | `build/index.html` | `/docs/` |
| `docs/sdk/installation.mdx` | `build/sdk/installation/index.html` | `/docs/sdk/installation` |
| `docs/react/auth-modal.mdx` | `build/react/auth-modal/index.html` | `/docs/react/auth-modal` |

**Base URL:** `https://ethos.thebbz.xyz/docs/`

---

## ✅ Verification Checklist

Before pushing to production:

- [ ] Run `pnpm build` locally
- [ ] Verify docs load at `http://localhost:3000/docs/`
- [ ] Check navigation works
- [ ] Verify all links work
- [ ] Test dark/light mode toggle
- [ ] Test mobile responsiveness

After deployment:

- [ ] Visit https://ethos.thebbz.xyz/docs/
- [ ] Verify all pages load
- [ ] Check search functionality
- [ ] Test on different browsers
- [ ] Verify all images/assets load

---

## 🔄 Updating Documentation

To update the docs:

1. **Edit markdown files** in `docs/` directory
2. **Test locally**: `pnpm docs:dev`
3. **Commit and push**: Vercel auto-deploys

**No manual build needed!** Vercel runs the build process automatically.

---

## 🎯 Production URLs

Once deployed:

- **Home:** https://ethos.thebbz.xyz/docs/
- **SDK:** https://ethos.thebbz.xyz/docs/sdk/installation
- **React:** https://ethos.thebbz.xyz/docs/react/auth-modal
- **Guides:** https://ethos.thebbz.xyz/docs/guides/quick-start

---

## 🐛 Troubleshooting

### Docs not showing on localhost
Run `pnpm build` first, then `pnpm start`. The docs are only available in production mode.

### Build fails
Check that you have the latest dependencies:
```bash
pnpm install
```

### Docs show 404
Verify the files are in `public/docs/`:
```bash
ls public/docs/
```

### Wrong path (/docs/docs/)
Check `docusaurus.config.ts`:
- `baseUrl` should be `/docs/`
- `routeBasePath` should be `/`

---

## 📦 What Gets Deployed

✅ **Included in deployment:**
- Next.js app
- Documentation static files (`public/docs/`)
- All assets (images, CSS, JS)

❌ **Not included (gitignored):**
- `build/` directory
- `.docusaurus/` cache
- `node_modules/`

---

## 🎉 Ready to Deploy!

Just push to GitHub and Vercel handles the rest:

```bash
git add .
git commit -m "Add comprehensive Docusaurus documentation"
git push
```

Your docs will be live at **https://ethos.thebbz.xyz/docs/** in a few minutes! 🚀
