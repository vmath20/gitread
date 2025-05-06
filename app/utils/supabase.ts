import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Create a Supabase client with the anon key for client-side operations
export const supabase = createClient(supabaseUrl, supabaseKey)

// Helper function to add delay
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export async function getUserCredits(userId: string, retries = 3): Promise<number> {
  try {
    console.log('Fetching credits for user:', userId)
    
    const { data, error } = await supabase
      .from('user_credits')
      .select('credits')
      .eq('user_id', userId)
      .single()

    if (error) {
      console.error('Error fetching credits:', error)
      // If no record exists, create one with default credits using upsert instead of insert
      if (error.code === 'PGRST116') {
        await sleep(500) // Add small delay before retry
        const { data: upsertData, error: upsertError } = await supabase
          .from('user_credits')
          .upsert({ 
            user_id: userId, 
            credits: 1,
            updated_at: new Date().toISOString()
          })
          .select('credits')
          .single()
        
        if (upsertError) {
          console.error('Error creating user credits:', upsertError)
          if (retries > 0 && upsertError.code === '42501') {
            console.log(`Retrying getUserCredits (${retries} retries left)...`)
            await sleep(1000) // Wait a second before retrying
            return getUserCredits(userId, retries - 1)
          }
          return 1
        }
        
        return upsertData?.credits ?? 1
      }
      
      if (retries > 0) {
        console.log(`Retrying getUserCredits (${retries} retries left)...`)
        await sleep(1000)
        return getUserCredits(userId, retries - 1)
      }
      
      return 1
    }

    console.log('Retrieved credits:', data?.credits)
    return data?.credits ?? 1
  } catch (error) {
    console.error('Unexpected error fetching credits:', error)
    if (retries > 0) {
      console.log(`Retrying getUserCredits (${retries} retries left)...`)
      await sleep(1000)
      return getUserCredits(userId, retries - 1)
    }
    return 1
  }
}

export async function setUserCredits(userId: string, credits: number, retries = 3) {
  try {
    console.log('Setting credits for user:', userId, 'new credits:', credits)
    
    // Use upsert instead of separate insert/update to avoid race conditions
    const { error } = await supabase
      .from('user_credits')
      .upsert({
        user_id: userId,
        credits: credits,
        updated_at: new Date().toISOString()
      })

    if (error) {
      console.error('Error setting credits:', error)
      if (retries > 0 && error.code === '42501') {
        console.log(`Retrying setUserCredits (${retries} retries left)...`)
        await sleep(1000) // Wait a second before retrying
        return setUserCredits(userId, credits, retries - 1)
      }
      throw error
    }
    
    console.log('Credits set successfully')
    return true
  } catch (error) {
    console.error('Unexpected error setting credits:', error)
    if (retries > 0) {
      console.log(`Retrying setUserCredits (${retries} retries left)...`)
      await sleep(1000)
      return setUserCredits(userId, credits, retries - 1)
    }
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
export async function addUserCredits(userId: string, creditsToAdd: number): Promise<void> {
  try {
    console.log(`Adding ${creditsToAdd} credits to user ${userId}`)
    
    // First get current credits
    const { data, error } = await supabase
      .from('user_credits')
      .select('credits')
      .eq('user_id', userId)
      .single()
      
    // Calculate new credit amount
    const currentCredits = error ? 0 : (data?.credits || 0)
    const newCredits = currentCredits + creditsToAdd
    
    console.log(`Current credits: ${currentCredits}, New credits: ${newCredits}`)
    
    // Use upsert to add credits
    const { error: upsertError } = await supabase
      .from('user_credits')
      .upsert({
        user_id: userId,
        credits: newCredits,
        updated_at: new Date().toISOString()
      })

    if (upsertError) {
      console.error('Error adding credits:', upsertError)
      throw upsertError
    }
    
    console.log('Credits added successfully')
  } catch (error) {
    console.error('Unexpected error adding credits:', error)
    throw error
  }
} 