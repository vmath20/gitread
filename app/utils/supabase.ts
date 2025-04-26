import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Create a Supabase client with the anon key for client-side operations
export const supabase = createClient(supabaseUrl, supabaseKey)

export async function getUserCredits(userId: string): Promise<number> {
  try {
    console.log('Fetching credits for user:', userId)
    
    const { data, error } = await supabase
      .from('user_credits')
      .select('credits')
      .eq('user_id', userId)
      .single()

    if (error) {
      console.error('Error fetching credits:', error)
      // If no record exists, create one with default credits
      if (error.code === 'PGRST116') {
        const { error: insertError } = await supabase
          .from('user_credits')
          .insert({ user_id: userId, credits: 5 })
        
        if (insertError) {
          console.error('Error creating user credits:', insertError)
          return 5
        }
        return 5
      }
      return 5
    }

    console.log('Retrieved credits:', data?.credits)
    return data?.credits ?? 5
  } catch (error) {
    console.error('Unexpected error fetching credits:', error)
    return 5
  }
}

export async function setUserCredits(userId: string, credits: number) {
  try {
    console.log('Starting credit update for user:', userId, 'new credits:', credits)
    
    // First check if the user exists
    const { data: existingUser, error: checkError } = await supabase
      .from('user_credits')
      .select('credits')
      .eq('user_id', userId)
      .single()

    if (checkError) {
      console.log('User not found, creating new record')
      const { error: insertError } = await supabase
        .from('user_credits')
        .insert({
          user_id: userId,
          credits: credits,
          updated_at: new Date().toISOString()
        })

      if (insertError) {
        console.error('Error inserting credits:', insertError)
        throw insertError
      }
    } else {
      console.log('User found, setting credits to', credits)
      const { error: updateError } = await supabase
        .from('user_credits')
        .update({
          credits: credits,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .single()

      if (updateError) {
        console.error('Error updating credits:', updateError)
        throw updateError
      }
    }
    
    console.log('Credits set successfully')
    return true
  } catch (error) {
    console.error('Unexpected error setting credits:', error)
    throw error
  }
}

export async function saveGeneratedReadme(userId: string, repoUrl: string, readmeContent: string) {
  try {
    const { error } = await supabase
      .from('generated_readmes')
      .insert({
        user_id: userId,
        repo_url: repoUrl,
        readme_content: readmeContent
      })

    if (error) {
      console.error('Error saving README:', error)
      throw error
    }
  } catch (error) {
    console.error('Unexpected error saving README:', error)
    throw error
  }
}

export async function getGeneratedReadmes(userId: string) {
  try {
    const { data, error } = await supabase
      .from('generated_readmes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching READMEs:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('Unexpected error fetching READMEs:', error)
    throw error
  }
}

// Check if a Stripe event has been processed
export async function hasProcessedStripeEvent(eventId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('processed_stripe_events')
      .select('id')
      .eq('event_id', eventId)
      .single()

    if (error) {
      console.error('Error checking processed event:', error)
      return false
    }

    return !!data
  } catch (error) {
    console.error('Unexpected error checking processed event:', error)
    return false
  }
}

// Mark a Stripe event as processed
export async function markStripeEventAsProcessed(eventId: string, userId: string, credits: number): Promise<void> {
  try {
    const { error } = await supabase
      .from('processed_stripe_events')
      .insert({
        event_id: eventId,
        user_id: userId,
        credits: credits,
        processed_at: new Date().toISOString()
      })

    if (error) {
      console.error('Error marking event as processed:', error)
      throw error
    }
  } catch (error) {
    console.error('Unexpected error marking event as processed:', error)
    throw error
  }
}

// Add credits to user's account (idempotent)
export async function addUserCredits(userId: string, credits: number): Promise<void> {
  try {
    // First check if the user exists
    const { data: existingUser, error: checkError } = await supabase
      .from('user_credits')
      .select('credits')
      .eq('user_id', userId)
      .single()

    if (checkError) {
      console.log('User not found, creating new record')
      const { error: insertError } = await supabase
        .from('user_credits')
        .insert({
          user_id: userId,
          credits: credits,
          updated_at: new Date().toISOString()
        })

      if (insertError) {
        console.error('Error inserting credits:', insertError)
        throw insertError
      }
    } else {
      console.log('User found, adding credits')
      const { error: updateError } = await supabase
        .from('user_credits')
        .update({
          credits: existingUser.credits + credits,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .single()

      if (updateError) {
        console.error('Error updating credits:', updateError)
        throw updateError
      }
    }
    
    console.log('Credits added successfully')
  } catch (error) {
    console.error('Unexpected error adding credits:', error)
    throw error
  }
} 