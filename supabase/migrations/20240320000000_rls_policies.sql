-- First drop any existing policies
DROP POLICY IF EXISTS "Users can view their own credits" ON user_credits;
DROP POLICY IF EXISTS "Users can only decrement their own credits" ON user_credits;
DROP POLICY IF EXISTS "Users can insert their own credits record" ON user_credits;
DROP POLICY IF EXISTS "Users can update their own credits" ON user_credits;
DROP POLICY IF EXISTS "Users can view their own generated READMEs" ON generated_readmes;
DROP POLICY IF EXISTS "Users can insert their own generated READMEs" ON generated_readmes;
DROP POLICY IF EXISTS "Only service role can access processed_stripe_events" ON processed_stripe_events;

-- Enable Row Level Security for all tables
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_readmes ENABLE ROW LEVEL SECURITY;
ALTER TABLE processed_stripe_events ENABLE ROW LEVEL SECURITY;

-- user_credits table policies
CREATE POLICY "Users can view their own credits"
ON user_credits
FOR SELECT
USING (user_id = auth.uid()::text);

-- Allow users to update their own credits 
CREATE POLICY "Users can update their own credits"
ON user_credits
FOR UPDATE
USING (user_id = auth.uid()::text);

-- Allow users to insert their own record
CREATE POLICY "Users can insert their own credits record"
ON user_credits
FOR INSERT
WITH CHECK (user_id = auth.uid()::text);

-- generated_readmes table policies
CREATE POLICY "Users can view their own generated READMEs"
ON generated_readmes
FOR SELECT
USING (user_id = auth.uid()::text);

CREATE POLICY "Users can insert their own generated READMEs"
ON generated_readmes
FOR INSERT
WITH CHECK (user_id = auth.uid()::text);

-- processed_stripe_events table policies
-- This table should only be accessible by the service role
CREATE POLICY "Only service role can access processed_stripe_events"
ON processed_stripe_events
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_credits_user_id ON user_credits(user_id);
CREATE INDEX IF NOT EXISTS idx_generated_readmes_user_id ON generated_readmes(user_id);
CREATE INDEX IF NOT EXISTS idx_processed_stripe_events_event_id ON processed_stripe_events(event_id); 