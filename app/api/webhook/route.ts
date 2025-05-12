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
  const signature = headers().get('stripe-signature')!;

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      const credits = parseInt(session.metadata?.credits || '0');

      if (!userId) {
        console.error('Missing userId in session metadata');
        return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
      }

      if (!credits || credits <= 0) {
        console.error(`Invalid credits amount: ${credits}`);
        return NextResponse.json({ error: 'Invalid credits amount' }, { status: 400 });
      }

      // Use consistent event_id format with verify-payment
      const eventId = `session_${session.id}`;
      
      // Check if this event has already been processed
      const { data: existingEvent, error: existingError } = await supabaseAdmin
        .from('processed_stripe_events')
        .select('id')
        .eq('event_id', eventId)
        .single();
      
      if (existingError && existingError.code !== 'PGRST116') {
        console.error('Error checking existing event:', existingError);
        throw existingError;
      }
      
      if (existingEvent) {
        console.log(`Event ${eventId} already processed, skipping`);
        return NextResponse.json({ received: true });
      }

      // Verify payment status
      if (session.payment_status !== 'paid') {
        console.log(`Session ${session.id} payment status: ${session.payment_status}, skipping`);
        return NextResponse.json({ received: true });
      }

      console.log(`Processing webhook for session ${session.id}, user ${userId}, credits ${credits}`);

      // Use the atomic transaction function
      const { error: transactionError } = await supabaseAdmin.rpc('add_user_credits', {
        p_user_id: userId,
        p_credits: credits,
        p_event_id: eventId
      });

      if (transactionError) {
        console.error('Error in credit addition transaction:', transactionError);
        throw transactionError;
      }
      
      console.log(`Successfully processed event ${eventId} for user ${userId}, added ${credits} credits`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error handling webhook:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 400 }
    );
  }
} 