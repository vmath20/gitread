import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// First handle custom redirects, then apply Clerk authentication
function customRedirects(req: NextRequest) {
  const { pathname, host, searchParams } = req.nextUrl
  
  // Skip domain redirect if a repo parameter is already present
  const hasRepoParam = searchParams.has('repo')
  
  // Handle redirects from gitread.com to gitread.dev
  if (!hasRepoParam && (host === 'gitread.com' || host.endsWith('.gitread.com'))) {
    // Create a redirect URL to gitread.dev with the same path
    const url = req.nextUrl.clone()
    url.host = 'gitread.dev'
    url.port = '' // Clear any port information
    return NextResponse.redirect(url)
  }
  
  // Handle redirects from generatemyreadme.com/username/repository to gitread.dev with repo parameter
  if (host === 'generatemyreadme.com' || host.endsWith('.generatemyreadme.com') ||
      host === 'pleasegeneratemyreadmesoidonthaveto.com' || host.endsWith('.pleasegeneratemyreadmesoidonthaveto.com')) {
    // Pattern for username/repository path format
    if (pathname.match(/^\/[^\/]+\/[^\/]+$/)) {
      // Extract the username and repository from the path
      const [, username, repository] = pathname.split('/')
      
      // Create the GitHub URL
      const githubUrl = `https://github.com/${username}/${repository}`
      
      // Redirect to gitread.dev with the repo URL as a parameter
      const url = req.nextUrl.clone()
      url.host = 'gitread.dev'
      url.port = '' // Clear any port information
      url.pathname = '/'
      url.searchParams.set('repo', githubUrl)
      
      return NextResponse.redirect(url)
    }
    
    // If path doesn't match username/repository pattern, just redirect to gitread.dev
    if (!hasRepoParam) {
      const url = req.nextUrl.clone()
      url.host = 'gitread.dev'
      url.port = '' // Clear any port information
      return NextResponse.redirect(url)
    }
  }
  
  // Pattern for username/repository path format that doesn't conflict with known app routes
  if (pathname.match(/^\/[^\/]+\/[^\/]+$/) && 
      !pathname.startsWith('/api/') && 
      !pathname.startsWith('/_next/') && 
      !pathname.startsWith('/trpc/')) {
    
    // Extract the username and repository from the path
    const [, username, repository] = pathname.split('/')
    
    // Create the GitHub URL
    const githubUrl = `https://github.com/${username}/${repository}`
    
    // Redirect to the home page with the repo URL as a parameter
    const url = req.nextUrl.clone()
    url.pathname = '/'
    url.searchParams.set('repo', githubUrl)
    
    return NextResponse.redirect(url)
  }
  
  return null // No redirect needed
}

// Define public routes using createRouteMatcher
const isPublicRoute = createRouteMatcher([
  '/', 
  '/terms', 
  '/privacy', 
  '/support',
  '/api/health'
])

// Export middleware function that combines custom redirects with Clerk authentication
export default clerkMiddleware(async (auth, req) => {
  // Apply custom redirects first
  const redirectResult = customRedirects(req);
  if (redirectResult) return redirectResult;
  
  // If it's a public route, allow access
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }
  
  // For protected routes, check authentication
  // The middleware will handle authentication automatically for non-public routes
})

// See https://nextjs.org/docs/app/building-your-application/routing/middleware
export const config = {
  matcher: [
    // Skip Next.js internal routes and static files
    '/((?!_next/static|_next/image|favicon.ico).*)',
    // Make sure API routes are included
    '/(api|trpc)(.*)'
  ],
}