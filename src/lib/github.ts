import { GitHubIssue } from '@/types/github'

export async function fetchGitHubIssues(repo: string): Promise<GitHubIssue[]> {
  // Validate repo format (owner/repo)
  const repoMatch = repo.match(/^([^/]+)\/([^/]+)$/)
  if (!repoMatch) {
    throw new Error('Invalid repository format. Use "owner/repo"')
  }

  const url = `https://api.github.com/repos/${repo}/issues?state=all&per_page=100`

  const response = await fetch(url, {
    headers: {
      'Accept': 'application/vnd.github.v3+json',
    },
    // Add cache option for client-side fetching
    cache: 'no-store'
  })

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Repository not found or is not public')
    }
    throw new Error(`GitHub API error: ${response.statusText}`)
  }

  return response.json()
}
