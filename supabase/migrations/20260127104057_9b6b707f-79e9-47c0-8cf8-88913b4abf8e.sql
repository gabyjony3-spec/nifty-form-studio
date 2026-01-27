-- Create user_presence table for real-time presence tracking
CREATE TABLE public.user_presence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'online' CHECK (status IN ('online', 'away', 'offline')),
  last_seen_at timestamptz DEFAULT now() NOT NULL,
  current_page text,
  device_info jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_user_presence_user_id ON public.user_presence(user_id);
CREATE INDEX idx_user_presence_status ON public.user_presence(status);
CREATE INDEX idx_user_presence_last_seen ON public.user_presence(last_seen_at DESC);

-- Enable Row Level Security
ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;

-- Policy: Users can manage their own presence
CREATE POLICY "Users can manage own presence" ON public.user_presence
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Admins can read all presence data
CREATE POLICY "Admins can read all presence" ON public.user_presence
  FOR SELECT USING (
    public.has_role(auth.uid(), 'admin')
  );

-- Enable realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_presence;

-- Function to update presence (upsert)
CREATE OR REPLACE FUNCTION public.update_user_presence(
  _status text DEFAULT 'online',
  _current_page text DEFAULT NULL,
  _device_info jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_presence (user_id, status, current_page, device_info, last_seen_at)
  VALUES (auth.uid(), _status, _current_page, _device_info, now())
  ON CONFLICT (user_id)
  DO UPDATE SET
    status = EXCLUDED.status,
    current_page = EXCLUDED.current_page,
    device_info = COALESCE(EXCLUDED.device_info, user_presence.device_info),
    last_seen_at = now();
END;
$$;