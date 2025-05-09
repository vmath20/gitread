import { NextResponse, NextRequest } from 'next/server'
import { OpenAI } from 'openai'
import { spawn } from 'child_process'
import path from 'path'
import fs from 'fs/promises'
import os from 'os'
import { getAuth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

// Create a Supabase client with the service role key for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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
    
    // Join all the actual content, removing section headers - using a regex without the 's' flag
    const allContent = sections
      .map(section => section.replace(/^(File:|Directory:|Metadata:|Description:).*?\n/, ''))
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

// Create a function to get GitHub repo owner and name from URL
function extractGitHubRepoPath(url: string): string {
  try {
    const parsedUrl = new URL(url);
    // Extract the path, which should be like /username/repository
    let path = parsedUrl.pathname;
    
    // Remove leading slash
    if (path.startsWith('/')) {
      path = path.substring(1);
    }
    
    // Remove trailing slash
    if (path.endsWith('/')) {
      path = path.substring(0, path.length - 1);
    }
    
    return path;
  } catch {
    return '';
  }
}

// Simple in-memory queue for generation requests (single instance only)
const MAX_QUEUE_SIZE = 20;
const requestQueue: (() => Promise<void>)[] = [];
let processing = false;

async function processQueue() {
  if (processing) return;
  processing = true;
  while (requestQueue.length > 0) {
    const next = requestQueue.shift();
    if (next) await next();
  }
  processing = false;
}

export async function POST(req: NextRequest): Promise<Response> {
  // Overload detection: if queue is too long, return 429
  if (requestQueue.length >= MAX_QUEUE_SIZE) {
    return NextResponse.json({ error: '🚦 Server is busy. Please try again in a few moments.' }, { status: 429 });
  }

  // Calculate queue position (1-based)
  const queuePosition = requestQueue.length + 1;

  // If not first in queue, return queue position immediately
  if (queuePosition > 1) {
    return NextResponse.json({ message: 'Your request is in the queue.', queuePosition });
  }

  // Wrap the main logic in a promise and push to the queue
  return new Promise<Response>((resolve) => {
    requestQueue.push(async () => {
      try {
        // Check if API key is set
        if (!openRouterApiKey) {
          resolve(NextResponse.json({ 
            error: "OpenRouter API key is not configured. Please set OPENROUTER_API_KEY in your environment variables."
          }, { status: 500 }))
          return;
        }

        // Get authentication and require it
        const { userId } = getAuth(req)
        if (!userId) {
          resolve(NextResponse.json({ 
            error: "Authentication required. Please sign in to generate README files."
          }, { status: 401 }))
          return;
        }
        
        const { repoUrl } = await req.json()
        console.log("🔗 Processing repository URL:", repoUrl)

        // Strict URL validation
        if (!isValidGitHubUrl(repoUrl)) {
          resolve(NextResponse.json({ 
            error: "Invalid repository URL. Please provide a valid GitHub repository URL in the format: https://github.com/username/repository"
          }, { status: 400 }))
          return;
        }
        
        // Check user credits
        try {
          // Get user credits using service role
          const { data, error } = await supabaseAdmin
            .from('user_credits')
            .select('credits')
            .eq('user_id', userId)
            .single()
          
          if (error) {
            console.error("Error checking user credits:", error)
            
            // If no record exists, create one with default credits
            if (error.code === 'PGRST116') {
              const { data: newData, error: upsertError } = await supabaseAdmin
                .from('user_credits')
                .upsert({ 
                  user_id: userId, 
                  credits: 1,
                  updated_at: new Date().toISOString()
                })
                .select('credits')
                .single()
                
              if (upsertError) {
                console.error('Error creating user credits:', upsertError)
                resolve(NextResponse.json({ 
                  error: "Error checking user credits. Please try again later."
                }, { status: 500 }))
                return;
              }
              
              if (newData?.credits <= 0) {
                resolve(NextResponse.json({ 
                  error: "Insufficient credits. Please purchase more credits to continue."
                }, { status: 402 }))
                return;
              }
            } else {
              resolve(NextResponse.json({ 
                error: "Error checking user credits. Please try again later."
              }, { status: 500 }))
              return;
            }
          } else if (data.credits <= 0) {
            resolve(NextResponse.json({ 
              error: "Insufficient credits. Please purchase more credits to continue."
            }, { status: 402 }))
            return;
          }
        } catch (error) {
          console.error("Error checking user credits:", error)
          resolve(NextResponse.json({ 
            error: "Error checking user credits. Please try again later."
          }, { status: 500 }))
          return;
        }
        
        // Create a temporary directory for this request
        const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'gitingest-'))
        console.log("📁 Created temporary directory:", tempDir)
        
        try {
          // Extract GitHub repository path for DeepWiki URL
          const repoPath = extractGitHubRepoPath(repoUrl);
          
          // Run GitIngest Python script using spawn
          console.log("🟡 Calling Python microservice for:", repoUrl)
          let gitIngestOutput: GitIngestOutput
          try {
            const pythonApiUrl = "https://gitread-api.onrender.com/ingest";
            const pythonApiKey = process.env.PYTHON_API_KEY!; // Set this in your env

            const response = await fetch(pythonApiUrl, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-api-key": pythonApiKey,
              },
              body: JSON.stringify({ repo_url: repoUrl }),
            });

            const data = await response.json();
            if (data.error) {
              throw new Error(data.error);
            }
            gitIngestOutput = typeof data === "string" ? JSON.parse(data) : data;
          } catch (error: any) {
            console.error("❌ Error:", error)
            console.error("Error stack:", error.stack)
            
            // Extract a concise error message
            let errorMessage = error.message || "An unknown error occurred";
            
            // Avoid returning sensitive or verbose error information to the client
            if (errorMessage.length > 150) {
              errorMessage = "An unexpected error occurred. Please try again later.";
            }
            
            resolve(NextResponse.json({ error: errorMessage }, { status: 500 }))
            return;
          }
          
          if (gitIngestOutput.error) {
            console.log("⚠️ GitIngest returned error:", gitIngestOutput.error)
            resolve(NextResponse.json({ 
              error: gitIngestOutput.error,
              limits: gitIngestOutput.limits
            }, { status: 400 }))
            return;
          }
          
          // Use estimated tokens if available, otherwise count words
          const inputTokens = gitIngestOutput.estimated_tokens || countWords(gitIngestOutput.content)
          console.log("📝 Input tokens:", inputTokens)
          
          // Check if input tokens exceed the limit
          if (inputTokens > (gitIngestOutput.limits?.max_input_tokens || 900_000)) {
            console.log("⚠️ Token limit exceeded")
            resolve(NextResponse.json({ 
              error: `Repository content exceeds maximum token limit of ${gitIngestOutput.limits?.max_input_tokens?.toLocaleString() || '900,000'} tokens (estimated ${inputTokens.toLocaleString()} tokens)`,
              limits: gitIngestOutput.limits
            }, { status: 400 }))
            return;
          }
          
          // Create prompt for the model
          const prompt = `Make a README for the following GitHub repository. Do not generate any placeholder text or placeholder images in the readme file. For all READMEs, add a DeepWiki badge to your README that links to your repo's DeepWiki. Do not add any badges except for the DeepWiki badge.

To generate the DeepWiki badge: 
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/${repoPath})

Directly output the README file without any additional text.\n\n\n
Summary:\n${gitIngestOutput.summary}\n\n\n
Tree:\n${gitIngestOutput.tree}\n\n\n
Content:\n${gitIngestOutput.content}`

          // Generate README using Gemini
          console.log("🤖 Generating README with Gemini...")
          let response
          try {
            response = await client.chat.completions.create({
              model: "google/gemini-2.5-pro-preview-03-25",
              messages: [
                { role: "system", content: "You are an expert technical writer." },
                { role: "user", content: prompt }
              ]
            })
          } catch (error: any) {
            console.error("❌ OpenRouter API error:", error)
            
            // Check for rate limit errors from OpenRouter
            if (error.message?.includes("rate") || error.message?.includes("quota") || error.status === 429) {
              throw new Error(`API rate limit exceeded. Please try again later.`)
            }
            
            throw error
          }
          
          // Clean up the markdown code block markers
          let readme = ''
          if (
            response &&
            Array.isArray(response.choices) &&
            response.choices.length > 0 &&
            response.choices[0].message &&
            typeof response.choices[0].message.content === 'string'
          ) {
            readme = response.choices[0].message.content
            readme = readme.replace(/^```markdown\n?/, '')
            readme = readme.replace(/```$/, '')
            readme = readme.trim()
          } else {
            console.error('Gemini/OpenRouter response missing choices or content:', response)
            throw new Error('Failed to generate README: No content returned from Gemini/OpenRouter.')
          }

          // Count output words
          const outputTokens = countWords(readme)
          console.log("📝 Output tokens:", outputTokens)

          // Only update credits for authenticated users
          if (userId) {
            try {
              // Get current credits
              const { data, error } = await supabaseAdmin
                .from('user_credits')
                .select('credits')
                .eq('user_id', userId)
                .single()
              
              if (error) {
                console.error("Error fetching user credits:", error)
                throw error
              }
              
              // Update credits using service role
              const newCredits = (data?.credits || 1) - 1
              
              const { error: updateError } = await supabaseAdmin
                .from('user_credits')
                .upsert({
                  user_id: userId,
                  credits: newCredits,
                  updated_at: new Date().toISOString()
                })
              
              if (updateError) {
                console.error("Error updating user credits:", updateError)
                throw updateError
              }
              
              // NOTE: README saving has been moved to the client-side in page.tsx
              // to prevent duplicate entries in history
              
              console.log("✅ User credits updated successfully")
            } catch (error) {
              console.error("❌ Error updating user credits:", error)
              // Continue despite error, as README has been generated
            }
          }

          resolve(NextResponse.json({ 
            readme,
            inputTokens,
            outputTokens,
            warnings: gitIngestOutput.warnings,
            limits: gitIngestOutput.limits
          }))
        } catch (error: any) {
          console.error("❌ Error:", error)
          console.error("Error stack:", error.stack)
          
          // Extract a concise error message
          let errorMessage = error.message || "An unknown error occurred";
          
          // Avoid returning sensitive or verbose error information to the client
          if (errorMessage.length > 150) {
            // Check for known error patterns in the verbose message
            if (errorMessage.includes("Repository not found")) {
              errorMessage = "Repository not found or is private. Please check the URL.";
            } else if (errorMessage.includes("rate limit")) {
              errorMessage = "API rate limit exceeded. Please try again later.";
            } else if (errorMessage.includes("timeout")) {
              errorMessage = "Request timed out. Please try a smaller repository.";
            } else {
              // If no specific pattern, use a generic message
              errorMessage = "Error processing repository. Please check the URL and try again.";
            }
          }
          
          resolve(NextResponse.json({ error: errorMessage }, { status: 500 }))
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
      } catch (error) {
        // Handle errors and resolve
        resolve(NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 }))
      } finally {
        // After processing, process the next item in the queue
        processQueue();
      }
    });
    // Start processing if not already
    processQueue();
  });
} 