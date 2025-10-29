---
layout: default
---

## Loading Documentation...

Please wait while the documentation loads, or [view the README directly on GitHub](../README.md).

<script src="https://cdn.jsdelivr.net/npm/marked@11/marked.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
<script>
  mermaid.initialize({ 
    startOnLoad: true,
    theme: 'default',
    securityLevel: 'loose',
    flowchart: { useMaxWidth: true, htmlLabels: true }
  });

  // Fetch README from GitHub raw content
  const repo = window.location.pathname.split('/').slice(1, 3).join('/');
  const readmeUrl = `https://raw.githubusercontent.com/${repo}/master/README.md`;
  
  fetch(readmeUrl)
    .then(r => r.text())
    .then(text => {
      const processed = text.replace(/```mermaid\n([\s\S]*?)```/g, 
        (m, code) => `<div class="mermaid">${code.trim()}</div>`
      );
      document.body.innerHTML = marked.parse(processed);
      mermaid.run();
    })
    .catch(err => {
      document.body.innerHTML = `<h1>Error</h1><p>Could not load README. Please view it <a href="../README.md">on GitHub</a>.</p>`;
    });
</script>

<style>
  .mermaid { margin: 2rem 0; text-align: center; background: white; padding: 1rem; border-radius: 8px; }
</style>

