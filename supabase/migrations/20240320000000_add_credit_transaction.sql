-- Create a function to handle credit addition atomically
CREATE OR REPLACE FUNCTION add_user_credits(
  p_user_id TEXT,
  p_credits INTEGER,
  p_event_id TEXT
) RETURNS void AS $$
DECLARE
  v_current_credits INTEGER;
BEGIN
  -- Start transaction
  BEGIN
    -- Get current credits
    SELECT credits INTO v_current_credits
    FROM user_credits
    WHERE user_id = p_user_id
    FOR UPDATE; -- Lock the row for update

    -- If no record exists, create one with default credits
    IF v_current_credits IS NULL THEN
      v_current_credits := 1;
    END IF;

    -- Update credits
    INSERT INTO user_credits (user_id, credits, updated_at)
    VALUES (p_user_id, v_current_credits + p_credits, NOW())
    ON CONFLICT (user_id) DO UPDATE
    SET credits = v_current_credits + p_credits,
        updated_at = NOW();

    -- Mark event as processed
    INSERT INTO processed_stripe_events (event_id, user_id, credits, processed_at)
    VALUES (p_event_id, p_user_id, p_credits, NOW());

    -- Commit transaction
    COMMIT;
  EXCEPTION
    WHEN OTHERS THEN
      -- Rollback transaction on error
      ROLLBACK;
      RAISE;
  END;
END;
$$ LANGUAGE plpgsql; 