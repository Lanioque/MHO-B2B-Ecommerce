import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';

interface GitHubIssueRequest {
  title: string;
  description: string;
  pageUrl?: string;
  stepsToReproduce?: string;
  expectedBehavior?: string;
  actualBehavior?: string;
  severity?: string;
  screenshot?: string; // base64 image data
  browserInfo?: {
    userAgent: string;
    platform: string;
    language: string;
    screenResolution: string;
    viewportSize: string;
  };
}

/**
 * POST /api/debug/report-issue
 * Create a GitHub issue from user report
 */
async function reportIssueHandler(req: NextRequest) {
  try {
    const session = await requireAuth();
    
    // Get GitHub configuration from environment
    const githubToken = process.env.GITHUB_TOKEN;
    const githubRepoOwner = process.env.GITHUB_REPO_OWNER;
    const githubRepoName = process.env.GITHUB_REPO_NAME;

    if (!githubToken || !githubRepoOwner || !githubRepoName) {
      console.error('GitHub configuration missing');
      return NextResponse.json(
        { error: 'GitHub integration not configured. Please contact administrator.' },
        { status: 503 }
      );
    }

    // Parse request body
    const body: GitHubIssueRequest = await req.json();
    const { 
      title, 
      description, 
      pageUrl, 
      stepsToReproduce, 
      expectedBehavior, 
      actualBehavior, 
      severity,
      screenshot,
      browserInfo 
    } = body;

    if (!title || !description) {
      return NextResponse.json(
        { error: 'Title and description are required' },
        { status: 400 }
      );
    }

    // Get user info for context
    const userEmail = session.user.email || 'unknown';
    const userName = session.user.name || 'Unknown User';
    const userId = session.user.id;

    // Create issue body with user context and additional details
    const severityLabels: Record<string, string> = {
      low: 'low',
      medium: 'medium',
      high: 'high',
      critical: 'critical',
    };

    let issueBody = `## Issue Reported by User

**User:** ${userName} (${userEmail})
**User ID:** ${userId}
**Reported at:** ${new Date().toISOString()}
${severity ? `**Severity:** ${severity.toUpperCase()}` : ''}
${pageUrl ? `**Page URL:** ${pageUrl}` : ''}

---

## Description

${description}

`;

    if (stepsToReproduce) {
      issueBody += `## Steps to Reproduce

${stepsToReproduce}

`;
    }

    if (expectedBehavior || actualBehavior) {
      issueBody += `## Behavior

`;
      if (expectedBehavior) {
        issueBody += `**Expected:** ${expectedBehavior}

`;
      }
      if (actualBehavior) {
        issueBody += `**Actual:** ${actualBehavior}

`;
      }
    }

    if (browserInfo) {
      issueBody += `## Environment

- **User Agent:** ${browserInfo.userAgent}
- **Platform:** ${browserInfo.platform}
- **Language:** ${browserInfo.language}
- **Screen Resolution:** ${browserInfo.screenResolution}
- **Viewport Size:** ${browserInfo.viewportSize}

`;
    }

    let screenshotUrl: string | undefined;

    // Upload screenshot to GitHub if provided
    if (screenshot) {
      try {
        // Extract base64 data (remove data:image/png;base64, prefix if present)
        const base64Data = screenshot.includes(',') 
          ? screenshot.split(',')[1] 
          : screenshot;

        // Create filename with timestamp
        const timestamp = Date.now();
        const filename = `issue-screenshots/screenshot-${timestamp}-${userId.slice(0, 8)}.png`;
        const filePath = `.github/${filename}`;

        // Upload file to GitHub repository
        const uploadUrl = `https://api.github.com/repos/${githubRepoOwner}/${githubRepoName}/contents/${filePath}`;
        
        // Get branch name (default to main or master)
        const branch = process.env.GITHUB_REPO_BRANCH || 'main';
        
        const uploadResponse = await fetch(uploadUrl, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${githubToken}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
            'User-Agent': 'MHO-Platform',
          },
          body: JSON.stringify({
            message: `Add screenshot for issue report from ${userName}`,
            content: base64Data,
            branch: branch,
          }),
        });

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          // Construct the GitHub raw URL
          screenshotUrl = `https://raw.githubusercontent.com/${githubRepoOwner}/${githubRepoName}/${branch}/${filePath}`;
        } else {
          console.error('Failed to upload screenshot:', await uploadResponse.text());
          // Continue without screenshot if upload fails
        }
      } catch (err) {
        console.error('Error uploading screenshot:', err);
        // Continue without screenshot if upload fails
      }

      if (screenshotUrl) {
        issueBody += `## Screenshot

![Screenshot](${screenshotUrl})

`;
      }
    }

    issueBody += `---

*This issue was automatically created from the user report feature.*`;

    // Determine labels based on severity
    const labels = ['user-report', 'bug'];
    if (severity && severityLabels[severity]) {
      labels.push(severityLabels[severity]);
    }

    // Create GitHub issue
    const githubUrl = `https://api.github.com/repos/${githubRepoOwner}/${githubRepoName}/issues`;
    
    const githubResponse = await fetch(githubUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${githubToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'User-Agent': 'MHO-Platform',
      },
      body: JSON.stringify({
        title: `[User Report] ${title}`,
        body: issueBody,
        labels: labels,
      }),
    });

    if (!githubResponse.ok) {
      let errorData: any;
      try {
        errorData = await githubResponse.json();
      } catch {
        errorData = { message: await githubResponse.text() };
      }
      console.error('GitHub API error:', errorData);
      
      // Provide more specific error messages
      let errorMessage = 'Failed to create GitHub issue';
      if (githubResponse.status === 401) {
        errorMessage = 'Invalid GitHub token. Please check your configuration.';
      } else if (githubResponse.status === 404) {
        errorMessage = 'Repository not found. Please check GITHUB_REPO_OWNER and GITHUB_REPO_NAME.';
      } else if (githubResponse.status === 422) {
        errorMessage = 'GitHub API error. Labels may not exist in the repository.';
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: 500 }
      );
    }

    const issueData = await githubResponse.json();

    return NextResponse.json({
      success: true,
      issueUrl: issueData.html_url,
      issueNumber: issueData.number,
    });
  } catch (error) {
    console.error('Error creating GitHub issue:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const POST = reportIssueHandler;

