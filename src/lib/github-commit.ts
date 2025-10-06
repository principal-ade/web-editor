import { GitHubIssue } from '@/types/github'

export interface CommitOptions {
  repo: string
  issue: GitHubIssue
  token: string
  directory?: string
}

export async function commitIssueToRepo({ repo, issue, token, directory = 'issues' }: CommitOptions) {
  const [owner, repoName] = repo.split('/')

  // Format the markdown content
  const markdown = `# ${issue.title}

**Issue #${issue.number}** • Opened by [@${issue.user.login}](https://github.com/${issue.user.login}) on ${new Date(issue.created_at).toLocaleDateString()}

**Status:** ${issue.state}

${issue.labels.length > 0 ? `**Labels:** ${issue.labels.map(l => l.name).join(', ')}\n` : ''}

[View on GitHub](${issue.html_url})

---

${issue.body || '*No description provided*'}
`

  // Create safe filename from issue title
  const filename = `${issue.number}-${issue.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50)}.md`

  const filePath = `${directory}/${filename}`

  try {
    // Get default branch
    const repoResponse = await fetch(`https://api.github.com/repos/${owner}/${repoName}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    })

    if (!repoResponse.ok) {
      throw new Error(`Failed to fetch repo info: ${repoResponse.statusText}`)
    }

    const repoData = await repoResponse.json()
    const defaultBranch = repoData.default_branch

    // Get the latest commit SHA of the default branch
    const refResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repoName}/git/ref/heads/${defaultBranch}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      }
    )

    if (!refResponse.ok) {
      throw new Error(`Failed to fetch branch ref: ${refResponse.statusText}`)
    }

    const refData = await refResponse.json()
    const latestCommitSha = refData.object.sha

    // Check if file already exists
    let existingFileSha: string | undefined
    try {
      const fileResponse = await fetch(
        `https://api.github.com/repos/${owner}/${repoName}/contents/${filePath}?ref=${defaultBranch}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github.v3+json',
          },
        }
      )

      if (fileResponse.ok) {
        const fileData = await fileResponse.json()
        existingFileSha = fileData.sha
      }
    } catch {
      // File doesn't exist, which is fine
    }

    // Create or update the file
    const createResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repoName}/contents/${filePath}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `Add issue #${issue.number}: ${issue.title}`,
          content: btoa(unescape(encodeURIComponent(markdown))), // Base64 encode
          branch: defaultBranch,
          ...(existingFileSha && { sha: existingFileSha }),
        }),
      }
    )

    if (!createResponse.ok) {
      const errorData = await createResponse.json()
      throw new Error(`Failed to create file: ${errorData.message || createResponse.statusText}`)
    }

    const result = await createResponse.json()
    return {
      success: true,
      filePath,
      commitUrl: result.commit.html_url,
      fileUrl: result.content.html_url,
    }
  } catch (error) {
    throw error
  }
}
