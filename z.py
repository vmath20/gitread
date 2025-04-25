from openai import OpenAI
import re
try:
    from gitingest import ingest
except ImportError:
    print("Error: gitingest module not found. Please make sure it's installed or in the correct path.")
    exit(1)

# === Client setup for OpenRouter ===
try:
    client = OpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key="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"
    )
except Exception as e:
    print(f"Error setting up OpenAI client: {e}")
    exit(1)

# === Step 1: Get GitHub Repo URL ===
repo_url = input("Enter GitHub repository URL: ").strip()
print("🟡 Ingesting repository...")
try:
    summary, tree, content = ingest(repo_url)
except Exception as e:
    print(f"Error ingesting repository: {e}")
    exit(1)

# === Extract estimated token count from summary ===
estimated_tokens = None
match = re.search(r"Estimated tokens:\s*([\d.]+)k", summary, re.IGNORECASE)
if match:
    estimated_tokens = int(float(match.group(1)) * 1000)
else:
    print("⚠️ Warning: Could not extract estimated input token count from summary.")



# === Step 2: Create prompt ===
prompt = (
    "Make a README for the following GitHub repository. "
    "Directly output the README file without any additional text.\n\n"
    f"GitHub repository is here:\n"
    f"Summary: {summary}\n\n"
    f"Tree:\n{tree}\n\n"
    f"Content:\n{content}"
)

# === Step 3: Query Gemini 2.5 ===
print("🟡 Generating README with Gemini...")
response = client.chat.completions.create(
    model="google/gemini-2.5-pro-preview-03-25",
    messages=[
        {"role": "system", "content": "You are an expert technical writer."},
        {"role": "user", "content": prompt}
    ]
)

# === Step 4: Output the README and token info ===
readme = response.choices[0].message.content
output_tokens = len(readme.split())

print("\n🟢 Generated README:\n")
print(readme)

print("\n📊 Token Usage Summary:")
if estimated_tokens is not None:
    print(f"- Estimated input tokens: {estimated_tokens}")
else:
    print("- Estimated input tokens: Unknown")

print(f"- Output tokens (approximate): {output_tokens}")