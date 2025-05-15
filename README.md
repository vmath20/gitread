# GitRead
[![Ask DeepWiki](https://devin.ai/assets/askdeepwiki.png)](https://deepwiki.com/vmath20/gitread)

GitRead is an AI-powered application designed to automatically generate professional README files for your GitHub repositories. Simply provide a link to a public GitHub repository, and GitRead will analyze its content, structure, and purpose to create a comprehensive and well-formatted README.md file. This tool aims to save developers time and effort in documenting their projects, ensuring that every repository can have a high-quality README with minimal manual intervention.

## Features

*   **AI-Powered README Generation:** Leverages advanced AI models (currently Google's Gemini via OpenRouter) to understand code and generate descriptive READMEs.
*   **GitHub Repository Analysis:** Ingests and analyzes the structure, files, and a summary of content from public GitHub repositories.
*   **User Authentication:** Secure sign-in and sign-up functionality powered by Clerk.
*   **Credit System:** Users have credits to generate READMEs. New users receive an initial credit, and more can be purchased.
*   **Stripe Integration:** Secure payment processing via Stripe for purchasing additional credits.
*   **README History:** Authenticated users can view and access their previously generated READMEs.
*   **Interactive Editor & Preview:** View the generated README in markdown or as a rendered preview. Edit the markdown directly in the browser.
*   **Copy & Download:** Easily copy the generated markdown to your clipboard or download it as a `.md` file.
*   **Theme Toggle:** Switch between light and dark modes for a comfortable user experience.
*   **Example Repositories:** Quickly test the functionality with pre-selected example repositories.
*   **Custom Domain Handling:** Supports various domains (e.g., `gitread.com`, `generatemyreadme.com`) redirecting to the primary service at `gitread.dev`.
*   **URL-based Repo Input:** Supports direct repository input via URL paths (e.g., `gitread.dev/username/repository`).

## How It Works

1.  **Input Repository URL:** The user provides a public GitHub repository URL on the GitRead website.
2.  **Frontend Request:** The Next.js frontend sends the URL to the backend API.
3.  **Backend Processing (`/api/generate`):**
    *   The API validates the GitHub URL.
    *   It checks if the authenticated user has sufficient credits.
    *   The backend calls an external Python-based ingestion service (`https://gitread-api.onrender.com/ingest`). This service uses the `gitingest` library to clone the repository, analyze its structure, summarize file contents, and estimate token counts.
    *   The ingestion service returns a summary, directory tree, and concatenated content of the repository.
4.  **AI Generation:**
    *   The Next.js backend then sends this processed information (summary, tree, content) along with a specific prompt to an AI model (Google's Gemini via OpenRouter).
    *   The AI model generates the README markdown content.
5.  **Response & Display:**
    *   The generated README is sent back to the frontend.
    *   The user can then view the README in preview or markdown mode, edit it, copy it, or download it.
    *   If the user is authenticated, the generated README is saved to their history, and their credit count is updated.

## Technology Stack

*   **Frontend:** Next.js, React, TypeScript, Tailwind CSS
*   **Backend:** Next.js API Routes (Node.js)
*   **AI Model:** Google Gemini (via OpenRouter API)
*   **Repository Ingestion:** Custom Python API service (hosted on Render, using the `gitingest` library)
*   **Authentication:** Clerk
*   **Database:** Supabase (PostgreSQL) for storing user credits and README history.
*   **Payments:** Stripe
*   **Styling:** Tailwind CSS with `@tailwindcss/typography` for markdown rendering.

## Project Structure

```
vmath20-gitread/
├── app/                     # Next.js App Router
│   ├── api/                 # Backend API routes
│   │   ├── create-checkout-session/ # Stripe checkout
│   │   ├── credits/           # User credit management
│   │   ├── generate/          # README generation logic
│   │   ├── readme-history/    # User README history
│   │   └── verify-payment/    # Stripe payment verification
│   ├── components/          # React components (UI elements)
│   ├── utils/               # Utility functions, Supabase client, example READMEs
│   ├── (pages)/             # UI Pages (Home, Terms, Privacy, etc.)
│   └── layout.tsx           # Root layout
│   └── page.tsx             # Main application page component
├── middleware.ts            # Next.js middleware (routing, auth)
├── public/                  # Static assets (images, favicons)
├── scripts/                 # Python scripts
│   └── git_ingest.py        # (Reference for the external ingestion service logic)
├── supabase/                # Supabase migrations
│   └── migrations/          # SQL migration files for DB schema & RLS
├── package.json             # Node.js project metadata and dependencies
├── requirements.txt         # Python dependencies (for the ingestion service)
├── tailwind.config.js       # Tailwind CSS configuration
└── tsconfig.json            # TypeScript configuration
```

## Key API Endpoints

*   `POST /api/generate`: Accepts a repository URL, initiates the ingestion and AI generation process, and returns the README.
*   `GET /api/credits`: Fetches the current user's credit balance.
*   `POST /api/credits`: Updates the current user's credit balance (primarily used internally or by admin).
*   `POST /api/create-checkout-session`: Creates a Stripe checkout session for purchasing credits.
*   `POST /api/verify-payment`: Verifies a Stripe payment and updates the user's credits.
*   `GET /api/readme-history`: Retrieves the list of READMEs generated by the current user.
*   `POST /api/readme-history`: Saves a newly generated README to the user's history.

## Setup for Local Development

### Prerequisites

*   Node.js (version specified in project or latest LTS)
*   npm or yarn
*   Python (version 3.10.0 as per `.python-version`)
*   Access to a Supabase project
*   Clerk account
*   Stripe account
*   OpenRouter API Key

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/vmath20/gitread.git
    cd gitread
    ```

2.  **Install Node.js dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Install Python dependencies** (mainly for reference if you intend to set up or understand the ingestion service logic, as the main app calls a hosted version):
    ```bash
    pip install -r requirements.txt
    ```

4.  **Set up Environment Variables:**
    Create a `.env.local` file in the root of the project and add the following environment variables:

    ```env
    # Clerk
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
    CLERK_SECRET_KEY=your_clerk_secret_key
    NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
    NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
    NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
    NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/

    # Supabase
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key # For admin operations in backend

    # Stripe
    STRIPE_SECRET_KEY=your_stripe_secret_key
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key # If used client-side

    # OpenRouter / AI Model
    OPENROUTER_API_KEY=your_openrouter_api_key

    # Application URL
    NEXT_PUBLIC_APP_URL=http://localhost:3000 # Or your deployment URL

    # Python API Key (for the external Git Ingestion service)
    PYTHON_API_KEY=your_secret_key_for_python_api
    ```

5.  **Set up Supabase Database:**
    *   Go to your Supabase project.
    *   Use the SQL Editor to run the migrations located in the `supabase/migrations/` directory. This will create the necessary tables (`user_credits`, `generated_readmes`, `processed_stripe_events`) and set up Row Level Security (RLS) policies.

6.  **Run the development server:**
    ```bash
    npm run dev
    ```
    The application should now be running on `http://localhost:3000`.

## Note on Git Ingestion Service

The Git repository ingestion logic, while prototyped in `scripts/git_ingest.py`, is primarily accessed via an external API endpoint (`https://gitread-api.onrender.com/ingest`) in the current implementation. This service is responsible for cloning the repository and extracting its content for the AI.

## Support

For any issues or questions, please refer to the [Support Page](/support) on the GitRead website or contact [koyalhq@gmail.com](mailto:koyalhq@gmail.com).

---

Made with ❤️ by [@koyalhq](https://twitter.com/koyalhq)
