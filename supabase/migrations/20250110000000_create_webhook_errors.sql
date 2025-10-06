-- Create webhook_errors table for error tracking
CREATE TABLE IF NOT EXISTS public.webhook_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_type TEXT NOT NULL,
  event_id TEXT,
  event_type TEXT,
  error_message TEXT,
  error_stack TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add index for faster queries
CREATE INDEX idx_webhook_errors_created_at ON public.webhook_errors(created_at DESC);
CREATE INDEX idx_webhook_errors_type ON public.webhook_errors(webhook_type);
CREATE INDEX idx_webhook_errors_event_id ON public.webhook_errors(event_id);

-- Enable RLS
ALTER TABLE public.webhook_errors ENABLE ROW LEVEL SECURITY;

-- Only admins can view webhook errors (adjust policy as needed)
CREATE POLICY "Service role can manage webhook errors"
ON public.webhook_errors
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Optional: Create function to auto-cleanup old errors (older than 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_webhook_errors()
RETURNS void AS $$
BEGIN
  DELETE FROM public.webhook_errors
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comment on table
COMMENT ON TABLE public.webhook_errors IS 'Stores webhook processing errors for monitoring and debugging';

