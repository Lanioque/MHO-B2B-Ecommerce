# GitHub Pages Setup

This folder contains the GitHub Pages configuration for the MHO project documentation.

## How to Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings** → **Pages** (in the left sidebar)
3. Under **Source**, select:
   - **Branch**: `master` (or `main`)
   - **Folder**: `/docs`
4. Click **Save**
5. Your documentation will be available at:
   `https://[your-username].github.io/MHO/`

## What's Included

- `index.html` - Main documentation page with Mermaid diagram support
- `_config.yml` - Jekyll configuration (optional, for Jekyll features)
- `index.md` - Alternative Jekyll-based version (optional)

## Features

✅ Renders markdown from README.md  
✅ Supports Mermaid diagrams  
✅ Responsive design  
✅ GitHub-style markdown rendering  
✅ Auto-fetches README from repository

## Troubleshooting

If diagrams don't render:
1. Make sure your README.md is in the repository root
2. Wait a few minutes after enabling GitHub Pages (first deployment takes time)
3. Check browser console for errors
4. Verify the repository name matches the URL structure

## Local Testing

To test locally before pushing:
```bash
# Using Python (simple HTTP server)
cd docs
python -m http.server 8000
# Visit http://localhost:8000

# Or using Node.js http-server
npx http-server docs -p 8000
```

