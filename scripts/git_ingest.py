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
    # Create a temporary file for output
    with tempfile.NamedTemporaryFile(mode='w+', delete=False) as temp_file:
        try:
            # Ingest the repository
            summary, tree, content = ingest(repo_url)
            
            # Extract estimated token count from summary
            estimated_tokens = None
            match = re.search(r"Estimated tokens:\s*([\d.]+)k", summary, re.IGNORECASE)
            if match:
                estimated_tokens = int(float(match.group(1)) * 1000)
                
                # Check if estimated tokens exceed the limit
                if estimated_tokens > MAX_INPUT_TOKENS:
                    print(json.dumps({
                        "error": f"Repository content exceeds maximum token limit of {MAX_INPUT_TOKENS:,} tokens (estimated {estimated_tokens:,} tokens)",
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
                size_warnings.append(f"Repository exceeds maximum file limit of {MAX_FILES:,} files")
            if "Maximum total size limit" in summary:
                size_warnings.append(f"Repository exceeds maximum total size limit of {format_size(MAX_TOTAL_SIZE_BYTES)}")
            if "Maximum depth limit" in summary:
                size_warnings.append(f"Repository exceeds maximum directory depth of {MAX_DIRECTORY_DEPTH} levels")
            
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
            temp_file.write(json.dumps(output))
            temp_file.flush()
            
            # Print the output
            print(json.dumps(output))
            return 0
        except Exception as e:
            error_message = str(e)
            if "Maximum file size limit" in error_message:
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
                os.unlink(temp_file.name)
            except:
                pass

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print(json.dumps({"error": "Please provide a repository URL"}))
        sys.exit(1)
    
    repo_url = sys.argv[1]
    sys.exit(process_repo(repo_url)) 