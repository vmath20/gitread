import { NextResponse, NextRequest } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';

export async function POST(req: NextRequest) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // No payment provider, so just return an error or dummy response
    return NextResponse.json({ error: 'Payment provider not configured.' }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error creating checkout session' },
      { status: 500 }
    );
  }
} 