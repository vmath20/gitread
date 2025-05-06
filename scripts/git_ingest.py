from openai import OpenAI
import re
try:
    from gitingest import ingest
    from gitingest.config import MAX_FILE_SIZE, MAX_TOTAL_SIZE_BYTES, MAX_FILES, MAX_DIRECTORY_DEPTH
except ImportError:
    print("Error: gitingest module not found. Please make sure it's installed or in the correct path.")
    exit(1)
import json
import sys
import tempfile
import os
import traceback

# Maximum allowed input tokens
MAX_INPUT_TOKENS = 250_000

def format_size(size_bytes):
    """Convert bytes to human readable format"""
    for unit in ['B', 'KB', 'MB', 'GB']:
        if size_bytes < 1024.0:
            return f"{size_bytes:.1f} {unit}"
        size_bytes /= 1024.0
    return f"{size_bytes:.1f} GB"

def process_repo(repo_url):
    print(f"Processing repository: {repo_url}", file=sys.stderr)
    
    # Create a temporary file for output
    with tempfile.NamedTemporaryFile(mode='w+', delete=False) as temp_file:
        print(f"Created temporary file: {temp_file.name}", file=sys.stderr)
        try:
            # Ingest the repository
            print("Starting repository ingestion...", file=sys.stderr)
            summary, tree, content = ingest(repo_url)
            print("Repository ingestion completed", file=sys.stderr)
            
            # Extract estimated token count from summary
            estimated_tokens = None
            match = re.search(r"Estimated tokens:\s*([\d.]+)k", summary, re.IGNORECASE)
            if match:
                estimated_tokens = int(float(match.group(1)) * 1000)
                print(f"Estimated tokens: {estimated_tokens}", file=sys.stderr)
                
                # Check if estimated tokens exceed the limit
                if estimated_tokens > MAX_INPUT_TOKENS:
                    error_msg = f"Repository content exceeds maximum token limit of {MAX_INPUT_TOKENS:,} tokens (estimated {estimated_tokens:,} tokens)"
                    print(f"Error: {error_msg}", file=sys.stderr)
                    print(json.dumps({
                        "error": error_msg,
                        "limits": {
                            "max_file_size": format_size(MAX_FILE_SIZE),
                            "max_total_size": format_size(MAX_TOTAL_SIZE_BYTES),
                            "max_files": MAX_FILES,
                            "max_directory_depth": MAX_DIRECTORY_DEPTH,
                            "max_input_tokens": MAX_INPUT_TOKENS
                        }
                    }))
                    return 1
            
            # Check for size limit warnings in the summary
            size_warnings = []
            if "Maximum file limit" in summary:
                warning = f"Repository exceeds maximum file limit of {MAX_FILES:,} files"
                print(f"Warning: {warning}", file=sys.stderr)
                size_warnings.append(warning)
            if "Maximum total size limit" in summary:
                warning = f"Repository exceeds maximum total size limit of {format_size(MAX_TOTAL_SIZE_BYTES)}"
                print(f"Warning: {warning}", file=sys.stderr)
                size_warnings.append(warning)
            if "Maximum depth limit" in summary:
                warning = f"Repository exceeds maximum directory depth of {MAX_DIRECTORY_DEPTH} levels"
                print(f"Warning: {warning}", file=sys.stderr)
                size_warnings.append(warning)
            
            # Write output to temporary file
            output = {
                "content": content,
                "summary": summary,
                "tree": tree,
                "estimated_tokens": estimated_tokens,
                "warnings": size_warnings,
                "limits": {
                    "max_file_size": format_size(MAX_FILE_SIZE),
                    "max_total_size": format_size(MAX_TOTAL_SIZE_BYTES),
                    "max_files": MAX_FILES,
                    "max_directory_depth": MAX_DIRECTORY_DEPTH,
                    "max_input_tokens": MAX_INPUT_TOKENS
                }
            }
            print("Writing output to temporary file...", file=sys.stderr)
            temp_file.write(json.dumps(output))
            temp_file.flush()
            print("Output written successfully", file=sys.stderr)
            
            # Print the output
            print(json.dumps(output))
            return 0
        except Exception as e:
            error_message = str(e)
            print(f"Error occurred: {error_message}", file=sys.stderr)
            print("Traceback:", file=sys.stderr)
            traceback.print_exc(file=sys.stderr)
            
            # Improved error detection for specific error types
            if "not found" in error_message.lower() or "404" in error_message:
                error_message = "Repository not found or is private. Please check the URL and ensure you have access permission."
            elif "rate limit" in error_message.lower() or "rate_limit" in error_message.lower():
                error_message = "GitHub API rate limit exceeded. Please try again later."
            elif "timeout" in error_message.lower() or "timed out" in error_message.lower():
                error_message = "Request timed out while processing the repository. Please try a smaller repository."
            elif "authentication" in error_message.lower() or "auth" in error_message.lower() or "permission" in error_message.lower():
                error_message = "Authentication failed or insufficient permissions. The repository may be private."
            elif "Maximum file size limit" in error_message:
                error_message = f"Repository contains files larger than the maximum allowed size of {format_size(MAX_FILE_SIZE)}"
            elif "Maximum number of files" in error_message:
                error_message = f"Repository exceeds the maximum allowed number of files ({MAX_FILES:,})"
            elif "Maximum total size limit" in error_message:
                error_message = f"Repository exceeds the maximum allowed total size of {format_size(MAX_TOTAL_SIZE_BYTES)}"
            elif "Maximum depth limit" in error_message:
                error_message = f"Repository exceeds the maximum allowed directory depth of {MAX_DIRECTORY_DEPTH} levels"
            
            print(json.dumps({
                "error": error_message,
                "limits": {
                    "max_file_size": format_size(MAX_FILE_SIZE),
                    "max_total_size": format_size(MAX_TOTAL_SIZE_BYTES),
                    "max_files": MAX_FILES,
                    "max_directory_depth": MAX_DIRECTORY_DEPTH,
                    "max_input_tokens": MAX_INPUT_TOKENS
                }
            }))
            return 1
        finally:
            # Clean up the temporary file
            try:
                print(f"Cleaning up temporary file: {temp_file.name}", file=sys.stderr)
                os.unlink(temp_file.name)
                print("Temporary file cleaned up successfully", file=sys.stderr)
            except Exception as e:
                print(f"Error cleaning up temporary file: {e}", file=sys.stderr)

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print(json.dumps({"error": "Please provide a repository URL"}))
        sys.exit(1)
    
    repo_url = sys.argv[1]
    sys.exit(process_repo(repo_url)) 