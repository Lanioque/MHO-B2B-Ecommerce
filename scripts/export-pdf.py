#!/usr/bin/env python3
"""
Export README.md to PDF with Mermaid diagrams using md2pdf-mermaid

Usage:
    python scripts/export-pdf.py [--scale SCALE] [--orientation portrait|landscape]
    
Options:
    --scale SCALE          Mermaid diagram scale (default: 3, higher = larger/sharp)
    --orientation ORIENT  Page orientation: portrait or landscape (default: landscape)
"""

import sys
import argparse
from pathlib import Path

try:
    from md2pdf import convert_markdown_to_pdf
    
    # Parse command line arguments
    parser = argparse.ArgumentParser(description='Export README.md to PDF with Mermaid diagrams')
    parser.add_argument('--scale', type=int, default=3, 
                       help='Mermaid diagram scale (default: 3, recommended: 2-4)')
    parser.add_argument('--orientation', choices=['portrait', 'landscape'], default='landscape',
                       help='Page orientation (default: landscape)')
    args = parser.parse_args()
    
    # Get paths
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    readme_path = project_root / "README.md"
    output_path = project_root / "README.pdf"
    
    if not readme_path.exists():
        print(f"❌ Error: README.md not found at {readme_path}")
        sys.exit(1)
    
    print(f"📄 Reading: {readme_path}")
    
    # Read the markdown file content
    with open(readme_path, 'r', encoding='utf-8') as f:
        markdown_content = f.read()
    
    print(f"📄 Converting {len(markdown_content)} characters to PDF...")
    print(f"📄 Settings: scale={args.scale}, orientation={args.orientation}")
    print(f"📄 Writing: {output_path}")
    
    # Convert markdown to PDF - pass content as string, not file path
    result = convert_markdown_to_pdf(
        markdown_content,
        str(output_path),
        title='MHO B2B E-commerce Platform Documentation',
        enable_mermaid=True,
        page_numbers=True,
        page_size='a4',
        orientation=args.orientation,
        mermaid_scale=args.scale,
        mermaid_theme='default'
    )
    
    if result.get('success'):
        print(f"✅ PDF exported successfully to: {output_path}")
        print(f"   - Mermaid diagrams found: {result.get('mermaid_count', 0)}")
        print(f"   - Mermaid diagrams rendered: {result.get('mermaid_rendered', 0)}")
    else:
        print(f"❌ Error: PDF conversion failed")
        sys.exit(1)
    
except ImportError as e:
    print(f"❌ Error importing md2pdf: {e}")
    print("\nTry installing: pip install md2pdf-mermaid playwright markdown")
    print("Then: python -m playwright install chromium")
    sys.exit(1)
except Exception as e:
    print(f"❌ Error exporting PDF: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

