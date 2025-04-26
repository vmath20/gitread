import { NextResponse } from 'next/server'
import { OpenAI } from 'openai'
import { spawn } from 'child_process'
import path from 'path'
import fs from 'fs/promises'
import os from 'os'
import { getAuth } from '@clerk/nextjs/server'
import { getUserCredits, setUserCredits } from '../../utils/supabase'

// Get the API key from environment variable
const openRouterApiKey = process.env.OPENROUTER_API_KEY
console.log("🔑 OpenRouter API Key:", openRouterApiKey ? "Present" : "Missing")
if (!openRouterApiKey) {
  console.error("❌ OPENROUTER_API_KEY is not set in environment variables")
}

const client = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: openRouterApiKey || "",
})

// Add customInstructions to your request body type
interface GenerateRequest {
  repoUrl: string;
}

interface GitIngestOutput {
  content: string;
  summary: string;
  tree: string;
  estimated_tokens: number;
  warnings?: string[];
  limits?: {
    max_file_size: string;
    max_total_size: string;
    max_files: number;
    max_directory_depth: number;
    max_input_tokens: number;
  };
  error?: string;
}

function countWords(text: string): number {
  // Split by whitespace and filter out empty strings
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

// Add this function to parse and count repository content
function parseRepositoryContent(content: string): number {
  try {
    // Log the first part of the content to debug
    console.log("Content sample:", content.substring(0, 1000));
    
    // Split the content into sections (files, metadata, etc.)
    const sections = content.split(/\n(?=(?:File:|Directory:|Metadata:|Description:))/g);
    
    // Join all the actual content, removing section headers
    const allContent = sections
      .map(section => section.replace(/^(File:|Directory:|Metadata:|Description:).*?\n/s, ''))
      .join('\n');
    
    // Count words in the actual content
    const wordCount = countWords(allContent);
    console.log("Repository content word count:", wordCount);
    
    return wordCount;
  } catch (error) {
    console.error("Error parsing repository content:", error);
    return 0;
  }
}

// Validate GitHub URL
function isValidGitHubUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url)
    return (
      parsedUrl.protocol === 'https:' &&
      parsedUrl.hostname === 'github.com' &&
      parsedUrl.pathname.split('/').length >= 3 && // Should have at least user/repo
      !parsedUrl.pathname.includes('..') && // Prevent path traversal
      !parsedUrl.search && // No query parameters
      !parsedUrl.hash // No hash fragments
    )
  } catch {
    return false
  }
}

