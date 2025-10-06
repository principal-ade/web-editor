export interface Repository {
  npmName: string
  githubRepo: string
  displayName: string
}

export const repositories: Repository[] = [
  {
    npmName: 'a24z-memory',
    githubRepo: 'a24z-ai/a24z-memory',
    displayName: 'a24z-memory'
  },
  {
    npmName: '@a24z/core-library',
    githubRepo: 'a24z-ai/core-library',
    displayName: '@a24z/core-library'
  },
  {
    npmName: '@a24z/markdown-utils',
    githubRepo: 'a24z-ai/themed-markdown',
    displayName: '@a24z/markdown-utils'
  },
  {
    npmName: '@a24z/alexandria-cli',
    githubRepo: 'a24z-ai/alexandria-cli',
    displayName: '@a24z/alexandria-cli'
  },
  {
    npmName: '@a24z/pixeltable-sdk',
    githubRepo: 'a24z-ai/pixeltable',
    displayName: '@a24z/pixeltable-sdk'
  },
  {
    npmName: '@a24z/markdown-search',
    githubRepo: 'a24z-ai/markdown-search',
    displayName: '@a24z/markdown-search'
  },
  {
    npmName: '@a24z/alexandria-outpost',
    githubRepo: 'a24z-ai/Alexandria',
    displayName: '@a24z/alexandria-outpost'
  },
  {
    npmName: '@a24z/principal-md',
    githubRepo: 'a24z-ai/principal.md',
    displayName: '@a24z/principal-md'
  },
  {
    npmName: '@a24z/industry-theme',
    githubRepo: 'a24z-ai/industry-theme',
    displayName: '@a24z/industry-theme'
  }
]
