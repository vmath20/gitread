'use client'

import React, { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import confetti from 'canvas-confetti'
import { EXAMPLE_READMES } from './utils/example-readmes'
import { SignInButton, SignUpButton, useAuth, UserButton } from '@clerk/nextjs'
import { getUserCredits, setUserCredits, saveGeneratedReadme, getGeneratedReadmes } from './utils/supabase'
import { getStripe } from './utils/stripe'
import LoadingIndicator from './components/LoadingIndicator'
import ThemeToggle from './components/ThemeToggle'
import rehypeRaw from 'rehype-raw'

export default function Home() {
  const [repoUrl, setRepoUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [readme, setReadme] = useState('')
  const [viewMode, setViewMode] = useState<'markdown' | 'preview'>('preview')
  const [credits, setCredits] = useState(1)
  const [errorMessage, setErrorMessage] = useState('')
  const [copyText, setCopyText] = useState('Copy')
  const { isSignedIn, userId } = useAuth()
  const [showHistory, setShowHistory] = useState(false)
  const [readmeHistory, setReadmeHistory] = useState<any[]>([])
  const [inputTokens, setInputTokens] = useState<number | null>(null)
  const [outputTokens, setOutputTokens] = useState<number>(0)
  const [selectedCredits, setSelectedCredits] = useState<number>(2)

  useEffect(() => {
    async function fetchCredits() {
      if (isSignedIn && userId) {
        try {
          const response = await fetch('/api/credits');
          if (!response.ok) {
            throw new Error(`Error fetching credits: ${response.statusText}`);
          }
          
          const data = await response.json();
          console.log('Initial credits loaded:', data.credits);
          setCredits(data.credits);
        } catch (error) {
          console.error('Error loading initial credits:', error);
        }
      }
    }
    fetchCredits();

    // Check for repo URL parameter and automatically populate the input
    const urlParams = new URLSearchParams(window.location.search)
    const repoParam = urlParams.get('repo')
    if (repoParam) {
      setRepoUrl(repoParam)
      // Optionally auto-submit
      if (isSignedIn && credits > 0) {
        // Use a timeout to ensure state updates have occurred
        setTimeout(() => {
          const submitButton = document.getElementById('submit-repo-button')
          if (submitButton) {
            submitButton.click()
          }
        }, 500)
      }
    }
  }, [isSignedIn, userId])

  useEffect(() => {
    async function fetchHistory() {
      if (isSignedIn && userId) {
        try {
          const response = await fetch('/api/readme-history');
          if (!response.ok) {
            throw new Error(`Error fetching README history: ${response.statusText}`);
          }
          
          const data = await response.json();
          setReadmeHistory(data.history);
        } catch (error) {
          console.error('Error fetching README history:', error);
        }
      }
    }
    fetchHistory();
  }, [isSignedIn, userId]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isSignedIn && userId) {
      // Refresh credits every 30 seconds
      interval = setInterval(async () => {
        try {
          const response = await fetch('/api/credits');
          if (!response.ok) {
            throw new Error(`Error refreshing credits: ${response.statusText}`);
          }
          
          const data = await response.json();
          setCredits(data.credits);
        } catch (error) {
          console.error('Error refreshing credits:', error);
        }
      }, 30000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isSignedIn, userId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    setLoading(true)
    setErrorMessage('')
    setInputTokens(null)  // Set to null while processing
    setOutputTokens(0)    // Set to 0 while processing
    
    try {
      let trimmedRepoUrl = repoUrl.endsWith('/') ? repoUrl.slice(0, -1) : repoUrl
      const repo = trimmedRepoUrl.replace('https://github.com/', '')
      
      if (repo in EXAMPLE_READMES) {
        // For example repos, just set the content directly without loading state
        setLoading(false)
        const exampleReadmeContent = EXAMPLE_READMES[repo as keyof typeof EXAMPLE_READMES]
        setReadme(exampleReadmeContent)
        
        // Count words for example content
        const wordCount = exampleReadmeContent.trim().split(/\s+/).filter(word => word.length > 0).length
        setInputTokens(wordCount)
        setOutputTokens(wordCount)
        
        showConfetti()
        return // Exit early for example repos
      }
      
      // Only proceed with API call and credit deduction for non-example repos
      if (credits <= 0) return
      
      console.log("Submitting request for:", trimmedRepoUrl);
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          repoUrl: trimmedRepoUrl
        }),
      })
      
      const data = await response.json()
      console.log("API response:", response.status, data);
      
      if (!response.ok) {
        console.error('API error:', data.error);
        
        // Determine error type and appropriate icon
        let errorIcon = '';
        let errorClass = '';
        
        if (data.error?.includes('token limit')) {
          errorIcon = '⚠️';
          errorClass = 'bg-yellow-50 text-yellow-800';
        } else if (data.error?.includes('private')) {
          errorIcon = '🔒';
          errorClass = 'bg-blue-50 text-blue-800';
        } else if (data.error?.includes('rate limit') || data.error?.includes('API rate limit')) {
          errorIcon = '🚫';
          errorClass = 'bg-orange-50 text-orange-800';
        } else if (data.error?.includes('timed out')) {
          errorIcon = '⏱️';
          errorClass = 'bg-purple-50 text-purple-800';
        } else {
          errorClass = 'bg-red-50 text-red-600';
        }
        
        setErrorMessage(`${errorIcon} ${data.error}`);
        setLoading(false);
        return;
      }
      
      // Set README and word counts from API response
      setReadme(data.readme)
      setInputTokens(data.inputTokens)  // This will now be the actual word count
      setOutputTokens(data.outputTokens)
      
      // Update credits using the new API endpoint
      if (userId) {
        try {
          const newCredits = credits - 1
          
          const creditsResponse = await fetch('/api/credits', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ credits: newCredits }),
          });
          
          if (!creditsResponse.ok) {
            throw new Error(`Failed to update credits: ${creditsResponse.statusText}`);
          }
          
          const creditsData = await creditsResponse.json();
          setCredits(creditsData.credits);
          
          // Save the README using the new API endpoint
          const saveResponse = await fetch('/api/readme-history', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              repoUrl: trimmedRepoUrl, 
              readmeContent: data.readme 
            }),
          });
          
          if (!saveResponse.ok) {
            throw new Error(`Failed to save README: ${saveResponse.statusText}`);
          }
          
          // Refresh README history
          const historyResponse = await fetch('/api/readme-history');
          if (historyResponse.ok) {
            const historyData = await historyResponse.json();
            setReadmeHistory(historyData.history);
          }
        } catch (error) {
          console.error('Error updating credits or history:', error);
          
          // Refresh credits from the server to ensure consistency
          const refreshResponse = await fetch('/api/credits');
          if (refreshResponse.ok) {
            const refreshData = await refreshResponse.json();
            setCredits(refreshData.credits);
          }
        }
      }
      
      showConfetti()
    } catch (error) {
      console.error('Error:', error)
      if (!readme) {
        // This will now only catch network errors or other unexpected issues
        setErrorMessage('Network error or other unexpected issue. Please try again.');
      }
    } finally {
      setLoading(false)
    }
  }

  // Separate confetti function to keep code DRY
  const showConfetti = () => {
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
    'vmath20/IsoPath',
    'marktext/marktext',
    '3b1b/manim',
    'mark3labs/mcp-go'
  ]

  const handleBuyCredits = async (creditAmount: number) => {
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ credits: creditAmount }),
      });

      const { sessionId } = await response.json();
      const stripe = await getStripe();
      
      if (stripe) {
        const { error } = await stripe.redirectToCheckout({ sessionId });
        if (error) {
          console.error('Error redirecting to checkout:', error);
        }
      }
    } catch (error) {
      console.error('Error buying credits:', error);
    }
  };

  return (
    <main className="min-h-screen bg-[#FBF9F5] dark:bg-gray-900 relative">
      {isSignedIn && (
        <div className="absolute top-4 right-4 flex items-center gap-4">
          <div className="bg-white dark:bg-gray-800 px-4 py-2 rounded-full shadow-sm">
            <span className="font-semibold text-purple-600 dark:text-purple-400">{credits}</span>
            <span className="text-gray-600 dark:text-gray-300"> credits remaining</span>
          </div>
          <ThemeToggle />
          <UserButton afterSignOutUrl="/" />
        </div>
      )}

      <div className="max-w-4xl mx-auto py-32 px-4">
        <div className="text-center space-y-6 mb-16">
          <h1 className="text-6xl font-bold text-black dark:text-white">
            Git<span className="text-purple-600 dark:text-purple-400">Read</span>
          </h1>
          <h2 className="text-4xl text-black dark:text-white font-medium">
            AI-powered README generator
          </h2>
          <p className="text-gray-600 dark:text-gray-300 max-w-xl mx-auto text-lg">
            Turn any Git repository into a professional README file using AI. Perfect for documenting your projects with minimal effort.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8">
          <form onSubmit={handleSubmit} className="w-full max-w-3xl space-y-6">
            <div className="flex flex-col md:flex-row w-full gap-2">
              <input
                type="text"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                placeholder="Enter GitHub repository URL"
                className="flex-grow shadow-sm rounded-lg px-4 py-2.5 border 
                border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:text-white"
                aria-label="GitHub repository URL"
                aria-required="true"
              />
              <button
                id="submit-repo-button"
                type="submit"
                disabled={loading || !repoUrl || (!isSignedIn && credits <= 0)}
                className={`rounded-lg px-6 py-2.5 text-white font-semibold shadow-sm
                ${(!repoUrl || loading || (!isSignedIn && credits <= 0))
                    ? 'bg-gray-400 dark:bg-gray-600'
                    : 'bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-800'
                }`}
                aria-busy={loading}
              >
                Generate ✨
              </button>
            </div>
            
            <div className="mt-2">
              {errorMessage && (
                <div className={`mt-4 p-4 ${
                  errorMessage.includes('⚠️') ? 'bg-yellow-50 text-yellow-800' : 
                  errorMessage.includes('🔒') ? 'bg-blue-50 text-blue-800' :
                  errorMessage.includes('🚫') ? 'bg-orange-50 text-orange-800' :
                  errorMessage.includes('⏱️') ? 'bg-purple-50 text-purple-800' :
                  'bg-red-50 text-red-600'
                } rounded-xl text-center`}>
                  <p className={
                    errorMessage.includes('⚠️') ? 'text-yellow-800' : 
                    errorMessage.includes('🔒') ? 'text-blue-800' :
                    errorMessage.includes('🚫') ? 'text-orange-800' :
                    errorMessage.includes('⏱️') ? 'text-purple-800' :
                    'text-red-600'
                  }>{errorMessage}</p>
                </div>
              )}
            </div>
          </form>

          {isSignedIn && credits <= 0 && (
            <div className="mt-4 p-8 bg-white rounded-xl shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-800">Purchase Credits</h3>
                <div className="bg-purple-100 text-purple-600 px-3 py-1 rounded-full text-sm font-medium">
                  Best Value
                </div>
              </div>
              
              <p className="text-gray-600 mb-6">You've used all your credits</p>
              
              <div className="bg-white space-y-6">
                <div className="flex justify-between items-center">
                  <div className="text-gray-700 font-medium">Select credits:</div>
                  <div className="text-5xl font-bold text-purple-600">{selectedCredits}</div>
                </div>
                
                <div className="relative pt-1">
                  <input 
                    type="range" 
                    min="2" 
                    max="100" 
                    step="2" 
                    value={selectedCredits} 
                    onChange={(e) => setSelectedCredits(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                  />
                  
                  <div className="flex justify-between text-xs text-gray-500 px-2 mt-2">
                    <div>2</div>
                    <div>25</div>
                    <div>50</div>
                    <div>100</div>
                  </div>
                </div>
                
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-gray-600 text-sm">Total price:</div>
                      <div className="text-3xl font-bold text-purple-600">${(selectedCredits * 1.25).toFixed(2)}</div>
                    </div>
                    <div className="text-gray-600 text-sm">
                      $1.25 per credit
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => handleBuyCredits(selectedCredits)}
                  className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <span className="inline-block">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                      <line x1="1" y1="10" x2="23" y2="10"></line>
                    </svg>
                  </span>
                  <span>Buy {selectedCredits} Credits for ${(selectedCredits * 1.25).toFixed(2)}</span>
                </button>
                
                <div className="flex justify-center items-center text-sm text-gray-500">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-500 mr-1">
                    <path d="M13 2L3 14h9l-1 8l10-12h-9l1-8z"></path>
                  </svg>
                  <span>Credits never expire and can be used anytime</span>
                </div>
              </div>
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

        {loading && <LoadingIndicator />}

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
                  <ReactMarkdown rehypePlugins={[rehypeRaw]}>
                    {readme}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        )}

        {readme && !isSignedIn && (
          <div className="mt-8">
            <div className="bg-white rounded-xl shadow-sm p-6 relative">
              <div className="prose prose-gray max-w-none opacity-50 blur-sm">
                <ReactMarkdown rehypePlugins={[rehypeRaw]}>
                  {readme}
                </ReactMarkdown>
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
          <div className="mt-12">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="mb-6 px-4 py-2 text-sm bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 shadow-sm inline-flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {showHistory ? 'Hide History' : 'Show History'}
            </button>
            
            {showHistory && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Previously Generated READMEs</h3>
                {readmeHistory.length === 0 ? (
                  <p className="text-gray-600 dark:text-gray-400 text-center py-8">No READMEs generated yet</p>
                ) : (
                  readmeHistory.map((item) => (
                    <div key={item.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">{item.repo_url}</h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {new Date(item.created_at).toLocaleDateString()} at{' '}
                            {new Date(item.created_at).toLocaleTimeString()}
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setReadme(item.readme_content);
                            setRepoUrl(item.repo_url);
                            setShowHistory(false); // Hide history after selecting
                          }}
                          className="px-4 py-2 text-sm bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-all duration-200"
                        >
                          View README
                        </button>
                      </div>
                    </div>
                  ))
                )}
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