export async function POST(req: Request) {
  // Check if API key is set
  if (!openRouterApiKey) {
    return NextResponse.json({ 
      error: "OpenRouter API key is not configured. Please set OPENROUTER_API_KEY in your environment variables."
    }, { status: 500 })
  }

  // Check authentication
  const { userId } = getAuth(req)
  if (!userId) {
    return NextResponse.json({ 
      error: "Unauthorized. Please sign in to use this feature."
    }, { status: 401 })
  }

  // Check user credits
  try {
    const credits = await getUserCredits(userId)
    if (credits <= 0) {
      return NextResponse.json({ 
        error: "Insufficient credits. Please purchase more credits to continue."
      }, { status: 402 })
    }
  } catch (error) {
    console.error("Error checking user credits:", error)
    return NextResponse.json({ 
      error: "Error checking user credits. Please try again later."
    }, { status: 500 })
  }

  // Create a temporary directory for this request
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'gitingest-'))
  console.log("📁 Created temporary directory:", tempDir)
  
  try {
    const { repoUrl } = await req.json()
    console.log("🔗 Processing repository URL:", repoUrl)

    // Strict URL validation
    if (!isValidGitHubUrl(repoUrl)) {
      return NextResponse.json({ 
        error: "Invalid repository URL. Please provide a valid GitHub repository URL in the format: https://github.com/username/repository"
      }, { status: 400 })
    }
    
    // Run GitIngest Python script using spawn
    console.log("🟡 Running GitIngest for:", repoUrl)
    let gitIngestOutput: GitIngestOutput
    try {
      const scriptPath = path.join(process.cwd(), 'scripts', 'git_ingest.py')
      const pythonPath = path.join(process.cwd(), 'venv', 'bin', 'python3')
      console.log("📜 Script path:", scriptPath)
      console.log("🐍 Python path:", pythonPath)
      
      // Use spawn instead of exec to prevent command injection
      const pythonProcess = spawn(pythonPath, [scriptPath, repoUrl])
      
      let stdout = ''
      let stderr = ''
      
      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString()
      })
      
      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString()
      })
      
      const exitCode = await new Promise<number>((resolve) => {
        pythonProcess.on('close', resolve)
      })
      
      if (exitCode !== 0) {
        console.error("❌ GitIngest stderr:", stderr)
        throw new Error(`GitIngest script failed with exit code ${exitCode}. Stderr: ${stderr}`)
      }
      
      try {
        gitIngestOutput = JSON.parse(stdout)
        console.log("✅ Successfully parsed GitIngest output")
      } catch (parseError) {
        console.error("❌ Failed to parse GitIngest output:", stdout)
        throw new Error(`Failed to parse GitIngest output: ${parseError.message}`)
      }
    } catch (error: any) {
      console.error("❌ GitIngest error:", error.message)
      console.error("Error details:", error)
      throw new Error(`GitIngest failed: ${error.message}`)
    }
    
    if (gitIngestOutput.error) {
      console.log("⚠️ GitIngest returned error:", gitIngestOutput.error)
      return NextResponse.json({ 
        error: gitIngestOutput.error,
        limits: gitIngestOutput.limits
      }, { status: 400 })
    }
    
    // Use estimated tokens if available, otherwise count words
    const inputTokens = gitIngestOutput.estimated_tokens || countWords(gitIngestOutput.content)
    console.log("📝 Input tokens:", inputTokens)
    
    // Check if input tokens exceed the limit
    if (inputTokens > (gitIngestOutput.limits?.max_input_tokens || 250_000)) {
      console.log("⚠️ Token limit exceeded")
      return NextResponse.json({ 
        error: `Repository content exceeds maximum token limit of ${gitIngestOutput.limits?.max_input_tokens.toLocaleString()} tokens (estimated ${inputTokens.toLocaleString()} tokens)`,
        limits: gitIngestOutput.limits
      }, { status: 400 })
    }
    
    // Create prompt for the model
    const prompt = `Make a README for the following GitHub repository. 
    Directly output the README file without any additional text.\n\n\n
    Summary:\n${gitIngestOutput.summary}\n\n\n
    Tree:\n${gitIngestOutput.tree}\n\n\n
    Content:\n${gitIngestOutput.content}`

    // Generate README using Gemini
    console.log("🤖 Generating README with Gemini...")
    let response = await client.chat.completions.create({
      model: "google/gemini-2.5-pro-preview-03-25",
      messages: [
        { role: "system", content: "You are an expert technical writer." },
        { role: "user", content: prompt }
      ]
    })
    
    // Clean up the markdown code block markers
    let readme = response.choices[0].message.content || ''
    readme = readme.replace(/^```markdown\n?/, '')
    readme = readme.replace(/```$/, '')
    readme = readme.trim()

    // Count output words
    const outputTokens = countWords(readme)
    console.log("📝 Output tokens:", outputTokens)

    // Decrement user credits after successful generation
    try {
      const newCredits = await getUserCredits(userId) - 1
      await setUserCredits(userId, newCredits)
      console.log("✅ User credits updated successfully")
    } catch (error) {
      console.error("❌ Error updating user credits:", error)
      // Continue with the response even if credit update fails
      // The user will still get their README, but we should log this for monitoring
    }

    return NextResponse.json({ 
      readme,
      inputTokens,
      outputTokens,
      warnings: gitIngestOutput.warnings,
      limits: gitIngestOutput.limits
    })
    
  } catch (error: any) {
    console.error("❌ Error:", error)
    console.error("Error stack:", error.stack)
    return NextResponse.json({ error: error.message }, { status: 500 })
  } finally {
    // Clean up temporary directory
    try {
      console.log("🧹 Cleaning up temporary directory:", tempDir)
      await fs.rm(tempDir, { recursive: true, force: true })
      console.log("✅ Cleanup complete")
    } catch (error) {
      console.error("❌ Error cleaning up temporary directory:", error)
    }
  }
} 