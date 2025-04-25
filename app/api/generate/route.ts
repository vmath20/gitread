import { NextResponse } from 'next/server'
import { OpenAI } from 'openai'
import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import fs from 'fs/promises'
import os from 'os'

const execAsync = promisify(exec)

const client = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY || "",
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

export async function POST(req: Request) {
  // Create a temporary directory for this request
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'gitingest-'))
  console.log("📁 Created temporary directory:", tempDir)
  
  try {
    const { repoUrl } = await req.json()
    console.log("🔗 Processing repository URL:", repoUrl)
    
    // Run GitIngest Python script
    console.log("🟡 Running GitIngest for:", repoUrl)
    let gitIngestOutput: GitIngestOutput
    try {
      const scriptPath = path.join(process.cwd(), 'scripts', 'git_ingest.py')
      const pythonPath = path.join(process.cwd(), 'venv', 'bin', 'python3')
      console.log("📜 Script path:", scriptPath)
      console.log("🐍 Python path:", pythonPath)
      
      const command = `${pythonPath} ${scriptPath} "${repoUrl}"`
      console.log("🔧 Executing command:", command)
      
      const result = await execAsync(command)
      console.log("📝 GitIngest output:", result.stdout)
      
      try {
        gitIngestOutput = JSON.parse(result.stdout)
        console.log("✅ Successfully parsed GitIngest output")
      } catch (parseError) {
        console.error("❌ Failed to parse GitIngest output:", result.stdout)
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
    Directly output the README file without any additional text.\n\n
    Summary:\n${gitIngestOutput.summary}\n\n
    Tree:\n${gitIngestOutput.tree}\n\n
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