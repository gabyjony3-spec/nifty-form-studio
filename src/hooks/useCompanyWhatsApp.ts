import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Company {
  id: string;
  name: string;
  whatsapp_credits: number;
  plan: string;
  is_active: boolean;
}

interface AdminWhatsAppConfig {
  is_active: boolean;
  default_provider: string;
  meta_phone_number_id: string | null;
  meta_access_token: string | null;
}

interface WhatsAppTemplate {
  id: string;
  template_name: string;
  template_id: string | null;
  language_code: string;
  status: string;
  body_text: string | null;
  category: string;
}

interface SendTemplateParams {
  to: string;
  templateName: string;
  templateParams?: string[];
  leadId?: string;
  triggerId?: string;
}

interface SendTextParams {
  to: string;
  message: string;
  leadId?: string;
}

export const useCompanyWhatsApp = (companyId?: string) => {
  const [company, setCompany] = useState<Company | null>(null);
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [systemConfig, setSystemConfig] = useState<AdminWhatsAppConfig | null>(null);

  // Load company data, templates, and system config
  const loadCompanyData = useCallback(async () => {
    if (!companyId) {
      setLoading(false);
      return;
    }

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);

      // Fetch company (without Meta credentials - those are centralized now)
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('id, name, whatsapp_credits, plan, is_active')
        .eq('id', companyId)
        .single();

      if (companyError) {
        console.error("[useCompanyWhatsApp] Error fetching company:", companyError);
        return;
      }

      setCompany(companyData as Company);

      // Fetch centralized admin config to check system status
      const { data: adminConfig, error: adminError } = await supabase
        .from('admin_whatsapp_config')
        .select('is_active, default_provider, meta_phone_number_id, meta_access_token')
        .eq('is_active', true)
        .maybeSingle();

      if (!adminError && adminConfig) {
        setSystemConfig(adminConfig as AdminWhatsAppConfig);
      }

      // Fetch templates
      const { data: templatesData, error: templatesError } = await supabase
        .from('whatsapp_templates')
        .select('*')
        .eq('company_id', companyId)
        .eq('status', 'approved')
        .order('template_name');

      if (!templatesError && templatesData) {
        setTemplates(templatesData as WhatsAppTemplate[]);
      }
    } catch (error) {
      console.error("[useCompanyWhatsApp] Error:", error);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    loadCompanyData();
  }, [loadCompanyData]);

  // Realtime subscription for company credits
  useEffect(() => {
    if (!companyId) return;

    const channel = supabase
      .channel(`company-credits-${companyId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'companies',
          filter: `id=eq.${companyId}`
        },
        (payload) => {
          console.log("[useCompanyWhatsApp] Company updated:", payload.new);
          setCompany(prev => prev ? { ...prev, ...payload.new } as Company : null);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [companyId]);

  // Send template message
  const sendTemplate = async ({ to, templateName, templateParams, leadId, triggerId }: SendTemplateParams) => {
    if (!companyId) {
      toast({
        title: "Erro",
        description: "Empresa não selecionada",
        variant: "destructive"
      });
      return { success: false, error: "Empresa não selecionada" };
    }

    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-whatsapp-meta', {
        body: {
          companyId,
          to,
          templateName,
          templateParams,
          userId,
          leadId,
          triggerId
        }
      });

      if (error) {
        toast({
          title: "Erro ao Enviar",
          description: error.message,
          variant: "destructive"
        });
        return { success: false, error: error.message };
      }

      if (!data?.success) {
        toast({
          title: "Erro ao Enviar",
          description: data?.error || "Erro desconhecido",
          variant: "destructive"
        });
        return { success: false, error: data?.error };
      }

      toast({
        title: "Mensagem Enviada! ✅",
        description: `Template "${templateName}" enviado com sucesso.`
      });

      return { success: true, messageId: data.messageId, creditsRemaining: data.creditsRemaining };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro inesperado";
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      });
      return { success: false, error: errorMessage };
    } finally {
      setSending(false);
    }
  };

  // Send text message (24h window)
  const sendText = async ({ to, message, leadId }: SendTextParams) => {
    if (!companyId) {
      toast({
        title: "Erro",
        description: "Empresa não selecionada",
        variant: "destructive"
      });
      return { success: false, error: "Empresa não selecionada" };
    }

    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-whatsapp-meta', {
        body: {
          companyId,
          to,
          textMessage: message,
          userId,
          leadId
        }
      });

      if (error) {
        toast({
          title: "Erro ao Enviar",
          description: error.message,
          variant: "destructive"
        });
        return { success: false, error: error.message };
      }

      if (!data?.success) {
        toast({
          title: "Erro ao Enviar",
          description: data?.error || "Erro desconhecido",
          variant: "destructive"
        });
        return { success: false, error: data?.error };
      }

      toast({
        title: "Mensagem Enviada! ✅",
        description: "Mensagem de texto enviada com sucesso."
      });

      return { success: true, messageId: data.messageId, creditsRemaining: data.creditsRemaining };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro inesperado";
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      });
      return { success: false, error: errorMessage };
    } finally {
      setSending(false);
    }
  };

  // Get webhook URL for Meta configuration (admin only)
  const getWebhookUrl = () => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    return `${supabaseUrl}/functions/v1/meta-webhook`;
  };

  // Check if system is configured (from admin config)
  const isSystemConfigured = systemConfig?.is_active && 
    (systemConfig?.meta_phone_number_id || systemConfig?.default_provider === 'infobip');

  return {
    company,
    templates,
    loading,
    sending,
    sendTemplate,
    sendText,
    getWebhookUrl,
    refetch: loadCompanyData,
    credits: company?.whatsapp_credits || 0,
    isMetaConfigured: isSystemConfigured, // Now checks centralized admin config
    isSystemConfigured,
    plan: company?.plan || 'trial'
  };
};
