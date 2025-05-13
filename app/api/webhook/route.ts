import { NextResponse, NextRequest } from 'next/server';
import { headers } from 'next/headers';
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
  const body = await req.text();
  const signature = headers().get('stripe-signature');

  console.log('Webhook received, checking signature...');
  
  if (!signature) {
    console.error('No Stripe signature found in webhook request');
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('STRIPE_WEBHOOK_SECRET is not configured');
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  try {
    console.log('Constructing Stripe event...');
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    console.log('Event constructed successfully:', event.type);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      console.log('Processing checkout.session.completed:', {
        sessionId: session.id,
        metadata: session.metadata,
        paymentStatus: session.payment_status
      });

      const userId = session.metadata?.userId;
      const credits = parseInt(session.metadata?.credits || '0');

      if (!userId || !credits) {
        console.error('Missing userId or credits in session metadata:', session.metadata);
        return NextResponse.json({ error: 'Invalid session metadata' }, { status: 400 });
      }

      // Check if this event has already been processed
      console.log('Checking if event already processed...');
      const { data: existingEvent, error: existingError } = await supabaseAdmin
        .from('processed_stripe_events')
        .select('id')
        .eq('event_id', `session_${session.id}`)
        .single();

      if (existingError && existingError.code !== 'PGRST116') {
        console.error('Error checking existing event:', existingError);
        throw existingError;
      }

      if (existingEvent) {
        console.log(`Event ${session.id} already processed`);
        return NextResponse.json({ received: true });
      }

      // Get current credits
      console.log('Getting current credits for user:', userId);
      const { data: currentCredits, error: creditsError } = await supabaseAdmin
        .from('user_credits')
        .select('credits')
        .eq('user_id', userId)
        .single();

      if (creditsError && creditsError.code !== 'PGRST116') {
        console.error('Error getting current credits:', creditsError);
        throw creditsError;
      }

      const newCredits = (currentCredits?.credits || 0) + credits;
      console.log('Adding credits:', { current: currentCredits?.credits || 0, adding: credits, new: newCredits });

      // Add credits to user
      const { error: creditError } = await supabaseAdmin
        .from('user_credits')
        .upsert({
          user_id: userId,
          credits: newCredits,
          updated_at: new Date().toISOString(),
        });

      if (creditError) {
        console.error('Error adding credits:', creditError);
        throw creditError;
      }

      // Mark event as processed
      console.log('Marking event as processed...');
      const { error: eventError } = await supabaseAdmin
        .from('processed_stripe_events')
        .insert({
          event_id: `session_${session.id}`,
          user_id: userId,
          credits: credits,
          processed_at: new Date().toISOString(),
        });

      if (eventError) {
        console.error('Error marking event as processed:', eventError);
        throw eventError;
      }

      console.log(`Successfully processed payment for user ${userId}, added ${credits} credits`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    }
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 400 }
    );
  }
} 