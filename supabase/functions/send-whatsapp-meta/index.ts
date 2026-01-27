import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GRAPH_API_URL = "https://graph.facebook.com/v19.0";

interface SendWhatsAppRequest {
  companyId: string;
  to: string;
  templateName?: string;
  templateParams?: string[];
  textMessage?: string;
  userId?: string;
  leadId?: string;
  triggerId?: string;
}

// Format phone number to E.164 format
const formatPhoneNumber = (phone: string): string => {
  let clean = phone.replace(/\D/g, '');
  
  if (clean.startsWith('00')) {
    clean = clean.substring(2);
  }
  
  // Portuguese numbers
  if ((clean.length === 8 || clean.length === 9) && clean.startsWith('9')) {
    clean = '351' + clean;
  }
  
  // Brazilian numbers
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

// Get centralized admin config for Meta WhatsApp
async function getAdminMetaConfig(supabase: any) {
  const { data, error } = await supabase
    .from('admin_whatsapp_config')
    .select('*')
    .eq('is_active', true)
    .maybeSingle();

  if (error) {
    console.error('[send-whatsapp-meta] Error fetching admin config:', error);
    return null;
  }

  return data;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: SendWhatsAppRequest = await req.json();
    const { companyId, to, templateName, templateParams, textMessage, userId, leadId, triggerId } = body;

    console.log("[send-whatsapp-meta] Request received:", { companyId, to, templateName });

    // Validate required fields
    if (!companyId) {
      return new Response(
        JSON.stringify({ success: false, error: "companyId é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!to) {
      return new Response(
        JSON.stringify({ success: false, error: "Número de destino é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!templateName && !textMessage) {
      return new Response(
        JSON.stringify({ success: false, error: "templateName ou textMessage é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch CENTRALIZED admin config first
    const adminConfig = await getAdminMetaConfig(supabase);
    
    if (!adminConfig || !adminConfig.is_active) {
      console.error("[send-whatsapp-meta] Admin config not active or not found");
      return new Response(
        JSON.stringify({ success: false, error: "Sistema WhatsApp não está configurado. Contacte o administrador." }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if Meta is configured in admin config
    if (!adminConfig.meta_phone_number_id || !adminConfig.meta_access_token) {
      console.error("[send-whatsapp-meta] Meta credentials not configured in admin");
      return new Response(
        JSON.stringify({ success: false, error: "Meta WhatsApp API não está configurada. Contacte o administrador." }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("[send-whatsapp-meta] Using centralized admin Meta config");

    // Fetch company to check credits and status
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id, name, whatsapp_credits, plan, is_active')
      .eq('id', companyId)
      .single();

    if (companyError || !company) {
      console.error("[send-whatsapp-meta] Company not found:", companyError);
      return new Response(
        JSON.stringify({ success: false, error: "Empresa não encontrada" }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if company is active
    if (!company.is_active) {
      return new Response(
        JSON.stringify({ success: false, error: "Empresa inativa" }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check credits (unless unlimited plan)
    const isUnlimited = company.plan === 'business';
    if (!isUnlimited && company.whatsapp_credits <= 0) {
      return new Response(
        JSON.stringify({ success: false, error: "Créditos WhatsApp esgotados. Faça upgrade do plano." }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const formattedPhone = formatPhoneNumber(to);
    console.log("[send-whatsapp-meta] Formatted phone:", formattedPhone);

    // Build Meta API request body
    let metaBody: Record<string, unknown>;

    if (templateName) {
      // Template message
      metaBody = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: formattedPhone,
        type: "template",
        template: {
          name: templateName,
          language: { code: "pt_PT" },
          components: templateParams && templateParams.length > 0 ? [
            {
              type: "body",
              parameters: templateParams.map(p => ({ type: "text", text: p }))
            }
          ] : []
        }
      };
    } else {
      // Text message (24h window)
      metaBody = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: formattedPhone,
        type: "text",
        text: {
          preview_url: false,
          body: textMessage
        }
      };
    }

    // Create pending log entry
    const { data: logEntry, error: logError } = await supabase
      .from('automation_logs')
      .insert({
        company_id: companyId,
        user_id: userId || null,
        type: 'whatsapp',
        status: 'pending',
        recipient_phone: formattedPhone,
        content: templateName ? `Template: ${templateName}` : textMessage,
        template_name: templateName || null,
        trigger_id: triggerId || null,
        metadata: {
          originalLeadId: leadId,
          templateParams: templateParams || [],
          provider: 'meta',
          configSource: 'admin_centralized'
        }
      })
      .select()
      .single();

    if (logError) {
      console.error("[send-whatsapp-meta] Error creating log:", logError);
    }

    // Send message via Meta Graph API using ADMIN credentials
    const metaUrl = `${GRAPH_API_URL}/${adminConfig.meta_phone_number_id}/messages`;
    console.log("[send-whatsapp-meta] Sending to Meta API:", metaUrl);

    const metaResponse = await fetch(metaUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminConfig.meta_access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(metaBody)
    });

    const metaResult = await metaResponse.json();
    console.log("[send-whatsapp-meta] Meta API response:", metaResult);

    if (!metaResponse.ok || metaResult.error) {
      const errorMessage = metaResult.error?.message || 'Erro ao enviar mensagem via Meta';
      console.error("[send-whatsapp-meta] Meta API error:", metaResult.error);

      // Update log with failure
      if (logEntry) {
        await supabase
          .from('automation_logs')
          .update({
            status: 'failed',
            error_message: errorMessage,
            updated_at: new Date().toISOString()
          })
          .eq('id', logEntry.id);
      }

      return new Response(
        JSON.stringify({ success: false, error: errorMessage }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract message ID from Meta response
    const metaMessageId = metaResult.messages?.[0]?.id;
    console.log("[send-whatsapp-meta] Message sent successfully. Meta Message ID:", metaMessageId);

    // Update log with success
    if (logEntry) {
      await supabase
        .from('automation_logs')
        .update({
          status: 'sent',
          meta_message_id: metaMessageId,
          external_message_id: metaMessageId,
          updated_at: new Date().toISOString()
        })
        .eq('id', logEntry.id);
    }

    // Deduct credit from COMPANY (if not unlimited)
    if (!isUnlimited) {
      await supabase
        .from('companies')
        .update({ 
          whatsapp_credits: company.whatsapp_credits - 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', companyId);
    }

    // Update trigger execution count if applicable
    if (triggerId) {
      try {
        const { data: trigger } = await supabase
          .from('automation_triggers')
          .select('executions_count')
          .eq('id', triggerId)
          .single();

        if (trigger) {
          await supabase
            .from('automation_triggers')
            .update({ 
              executions_count: (trigger.executions_count || 0) + 1,
              last_executed_at: new Date().toISOString()
            })
            .eq('id', triggerId);
        }
      } catch (e) {
        console.log("[send-whatsapp-meta] Trigger update failed:", e);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        messageId: metaMessageId,
        logId: logEntry?.id,
        creditsRemaining: isUnlimited ? 'unlimited' : company.whatsapp_credits - 1
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error("[send-whatsapp-meta] Unexpected error:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro interno do servidor";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
