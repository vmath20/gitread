import { NextResponse, NextRequest } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // No payment provider, so just return an error or dummy success
    return NextResponse.json({ error: 'Payment provider not configured.' }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error verifying payment' },
      { status: 500 }
    );
  }
} 