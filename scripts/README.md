# Export Scripts

## Export README to PDF

### Option 1: Using Puppeteer Script (Recommended)

1. **Install dependencies:**
   ```bash
   npm install puppeteer --save-dev
   # or
   pnpm add -D puppeteer
   ```

2. **Run the export script:**
   ```bash
   node scripts/export-readme-pdf.js
   ```

   This will:
   - Load your GitHub Pages documentation
   - Wait for Mermaid diagrams to render
   - Export as PDF to `README.pdf`

### Option 2: Manual Browser Export

1. Open your GitHub Pages site: https://lanioque.github.io/MHO-B2B-Ecommerce/
2. Wait for all Mermaid diagrams to fully render
3. Press `Ctrl+P` (Windows) or `Cmd+P` (Mac)
4. Select "Save as PDF"
5. Choose "More settings" → Enable "Background graphics"
6. Save the PDF

### Option 3: Using Pandoc with Mermaid Filter

**Requirements:**
- Pandoc
- Node.js (for mermaid-filter)
- LaTeX (for PDF generation)

**Install:**
```bash
# Install Pandoc
# Windows: Download from https://pandoc.org/installing.html
# macOS: brew install pandoc
# Linux: sudo apt install pandoc

# Install Mermaid filter
npm install -g mermaid-filter

# Install LaTeX
# Windows: MiKTeX or TeX Live
# macOS: MacTeX
# Linux: sudo apt-get install texlive-latex-recommended
```

**Export:**
```bash
pandoc -F mermaid-filter -o README.pdf README.md
```

### Option 4: VS Code Extension

1. Install "Markdown PDF" or "Markdown Preview Enhanced" extension
2. Open README.md in VS Code
3. Right-click → "Markdown PDF: Export (pdf)"
   - Note: May need additional setup for Mermaid support

### Option 5: Online Services

- **GitPrint**: https://gitprint.com/
- **Markdown to PDF**: Upload your README.md (may have limited Mermaid support)

## Troubleshooting

If Mermaid diagrams don't render in PDF:
1. Wait longer for diagrams to load (increase timeout in script)
2. Check browser console for errors
3. Verify GitHub Pages is working correctly
4. Try manual browser export method

