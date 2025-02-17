import { NextResponse, NextRequest } from 'next/server'
import OpenAI from 'openai'
import { getAuth } from '@clerk/nextjs/server'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(req: NextRequest) {
  const { userId } = getAuth(req)
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { repoUrl } = await req.json()
    
    // Extract owner and repo from GitHub URL
    const urlParts = repoUrl.split('/')
    const owner = urlParts[urlParts.length - 2]
    const repo = urlParts[urlParts.length - 1]

    if (!owner || !repo) {
      return NextResponse.json({ error: 'Invalid GitHub URL' }, { status: 400 })
    }

    // Fetch repository data from GitHub API
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json'
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('GitHub API Error:', errorText)
      return NextResponse.json({ error: 'Failed to fetch repository data', details: errorText }, { status: response.status })
    }

    const repoData = await response.json()

    // Fetch repository contents
    const contentsResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents`, {
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json'
      },
    })

    if (!contentsResponse.ok) {
      const errorText = await contentsResponse.text()
      console.error('GitHub Contents API Error:', errorText)
      return NextResponse.json({ error: 'Failed to fetch repository contents', details: errorText }, { status: contentsResponse.status })
    }

    const contents = await contentsResponse.json()

    if (!Array.isArray(contents)) {
      return NextResponse.json({ error: 'Invalid repository contents' }, { status: 400 })
    }

    // Create a prompt for OpenAI
    const prompt = `Generate a comprehensive and professional README.md file for the following GitHub repository:

Repository: ${repoData.name}
Description: ${repoData.description || 'No description provided'}
Language: ${repoData.language || 'Not specified'}
Contents: ${contents.map(item => item.name).join(', ')}

Please include:
1. A detailed project title and description
2. Key features and benefits
3. Comprehensive installation instructions
4. Detailed usage examples with code snippets
5. API documentation (if applicable)
6. Configuration options
7. Troubleshooting guide
8. Contributing guidelines
9. License information
10. Credits and acknowledgments

Format the README in Markdown and make it engaging and professional.`

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
    })

    const readme = completion.choices[0].message.content

    return NextResponse.json({ readme })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to generate README' 
    }, { status: 500 })
  }
} 