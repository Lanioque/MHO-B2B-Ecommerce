/**
 * Export README.md to PDF with Mermaid diagrams
 * 
 * This script uses Puppeteer to render the GitHub Pages version
 * which includes rendered Mermaid diagrams.
 * 
 * Usage: node scripts/export-readme-pdf.js
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function exportReadmeToPDF() {
  console.log('🚀 Starting PDF export...');
  
  // GitHub Pages URL for your documentation
  const docsUrl = 'https://lanioque.github.io/MHO-B2B-Ecommerce/';
  
  // Alternative: Use local file if you have a local server running
  // const localUrl = 'http://localhost:8000'; // if using python -m http.server
  
  console.log(`📄 Loading: ${docsUrl}`);
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Set viewport for better rendering
    await page.setViewport({
      width: 1200,
      height: 1600,
      deviceScaleFactor: 2
    });
    
    // Navigate to the page
    console.log('⏳ Waiting for page to load...');
    await page.goto(docsUrl, {
      waitUntil: 'networkidle0',
      timeout: 60000
    });
    
    // Wait for Mermaid diagrams to render
    console.log('⏳ Waiting for Mermaid diagrams to render...');
    await page.waitForTimeout(3000); // Wait 3 seconds for diagrams
    
    // Wait for all mermaid diagrams to be rendered
    await page.waitForFunction(() => {
      const mermaidElements = document.querySelectorAll('.mermaid');
      if (mermaidElements.length === 0) return true;
      
      // Check if diagrams have been processed (have SVG children)
      return Array.from(mermaidElements).every(el => {
        return el.querySelector('svg') !== null || el.textContent.includes('error');
      });
    }, { timeout: 30000 });
    
    // Generate PDF
    const outputPath = path.join(__dirname, '..', 'README.pdf');
    console.log(`📄 Generating PDF: ${outputPath}`);
    
    await page.pdf({
      path: outputPath,
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm'
      }
    });
    
    console.log('✅ PDF exported successfully!');
    console.log(`📁 Location: ${outputPath}`);
    
  } catch (error) {
    console.error('❌ Error exporting PDF:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

// Run if called directly
if (require.main === module) {
  exportReadmeToPDF()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { exportReadmeToPDF };

