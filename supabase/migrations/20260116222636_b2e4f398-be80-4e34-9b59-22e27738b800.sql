-- Add wallet_balance field to admin_whatsapp_config for manual balance tracking
ALTER TABLE public.admin_whatsapp_config 
ADD COLUMN IF NOT EXISTS wallet_balance DECIMAL(10,2) DEFAULT 0.00;

-- Update the sender number to the official Infobip number
UPDATE public.admin_whatsapp_config 
SET infobip_sender_number = '15558793622'
WHERE infobip_sender_number IS NULL OR infobip_sender_number = '938037248';