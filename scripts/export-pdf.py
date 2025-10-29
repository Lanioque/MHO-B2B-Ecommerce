#!/usr/bin/env python3
"""
Export README.md to PDF with Mermaid diagrams using md2pdf-mermaid
"""

import sys
import os
from pathlib import Path

# Add parent directory to path if needed
sys.path.insert(0, str(Path(__file__).parent.parent))

try:
    from md2pdf import convert_markdown_to_pdf
    
    # Get paths
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    readme_path = project_root / "README.md"
    output_path = project_root / "README.pdf"
    
    if not readme_path.exists():
        print(f"❌ Error: README.md not found at {readme_path}")
        sys.exit(1)
    
    print(f"📄 Reading: {readme_path}")
    print(f"📄 Writing: {output_path}")
    
    # Convert markdown to PDF
    convert_markdown_to_pdf(str(readme_path), str(output_path))
    
    print(f"✅ PDF exported successfully to: {output_path}")
    
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

