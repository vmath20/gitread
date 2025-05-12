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

  if (!signature) {
    console.error('No Stripe signature found in webhook request');
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('STRIPE_WEBHOOK_SECRET is not configured');
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  try {
    console.log('Received webhook event, constructing event...');
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    console.log(`Webhook event type: ${event.type}`);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      console.log(`Processing checkout.session.completed for session: ${session.id}`);
      console.log('Session metadata:', session.metadata);

      const userId = session.metadata?.userId;
      const credits = parseInt(session.metadata?.credits || '0');

      if (!userId || !credits) {
        console.error('Missing userId or credits in session metadata:', session.metadata);
        return NextResponse.json({ error: 'Invalid session metadata' }, { status: 400 });
      }

      // Check if this event has already been processed
      const { data: existingEvent } = await supabaseAdmin
        .from('processed_stripe_events')
        .select('id')
        .eq('event_id', `session_${session.id}`)
        .single();

      if (existingEvent) {
        console.log(`Event ${session.id} already processed`);
        return NextResponse.json({ received: true });
      }

      // Add credits to user
      const { error: creditError } = await supabaseAdmin
        .from('user_credits')
        .upsert({
          user_id: userId,
          credits: credits,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
          count: 'exact'
        });

      if (creditError) {
        console.error('Error adding credits:', creditError);
        throw creditError;
      }

      // Mark event as processed
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
    // Log the full error details
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