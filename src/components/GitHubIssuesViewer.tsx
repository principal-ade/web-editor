'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { DocumentView, defaultTheme } from 'themed-markdown'
import { useTheme } from '@a24z/industry-theme'
import { fetchGitHubIssues } from '@/lib/github'
import { commitIssueToRepo } from '@/lib/github-commit'
import { GitHubIssue } from '@/types/github'
import { repositories, Repository } from '@/config/repositories'
import { Loader2, AlertCircle, X, Package, Check } from 'lucide-react'

interface RepoWithCount extends Repository {
  issueCount?: number
  loading?: boolean
}

export default function GitHubIssuesViewer() {
  const { theme } = useTheme()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [repo, setRepo] = useState('')
  const [reposWithCounts, setReposWithCounts] = useState<RepoWithCount[]>(
    repositories.map(r => ({ ...r, issueCount: undefined, loading: true }))
  )
  const [issues, setIssues] = useState<GitHubIssue[]>([])
  const [selectedIssue, setSelectedIssue] = useState<GitHubIssue | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [githubToken, setGithubToken] = useState('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')
  const [approving, setApproving] = useState(false)
  const [approveSuccess, setApproveSuccess] = useState(false)
  const [approvedFilePath, setApprovedFilePath] = useState<string | null>(null)

  // Load repo and issue from URL on mount
  useEffect(() => {
    const repoFromUrl = searchParams.get('repo')
    const issueFromUrl = searchParams.get('issue')

    if (repoFromUrl) {
      setRepo(repoFromUrl)
      handleFetchIssues(repoFromUrl, issueFromUrl || undefined)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch issue counts for all repositories
  useEffect(() => {
    const fetchIssueCounts = async () => {
      const updatedRepos = await Promise.all(
        repositories.map(async (repository) => {
          try {
            const issues = await fetchGitHubIssues(repository.githubRepo)
            return { ...repository, issueCount: issues.length, loading: false }
          } catch {
            return { ...repository, issueCount: 0, loading: false }
          }
        })
      )
      setReposWithCounts(updatedRepos)
    }

    fetchIssueCounts()
  }, [])

  const handleFetchIssues = async (repoOverride?: string, issueNumber?: string) => {
    const targetRepo = repoOverride || repo.trim()

    if (!targetRepo) {
      setError('Please enter a repository')
      return
    }

    setLoading(true)
    setError(null)
    setIssues([])
    setSelectedIssue(null)
    setRepo(targetRepo) // Set repo state immediately

    // Update URL with repo
    const params = new URLSearchParams()
    params.set('repo', targetRepo)
    if (issueNumber) {
      params.set('issue', issueNumber)
    }
    router.push(`?${params.toString()}`, { scroll: false })

    try {
      const fetchedIssues = await fetchGitHubIssues(targetRepo)
      setIssues(fetchedIssues)

      // If issue number specified, select it
      if (issueNumber) {
        const issue = fetchedIssues.find(i => i.number === parseInt(issueNumber))
        if (issue) {
          setSelectedIssue(issue)
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch issues')
    } finally {
      setLoading(false)
    }
  }

  const handleIssueSelect = (issue: GitHubIssue) => {
    setSelectedIssue(issue)

    // Update URL with issue number
    const params = new URLSearchParams()
    params.set('repo', repo)
    params.set('issue', issue.number.toString())
    router.push(`?${params.toString()}`, { scroll: false })
  }

  const handleCloseDrawer = () => {
    setSelectedIssue(null)
    setApproveSuccess(false)
    setApprovedFilePath(null)

    // Remove issue from URL
    const params = new URLSearchParams()
    params.set('repo', repo)
    router.push(`?${params.toString()}`, { scroll: false })
  }

  const handleApprove = async () => {
    if (!selectedIssue) return

    setApproving(true)
    setError(null)

    try {
      const result = await commitIssueToRepo({
        repo,
        issue: selectedIssue,
        token: githubToken,
        directory: 'issues'
      })

      setApproveSuccess(true)
      setApprovedFilePath(result.filePath)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve issue')
    } finally {
      setApproving(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleFetchIssues()
    }
  }

  const handleRepoClick = (repository: Repository) => {
    handleFetchIssues(repository.githubRepo)
  }

  const handleBackToPackages = () => {
    setIssues([])
    setSelectedIssue(null)
    setRepo('')
    router.push('/', { scroll: false })
  }

  const currentRepository = repositories.find(r => r.githubRepo === repo)

  return (
    <div className="h-screen flex flex-col" style={{ backgroundColor: theme.colors.background }}>
      {/* Header */}
      <div className="p-4 border-b" style={{
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.border
      }}>
        <div className="max-w-6xl mx-auto">
          {issues.length > 0 && currentRepository ? (
            <div>
              <button
                onClick={handleBackToPackages}
                className="text-sm mb-2 hover:underline"
                style={{ color: theme.colors.primary }}
              >
                ← Back to packages
              </button>
              <h1 className="text-2xl font-bold" style={{ color: theme.colors.text }}>
                {currentRepository.displayName}
              </h1>
              <p className="text-sm mt-1" style={{ color: theme.colors.textSecondary }}>
                {currentRepository.githubRepo}
              </p>
            </div>
          ) : (
            <div>
              <h1 className="text-2xl font-bold" style={{ color: theme.colors.text }}>
                a24z Packages
              </h1>
              <p className="text-sm mt-1" style={{ color: theme.colors.textSecondary }}>
                Select a package to view GitHub issues
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Repository grid or issues list */}
      {issues.length > 0 ? (
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto p-4">
            <h2 className="text-lg font-semibold mb-3" style={{ color: theme.colors.text }}>
              Issues ({issues.length})
            </h2>
            <div className="space-y-2">
              {issues.map((issue) => (
                <button
                  key={issue.id}
                  onClick={() => handleIssueSelect(issue)}
                  className="w-full text-left p-4 rounded-lg border transition-colors"
                  style={{
                    backgroundColor: selectedIssue?.id === issue.id
                      ? theme.colors.highlight
                      : theme.colors.surface,
                    borderColor: selectedIssue?.id === issue.id
                      ? theme.colors.primary
                      : theme.colors.border,
                    color: theme.colors.text
                  }}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`inline-block w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                        issue.state === 'open'
                          ? 'bg-green-500'
                          : 'bg-purple-500'
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-base">
                        #{issue.number} {issue.title}
                      </div>
                      <div className="text-sm mt-1" style={{ color: theme.colors.textSecondary }}>
                        by {issue.user.login} • {new Date(issue.created_at).toLocaleDateString()}
                      </div>
                      {issue.labels.length > 0 && (
                        <div className="flex gap-2 mt-2 flex-wrap">
                          {issue.labels.map((label) => (
                            <span
                              key={label.id}
                              className="text-xs px-2 py-1 rounded"
                              style={{
                                backgroundColor: `#${label.color}20`,
                                color: `#${label.color}`,
                              }}
                            >
                              {label.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {reposWithCounts.map((repository) => (
                <button
                  key={repository.npmName}
                  onClick={() => handleRepoClick(repository)}
                  className="p-4 rounded-lg border text-left transition-all hover:shadow-md"
                  style={{
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                    color: theme.colors.text
                  }}
                >
                  <div className="flex items-start gap-3">
                    <Package className="w-5 h-5 flex-shrink-0 mt-1" style={{ color: theme.colors.primary }} />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm truncate">
                        {repository.displayName}
                      </div>
                      <div className="text-xs mt-1 truncate" style={{ color: theme.colors.textSecondary }}>
                        {repository.githubRepo}
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        {repository.loading ? (
                          <Loader2 className="w-3 h-3 animate-spin" style={{ color: theme.colors.textSecondary }} />
                        ) : (
                          <>
                            <span className="text-lg font-bold" style={{ color: theme.colors.primary }}>
                              {repository.issueCount || 0}
                            </span>
                            <span className="text-xs" style={{ color: theme.colors.textSecondary }}>
                              {repository.issueCount === 1 ? 'issue' : 'issues'}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Right drawer for selected issue */}
      {selectedIssue && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={handleCloseDrawer}
            style={{ animation: 'fadeIn 0.2s ease-out' }}
          />

          {/* Drawer */}
          <div
            className="fixed top-0 right-0 bottom-0 z-50 overflow-hidden flex flex-col"
            style={{
              backgroundColor: theme.colors.surface,
              width: '100%',
              maxWidth: '600px',
              animation: 'slideLeft 0.3s ease-out',
              boxShadow: '-4px 0 20px rgba(0,0,0,0.15)'
            }}
          >
            {/* Header with buttons */}
            <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: theme.colors.border }}>
              <button
                onClick={handleApprove}
                disabled={approving || approveSuccess}
                className="px-4 py-2 rounded-lg flex items-center gap-2 transition-all"
                style={{
                  backgroundColor: approveSuccess ? theme.colors.success : theme.colors.primary,
                  color: theme.colors.background,
                  opacity: approving ? 0.6 : 1,
                  cursor: approving || approveSuccess ? 'not-allowed' : 'pointer'
                }}
              >
                {approving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Approving...
                  </>
                ) : approveSuccess ? (
                  <>
                    <Check className="w-4 h-4" />
                    Approved!
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Approve
                  </>
                )}
              </button>
              <button
                onClick={handleCloseDrawer}
                className="p-2 rounded-lg hover:opacity-70 transition-opacity"
                style={{ color: theme.colors.textSecondary }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Success message with file path */}
            {approveSuccess && approvedFilePath && (
              <div className="mx-4 mt-4 p-4 rounded-lg" style={{
                backgroundColor: theme.colors.backgroundSecondary,
                borderColor: theme.colors.success,
                borderWidth: '1px',
                borderStyle: 'solid'
              }}>
                <p className="font-semibold mb-2" style={{ color: theme.colors.text }}>
                  This issue has been approved. Please review the contents and make a development plan in markdown for the principal engineer to review.
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <code
                    className="flex-1 px-3 py-2 rounded text-sm"
                    style={{
                      backgroundColor: theme.colors.background,
                      color: theme.colors.text,
                      fontFamily: 'monospace'
                    }}
                  >
                    {approvedFilePath}
                  </code>
                  <button
                    onClick={() => navigator.clipboard.writeText(approvedFilePath)}
                    className="px-3 py-2 rounded text-sm hover:opacity-80"
                    style={{
                      backgroundColor: theme.colors.primary,
                      color: theme.colors.background
                    }}
                  >
                    Copy
                  </button>
                </div>
              </div>
            )}

            {/* Error display */}
            {error && (
              <div className="mx-4 mt-4 p-3 rounded-lg flex items-start gap-2" style={{
                backgroundColor: theme.colors.backgroundSecondary,
                borderColor: theme.colors.error,
                borderWidth: '1px',
                borderStyle: 'solid',
                color: theme.colors.error
              }}>
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              <DocumentView
                content={selectedIssue.body || '*No description provided*'}
                theme={defaultTheme}
              />
            </div>
          </div>
        </>
      )}

      <style jsx>{`
        @keyframes slideLeft {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}
