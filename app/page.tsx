'use client'

import React, { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import confetti from 'canvas-confetti'
import { EXAMPLE_READMES } from './utils/example-readmes'
import { SignInButton, SignUpButton, useAuth, UserButton } from '@clerk/nextjs'
import { getUserCredits, updateUserCredits, saveGeneratedReadme, getGeneratedReadmes } from './utils/supabase'

export default function Home() {
  const [repoUrl, setRepoUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [readme, setReadme] = useState('')
  const [viewMode, setViewMode] = useState<'markdown' | 'preview'>('preview')
  const [credits, setCredits] = useState(5)
  const [errorMessage, setErrorMessage] = useState('')
  const [copyText, setCopyText] = useState('Copy')
  const { isSignedIn, userId } = useAuth()
  const [showHistory, setShowHistory] = useState(false)
  const [readmeHistory, setReadmeHistory] = useState<any[]>([])

  useEffect(() => {
    async function fetchCredits() {
      if (isSignedIn && userId) {
        try {
          const userCredits = await getUserCredits(userId)
          console.log('Initial credits loaded:', userCredits)
          setCredits(userCredits)
        } catch (error) {
          console.error('Error loading initial credits:', error)
        }
      }
    }
    fetchCredits()
  }, [isSignedIn, userId])

  useEffect(() => {
    async function fetchHistory() {
      if (isSignedIn && userId) {
        try {
          const history = await getGeneratedReadmes(userId)
          setReadmeHistory(history)
        } catch (error) {
          console.error('Error fetching README history:', error)
        }
      }
    }
    fetchHistory()
  }, [isSignedIn, userId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (credits <= 0) return
    setLoading(true)
    setErrorMessage('')
    
    try {
      let trimmedRepoUrl = repoUrl.endsWith('/') ? repoUrl.slice(0, -1) : repoUrl
      
      const repo = trimmedRepoUrl.replace('https://github.com/', '')
      if (repo in EXAMPLE_READMES) {
        setReadme(EXAMPLE_READMES[repo as keyof typeof EXAMPLE_READMES])
      } else {
        const response = await fetch('/api/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ repoUrl: trimmedRepoUrl }),
        })
        
        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to generate README')
        }
        
        const data = await response.json()
        if (!data.readme) {
          throw new Error('No README generated')
        }
        
        setReadme(data.readme)
        
        // Update credits in state and database
        if (userId) {
          const newCredits = credits - 1
          try {
            console.log('Attempting to update credits from', credits, 'to', newCredits)
            const success = await updateUserCredits(userId, newCredits)
            if (success) {
              console.log('Credits updated successfully, updating state')
              setCredits(newCredits)
            } else {
              throw new Error('Failed to update credits')
            }
          } catch (error) {
            console.error('Failed to update credits:', error)
            setErrorMessage('Failed to update credits. Please try again.')
            // Refresh credits from database to ensure consistency
            const currentCredits = await getUserCredits(userId)
            setCredits(currentCredits)
          }
        }

        // Save the generated README
        if (userId) {
          await saveGeneratedReadme(userId, trimmedRepoUrl, data.readme)
          // Refresh history
          const history = await getGeneratedReadmes(userId)
          setReadmeHistory(history)
        }
      }
      
      const end = Date.now() + 1000
      const colors = ['#ff0000', '#00ff00', '#0000ff', '#ff00ff', '#ffff00']

      ;(function frame() {
        confetti({
          particleCount: 5,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: colors
        })
        confetti({
          particleCount: 5,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: colors
        })

        if (Date.now() < end) {
          requestAnimationFrame(frame)
        }
      }())
    } catch (error) {
      console.error('Error generating README:', error)
      setErrorMessage(error instanceof Error ? error.message : 'Failed to generate README')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(readme)
      setCopyText('Copied')
      setTimeout(() => setCopyText('Copy'), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleDownload = () => {
    const blob = new Blob([readme], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'README.md'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleMarkdownEdit = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setReadme(e.target.value)
  }

  const exampleRepos = [
    'nextjs/next.js',
    'vercel/ai',
    'shadcn/ui',
    'tailwindlabs/tailwindcss',
    'prisma/prisma'
  ]

  return (
    <main className="min-h-screen bg-[#F5F5F5]">
      {isSignedIn && (
        <div className="absolute top-4 right-4 flex items-center gap-4">
          <div className="text-sm text-gray-600">
            <span className="font-medium">{credits}</span> credits remaining
          </div>
          <UserButton afterSignOutUrl="/" />
        </div>
      )}

      <div className="max-w-4xl mx-auto py-32 px-4">
        <div className="text-center space-y-6 mb-16">
          <h1 className="text-6xl font-bold">
            Git<span className="text-purple-600">Read</span>
          </h1>
          <h2 className="text-4xl text-black font-medium">
            AI-powered README generator
          </h2>
          <p className="text-gray-600 max-w-xl mx-auto text-lg">
            Turn any Git repository into a professional README file using AI. Perfect for documenting your projects with minimal effort.
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-3">
              <input
                type="text"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                placeholder="https://github.com/tailwindlabs/tailwindcss"
                className="flex-1 p-4 border rounded-2xl bg-white focus:outline-none focus:ring-1 focus:ring-gray-200 text-lg"
              />
              <button
                type="submit"
                disabled={loading || !isSignedIn || credits <= 0}
                className="px-6 py-4 bg-black text-white rounded-2xl disabled:opacity-50 hover:bg-gray-800 transition-colors text-lg font-medium"
              >
                Generate ✨
              </button>
            </div>
            {errorMessage && (
              <div className="mt-4 p-4 bg-red-50 rounded-xl text-center">
                <p className="text-red-600">{errorMessage}</p>
              </div>
            )}
          </form>

          {isSignedIn && credits <= 0 && (
            <div className="mt-4 p-4 bg-red-50 rounded-xl text-center">
              <p className="text-red-600 mb-2">You've used all your credits</p>
              <p className="text-sm text-red-500">Contact support to get more credits</p>
            </div>
          )}

          {!isSignedIn && (
            <div className="mt-4 p-4 bg-gray-50 rounded-xl text-center">
              <p className="text-gray-600 mb-4">Sign in to generate README files</p>
              <div className="flex gap-4 justify-center">
                <SignInButton mode="modal">
                  <button className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                    Sign In
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors">
                    Sign Up
                  </button>
                </SignUpButton>
              </div>
            </div>
          )}

          <div className="space-y-3 mt-6">
            <p className="text-base text-gray-600">Try these example repositories:</p>
            <div className="flex flex-wrap gap-2">
              {exampleRepos.map((repo) => (
                <button
                  key={repo}
                  onClick={() => setRepoUrl(`https://github.com/${repo}`)}
                  className="px-4 py-2 text-base bg-gray-50 text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                >
                  {repo}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading && (
          <div className="text-center mt-8">
            <p className="text-gray-600">Generating README...</p>
          </div>
        )}

        {readme && isSignedIn && (
          <div className="mt-8 space-y-4">
            <div className="flex items-center justify-between">
              <div className="bg-gray-100 p-1 rounded-lg inline-flex">
                <button
                  onClick={() => setViewMode('preview')}
                  className={`px-3 py-1 rounded-md text-sm transition-colors ${
                    viewMode === 'preview' 
                      ? 'bg-white shadow-sm text-gray-800' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Preview
                </button>
                <button
                  onClick={() => setViewMode('markdown')}
                  className={`px-3 py-1 rounded-md text-sm transition-colors ${
                    viewMode === 'markdown' 
                      ? 'bg-white shadow-sm text-gray-800' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Markdown
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCopy}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors inline-flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                  {copyText}
                </button>
                <button
                  onClick={handleDownload}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors inline-flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download
                </button>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6">
              {viewMode === 'markdown' ? (
                <textarea
                  value={readme}
                  onChange={handleMarkdownEdit}
                  className="w-full h-[500px] font-mono text-sm p-4 bg-gray-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  spellCheck="false"
                />
              ) : (
                <div className="prose prose-gray max-w-none">
                  <ReactMarkdown>{readme}</ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        )}

        {readme && !isSignedIn && (
          <div className="mt-8">
            <div className="bg-white rounded-xl shadow-sm p-6 relative">
              <div className="prose prose-gray max-w-none opacity-50 blur-sm">
                <ReactMarkdown>{readme}</ReactMarkdown>
              </div>
              <div className="absolute inset-0 flex items-center justify-center bg-white/50">
                <div className="bg-white px-6 py-3 rounded-lg shadow-sm">
                  <p className="text-gray-700 font-medium">Sign in to view the generated README</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {isSignedIn && (
          <div className="mt-8">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="mb-4 px-4 py-2 text-sm bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors inline-flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {showHistory ? 'Hide History' : 'Show History'}
            </button>
            
            {showHistory && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Previously Generated READMEs</h3>
                {readmeHistory.map((item) => (
                  <div key={item.id} className="bg-white rounded-xl shadow-sm p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-medium text-gray-900">{item.repo_url}</h4>
                        <p className="text-sm text-gray-500">
                          {new Date(item.created_at).toLocaleDateString()} at{' '}
                          {new Date(item.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setReadme(item.readme_content)
                          setRepoUrl(item.repo_url)
                        }}
                        className="px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        View
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="text-center mt-8 text-base text-gray-500">
          Made with ❤️ by{' '}
          <a
            href="https://twitter.com/koyalhq"
            className="text-purple-600 hover:text-purple-500"
            target="_blank"
            rel="noopener noreferrer"
          >
            @koyalhq
          </a>
        </div>
      </div>
    </main>
  )
} 