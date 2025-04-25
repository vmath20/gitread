import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

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

export async function updateUserCredits(userId: string, credits: number) {
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
      console.log('User found, updating credits from', existingUser.credits, 'to', credits)
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
    
    console.log('Credits updated successfully')
    return true
  } catch (error) {
    console.error('Unexpected error updating credits:', error)
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