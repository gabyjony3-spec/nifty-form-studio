import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface SendWhatsAppParams {
  to: string;
  message: string;
  leadId?: string;
  automationId?: string;
  templateName?: string;
}

interface SendWhatsAppResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export const formatPhoneNumber = (phone: string): string => {
  // Remove all non-digit characters
  let clean = phone.replace(/\D/g, '');
  
  // If starts with 00, remove it (ex: 00351 → 351)
  if (clean.startsWith('00')) {
    clean = clean.substring(2);
  }
  
  // If it's a Portuguese number without country code (8-9 digits starting with 9)
  if ((clean.length === 8 || clean.length === 9) && clean.startsWith('9')) {
    clean = '351' + clean;
  }
  
  // If it's a Brazilian number without country code (10-11 digits)
  if (clean.length === 10 || clean.length === 11) {
    const brazilianAreaCodes = ['11', '12', '13', '14', '15', '16', '17', '18', '19', '21', '22', '24', '27', '28', 
      '31', '32', '33', '34', '35', '37', '38', '41', '42', '43', '44', '45', '46', '47', '48', '49', 
      '51', '53', '54', '55', '61', '62', '63', '64', '65', '66', '67', '68', '69', '71', '73', '74', 
      '75', '77', '79', '81', '82', '83', '84', '85', '86', '87', '88', '89', '91', '92', '93', '94', 
      '95', '96', '97', '98', '99'];
    if (brazilianAreaCodes.includes(clean.substring(0, 2))) {
      clean = '55' + clean;
    }
  }
  
  return clean;
};

export const validatePhoneNumber = (phone: string): { valid: boolean; error?: string } => {
  const formatted = formatPhoneNumber(phone);
  
  // Accept numbers with 10+ digits after formatting (country code + local number)
  if (formatted.length < 10) {
    return { valid: false, error: "Número muito curto. Verifique o formato." };
  }
  
  if (formatted.length > 15) {
    return { valid: false, error: "Número muito longo. Verifique o formato." };
  }
  
  return { valid: true };
};

export const useWhatsAppSend = () => {
  const [sending, setSending] = useState(false);

  const sendMessage = async ({
    to,
    message,
    leadId,
    automationId,
    templateName
  }: SendWhatsAppParams): Promise<SendWhatsAppResult> => {
    setSending(true);

    try {
      // Validate phone number
      const validation = validatePhoneNumber(to);
      if (!validation.valid) {
        toast({
          title: "Número Inválido",
          description: validation.error,
          variant: "destructive",
        });
        return { success: false, error: validation.error };
      }

      const formattedPhone = formatPhoneNumber(to);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Erro de Autenticação",
          description: "Faça login para enviar mensagens.",
          variant: "destructive",
        });
        return { success: false, error: "User not authenticated" };
      }

      // Call edge function
      const { data, error } = await supabase.functions.invoke("send-whatsapp", {
        body: {
          to: formattedPhone,
          message,
          userId: user.id,
          leadId,
          automationId,
          templateName
        }
      });

      if (error) {
        console.error("[useWhatsAppSend] Edge function error:", error);
        toast({
          title: "Erro ao Enviar",
          description: error.message || "Não foi possível enviar a mensagem.",
          variant: "destructive",
        });
        return { success: false, error: error.message };
      }

      if (!data?.success) {
        const errorMsg = data?.error || "Erro desconhecido ao enviar mensagem.";
        toast({
          title: "Erro ao Enviar",
          description: errorMsg,
          variant: "destructive",
        });
        return { success: false, error: errorMsg };
      }

      toast({
        title: "Mensagem Enviada! ✅",
        description: "A mensagem foi enviada com sucesso via WhatsApp.",
      });

      return { success: true, messageId: data.messageId };
    } catch (err) {
      console.error("[useWhatsAppSend] Unexpected error:", err);
      const errorMessage = err instanceof Error ? err.message : "Erro inesperado";
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
      return { success: false, error: errorMessage };
    } finally {
      setSending(false);
    }
  };

  const openWhatsAppWeb = (phone: string, message: string) => {
    const formattedPhone = formatPhoneNumber(phone);
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${formattedPhone}?text=${encodedMessage}`, '_blank');
  };

  return {
    sendMessage,
    openWhatsAppWeb,
    sending,
    formatPhoneNumber,
    validatePhoneNumber
  };
};
