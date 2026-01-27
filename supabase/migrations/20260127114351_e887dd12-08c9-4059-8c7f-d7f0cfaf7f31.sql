-- Tabela para armazenar mensagens de contato
CREATE TABLE public.contact_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Política para permitir inserções públicas (qualquer pessoa pode enviar mensagem)
CREATE POLICY "Anyone can insert contact messages"
  ON public.contact_messages
  FOR INSERT
  WITH CHECK (true);

-- Política para leitura apenas por usuários autenticados (admin futuro)
CREATE POLICY "Only authenticated users can view messages"
  ON public.contact_messages
  FOR SELECT
  TO authenticated
  USING (true);