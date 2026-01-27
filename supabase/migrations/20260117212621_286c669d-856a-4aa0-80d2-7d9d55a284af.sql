-- Configuração Twilio (apenas admin)
CREATE TABLE public.admin_twilio_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_sid TEXT NOT NULL,
  auth_token TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Logs de comunicação
CREATE TABLE public.communication_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  admin_id UUID,
  provider TEXT NOT NULL,
  recipient_phone TEXT NOT NULL,
  recipient_name TEXT,
  message_content TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  external_id TEXT,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_twilio_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communication_logs ENABLE ROW LEVEL SECURITY;

-- RLS for admin_twilio_config (only admins)
CREATE POLICY "Admins can manage twilio config"
ON public.admin_twilio_config
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- RLS for communication_logs
CREATE POLICY "Admins can manage all communication logs"
ON public.communication_logs
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own communication logs"
ON public.communication_logs
FOR SELECT
USING (auth.uid() = user_id);

-- Service can insert logs
CREATE POLICY "Service can insert communication logs"
ON public.communication_logs
FOR INSERT
WITH CHECK (true);