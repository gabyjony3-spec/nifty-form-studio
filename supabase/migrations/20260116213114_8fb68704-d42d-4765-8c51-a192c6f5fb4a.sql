-- Create admin_whatsapp_config table for centralized API credentials
CREATE TABLE IF NOT EXISTS public.admin_whatsapp_config (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    provider_type TEXT NOT NULL DEFAULT 'infobip' CHECK (provider_type IN ('infobip', 'meta', 'both')),
    infobip_api_key TEXT,
    infobip_base_url TEXT,
    infobip_sender_number TEXT,
    meta_phone_number_id TEXT,
    meta_access_token TEXT,
    meta_waba_id TEXT,
    default_provider TEXT NOT NULL DEFAULT 'infobip' CHECK (default_provider IN ('infobip', 'meta')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_whatsapp_config ENABLE ROW LEVEL SECURITY;

-- Only admins can read/write this table
CREATE POLICY "Admins can manage whatsapp config" 
ON public.admin_whatsapp_config 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create scheduled_whatsapp_messages table for lead capture system
CREATE TABLE IF NOT EXISTS public.scheduled_whatsapp_messages (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    lead_phone TEXT NOT NULL,
    lead_name TEXT,
    lead_email TEXT,
    message_template TEXT NOT NULL,
    message_preview TEXT,
    scheduled_at TIMESTAMP WITH TIME ZONE,
    status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'scheduled', 'sent', 'delivered', 'read', 'failed', 'cancelled')),
    sent_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.scheduled_whatsapp_messages ENABLE ROW LEVEL SECURITY;

-- Users can manage their own scheduled messages
CREATE POLICY "Users can view their own scheduled messages" 
ON public.scheduled_whatsapp_messages 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own scheduled messages" 
ON public.scheduled_whatsapp_messages 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scheduled messages" 
ON public.scheduled_whatsapp_messages 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scheduled messages" 
ON public.scheduled_whatsapp_messages 
FOR DELETE 
USING (auth.uid() = user_id);

-- Admins can view all scheduled messages
CREATE POLICY "Admins can view all scheduled messages" 
ON public.scheduled_whatsapp_messages 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

-- Add whatsapp_receive_leads field to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS whatsapp_receive_leads TEXT;

-- Create trigger for updated_at
CREATE TRIGGER update_admin_whatsapp_config_updated_at
BEFORE UPDATE ON public.admin_whatsapp_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_scheduled_messages_updated_at
BEFORE UPDATE ON public.scheduled_whatsapp_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();