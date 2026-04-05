-- Table for temporary analytics sessions
CREATE TABLE IF NOT EXISTS public.temporary_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Optional: Allow user to protect with a simple pin/token
    access_token TEXT
);

-- Enable RLS
ALTER TABLE public.temporary_analytics ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (with size limit check in edge function)
CREATE POLICY "Allow public insert to temporary_analytics" ON public.temporary_analytics
    FOR INSERT WITH CHECK (true);

-- Allow anyone to select if they have the ID and it hasn't expired
CREATE POLICY "Allow public select from temporary_analytics" ON public.temporary_analytics
    FOR SELECT USING (now() < expires_at);

-- Create an index for expiry cleanup
CREATE INDEX IF NOT EXISTS idx_temp_analytics_expiry ON public.temporary_analytics (expires_at);

-- Function to cleanup expired sessions (can be called via cron or manually)
CREATE OR REPLACE FUNCTION public.cleanup_expired_analytics()
RETURNS void AS $$
BEGIN
    DELETE FROM public.temporary_analytics WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
