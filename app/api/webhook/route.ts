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

      if (userId && credits) {
        // Use consistent event_id format with verify-payment
        const eventId = `session_${session.id}`;
        
        // Check if this event has already been processed
        const { data: existingEvent } = await supabaseAdmin
          .from('processed_stripe_events')
          .select('id')
          .eq('event_id', eventId)
          .single();
        
        if (existingEvent) {
          console.log(`Event ${eventId} already processed, skipping`);
          return NextResponse.json({ received: true });
        }

        // Get current credits
        const { data: currentCredits, error: creditsError } = await supabaseAdmin
          .from('user_credits')
          .select('credits')
          .eq('user_id', userId)
          .single();
          
        if (creditsError && creditsError.code !== 'PGRST116') { // Not found error is ok
          console.error('Error fetching current credits:', creditsError);
        }

        // Add credits using service role
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
        
        // Mark the event as processed
        const { error: insertError } = await supabaseAdmin
          .from('processed_stripe_events')
          .insert({
            event_id: eventId,
            user_id: userId,
            credits: credits,
            processed_at: new Date().toISOString()
          });

        if (insertError) {
          console.error('Error marking event as processed:', insertError);
          throw insertError;
        }
        
        console.log(`Successfully processed event ${eventId} for user ${userId}, added ${credits} credits`);
      }
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