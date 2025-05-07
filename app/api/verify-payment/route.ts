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
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === 'paid') {
      // Check if the webhook has already processed this session
      const credits = parseInt(session.metadata?.credits || '0');
      
      // Check if this session has been recorded in processed events
      const { data: processedSession, error: processedError } = await supabaseAdmin
        .from('processed_stripe_events')
        .select('*')
        .eq('event_id', `session_${sessionId}`)
        .single();
      
      if (processedError && processedError.code !== 'PGRST116') {
        console.error('Error checking processed session:', processedError);
        throw processedError;
      }
      
      // If webhook hasn't processed it yet, do it now as a fallback
      if (!processedSession && credits > 0) {
        console.log(`Session ${sessionId} not yet processed by webhook, adding credits now`);
        
        // Get current credits
        const { data: currentCredits, error: creditsError } = await supabaseAdmin
          .from('user_credits')
          .select('credits')
          .eq('user_id', userId)
          .single();
          
        if (creditsError && creditsError.code !== 'PGRST116') {
          console.error('Error fetching current credits:', creditsError);
          throw creditsError;
        }
        
        // Add credits
        const { error: updateError } = await supabaseAdmin
          .from('user_credits')
          .upsert({
            user_id: userId,
            credits: (currentCredits?.credits || 0) + credits,
            updated_at: new Date().toISOString()
          });
          
        if (updateError) {
          console.error('Error adding credits:', updateError);
          throw updateError;
        }
        
        // Mark as processed so webhook doesn't double-add
        const { error: insertError } = await supabaseAdmin
          .from('processed_stripe_events')
          .insert({
            event_id: `session_${sessionId}`,
            user_id: userId,
            credits: credits,
            processed_at: new Date().toISOString()
          });
          
        if (insertError) {
          console.error('Error marking event as processed:', insertError);
          throw insertError;
        }
      } else if (processedSession) {
        console.log(`Session ${sessionId} already processed, skipping credit addition`);
      }
      
      return NextResponse.json({ success: true });
    } else {
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