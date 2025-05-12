import { NextResponse, NextRequest } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-01-27.acacia',
});

// Create a Supabase client with the service role key for admin operations
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

    const { sessionId } = await req.json();
    if (!sessionId) {
      return NextResponse.json({ error: 'Missing session ID' }, { status: 400 });
    }

    // First check if this session has already been processed
    const { data: processedSession, error: processedError } = await supabaseAdmin
      .from('processed_stripe_events')
      .select('*')
      .eq('event_id', `session_${sessionId}`)
      .single();

    if (processedError && processedError.code !== 'PGRST116') {
      console.error('Error checking processed session:', processedError);
      throw processedError;
    }

    if (processedSession) {
      console.log(`Session ${sessionId} already processed, returning success`);
      return NextResponse.json({ success: true });
    }

    // If not processed, verify with Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    // Verify the session belongs to this user
    if (session.metadata?.userId !== userId) {
      console.error(`Session ${sessionId} belongs to different user`);
      return NextResponse.json({ error: 'Invalid session' }, { status: 400 });
    }

    if (session.payment_status === 'paid') {
      const credits = parseInt(session.metadata?.credits || '0');
      
      if (credits <= 0) {
        console.error(`Invalid credits amount for session ${sessionId}: ${credits}`);
        return NextResponse.json({ error: 'Invalid credits amount' }, { status: 400 });
      }

      console.log(`Processing session ${sessionId} for user ${userId}, adding ${credits} credits`);
      
      // Use a transaction to ensure atomicity
      const { error: transactionError } = await supabaseAdmin.rpc('add_user_credits', {
        p_user_id: userId,
        p_credits: credits,
        p_event_id: `session_${sessionId}`
      });
      
      if (transactionError) {
        console.error('Error in credit addition transaction:', transactionError);
        throw transactionError;
      }

      console.log(`Successfully processed session ${sessionId}`);
      return NextResponse.json({ success: true });
    } else {
      console.log(`Session ${sessionId} payment status: ${session.payment_status}`);
      return NextResponse.json({ error: 'Payment not completed' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error verifying payment:', error);
    return NextResponse.json(
      { error: 'Error verifying payment' },
      { status: 500 }
    );
  }
} 