import { NextResponse, NextRequest } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

// Create a Supabase client with the service role key for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET endpoint to fetch user's generated READMEs
export async function GET(req: NextRequest) {
  const { userId } = getAuth(req);
  
  if (!userId) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('generated_readmes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching README history:', error);
      return NextResponse.json(
        { error: 'Error fetching README history' },
        { status: 500 }
      );
    }

    return NextResponse.json({ history: data });
  } catch (error) {
    console.error('Unexpected error fetching README history:', error);
    return NextResponse.json(
      { error: 'Unexpected error fetching README history' },
      { status: 500 }
    );
  }
}

// POST endpoint to save a generated README
export async function POST(req: NextRequest) {
  const { userId } = getAuth(req);
  
  if (!userId) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const { repoUrl, readmeContent } = await req.json();

    if (!repoUrl || !readmeContent) {
      return NextResponse.json(
        { error: 'Repository URL and README content are required' },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from('generated_readmes')
      .insert({
        user_id: userId,
        repo_url: repoUrl,
        readme_content: readmeContent
      });

    if (error) {
      console.error('Error saving README:', error);
      return NextResponse.json(
        { error: 'Error saving README' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unexpected error saving README:', error);
    return NextResponse.json(
      { error: 'Unexpected error saving README' },
      { status: 500 }
    );
  }
} 