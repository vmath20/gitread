import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(req: Request) {
  try {
    const { repoUrl } = await req.json()
    
    // Extract owner and repo from GitHub URL
    const urlParts = repoUrl.split('/')
    const owner = urlParts[urlParts.length - 2]
    const repo = urlParts[urlParts.length - 1]

    // Fetch repository data from GitHub API
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      },
    })
    const repoData = await response.json()

    if (response.status !== 200) {
      throw new Error('Failed to fetch repository data')
    }

    // Fetch repository contents
    const contentsResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents`, {
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      },
    })
    const contents = await contentsResponse.json()

    if (!Array.isArray(contents)) {
      throw new Error('Invalid repository contents')
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
5. API documentation (if applicable, if not don't include it as a section)
6. Configuration options (if applicable, if not don't include it as a section)
7. Troubleshooting guide (if applicable, if not don't include it as a section)
8. Contributing guidelines (if applicable, if not don't include it as a section)
9. License information (if applicable, if not don't include it as a section)
10. Credits and acknowledgments (if applicable, if not don't include it as a section)

Make sure to:
- Provide clear code examples
- Include common use cases
- Explain any prerequisites
- Add badges where relevant
- Structure the content logically
- Use proper markdown formatting

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