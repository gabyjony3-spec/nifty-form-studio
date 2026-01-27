import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WhatsAppRequest {
  to: string;
  message?: string;
  automationId?: string;
  templateName?: string;
  userId?: string;
  leadId?: string;
  test?: boolean;
  // Template mode
  useTemplate?: boolean;
  templateData?: {
    templateName: string;
    placeholders: string[];
    language?: string;
  };
}

// Error code mapping for detailed logging
const INFOBIP_ERROR_CODES: Record<string, string> = {
  'TEMPLATE_NOT_FOUND': 'Template não aprovado ou não existe na Infobip',
  'INSUFFICIENT_BALANCE': 'Saldo insuficiente na conta Infobip',
  'INVALID_PHONE_NUMBER': 'Número de telefone inválido',
  'RATE_LIMIT_EXCEEDED': 'Limite de envios excedido',
  'TEMPLATE_NOT_APPROVED': 'Template pendente de aprovação',
  'GENERAL_ERROR': 'Erro genérico da API',
};

// Robust phone number formatting
const formatPhoneNumber = (phone: string): string => {
  let clean = phone.replace(/\D/g, '');
  
  if (clean.startsWith('00')) {
    clean = clean.substring(2);
  }
  
  if ((clean.length === 8 || clean.length === 9) && clean.startsWith('9')) {
    clean = '351' + clean;
  }
  
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

const validatePhoneNumber = (phone: string): { valid: boolean; error?: string } => {
  if (phone.length < 8) {
    return { valid: false, error: "Número de telefone muito curto." };
  }
  
  if (phone.length > 15) {
    return { valid: false, error: "Número de telefone muito longo." };
  }
  
  return { valid: true };
};

// Get centralized WhatsApp config from admin table
async function getAdminConfig(supabase: any) {
  const { data, error } = await supabase
    .from('admin_whatsapp_config')
    .select('*')
    .eq('is_active', true)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('[send-whatsapp] Error fetching admin config:', error);
    return null;
  }

  return data;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  let logId: string | null = null;

  try {
    const { to, message, automationId, templateName, userId, leadId, test, useTemplate, templateData } = await req.json() as WhatsAppRequest;

    // Try to get credentials from admin_whatsapp_config first
    const adminConfig = await getAdminConfig(supabase);
    
    // Fallback to environment variables if admin config not set
    let INFOBIP_API_KEY = adminConfig?.infobip_api_key || Deno.env.get('INFOBIP_API_KEY');
    let INFOBIP_BASE_URL = adminConfig?.infobip_base_url || Deno.env.get('INFOBIP_BASE_URL');
    // Official Infobip sender number
    let SENDER_NUMBER = adminConfig?.infobip_sender_number || "15558793622";
    const walletBalance = adminConfig?.wallet_balance || 0;

    console.log('[send-whatsapp] Using config source:', adminConfig ? 'admin_whatsapp_config table' : 'environment variables');

    // Handle test mode
    if (test === true) {
      console.log('[send-whatsapp] Test mode - checking credentials only');
      
      if (!INFOBIP_API_KEY || !INFOBIP_BASE_URL) {
        console.error('[send-whatsapp] Test failed - missing Infobip credentials');
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Credenciais da API não configuradas. Configure na página WhatsApp Central ou nas variáveis de ambiente.' 
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('[send-whatsapp] Test passed - credentials are configured');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Credenciais configuradas corretamente',
          source: adminConfig ? 'admin_config' : 'env_variables'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[send-whatsapp] Sending message to: ${to}`);

    // Validate required fields based on mode
    if (!to) {
      console.error('[send-whatsapp] Missing required field: to');
      return new Response(
        JSON.stringify({ error: 'Campo obrigatório em falta: destinatário' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!useTemplate && !message) {
      console.error('[send-whatsapp] Missing required field: message (for text mode)');
      return new Response(
        JSON.stringify({ error: 'Campo obrigatório em falta: mensagem' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (useTemplate && (!templateData?.templateName || !templateData?.placeholders)) {
      console.error('[send-whatsapp] Missing template data');
      return new Response(
        JSON.stringify({ error: 'Dados do template em falta: templateName e placeholders são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check wallet balance (warn only, don't block)
    if (walletBalance < 0.10) {
      console.warn(`[send-whatsapp] Low wallet balance: €${walletBalance}`);
    }

    if (!INFOBIP_API_KEY || !INFOBIP_BASE_URL) {
      console.error('[send-whatsapp] Missing Infobip credentials');
      return new Response(
        JSON.stringify({ error: 'Credenciais da API não configuradas. Contacte o administrador.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check user credits if userId is provided
    if (userId) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('whatsapp_credits')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('[send-whatsapp] Error fetching profile:', profileError);
      } else if (profile) {
        const currentCredits = profile.whatsapp_credits || 0;
        
        const { data: userRole } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId)
          .eq('role', 'admin')
          .maybeSingle();

        const isAdmin = !!userRole;

        if (!isAdmin && currentCredits <= 0) {
          console.log(`[send-whatsapp] User ${userId} has no credits (${currentCredits})`);
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: 'Créditos insuficientes. Faça upgrade do seu plano para continuar a enviar mensagens.' 
            }),
            { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    }

    const formattedPhone = formatPhoneNumber(to);
    
    const validation = validatePhoneNumber(formattedPhone);
    if (!validation.valid) {
      console.error(`[send-whatsapp] Invalid phone number: ${formattedPhone} - ${validation.error}`);
      return new Response(
        JSON.stringify({ success: false, error: validation.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`[send-whatsapp] Original: ${to}, Formatted: ${formattedPhone}`);
    console.log(`[send-whatsapp] Message preview: ${message ? message.substring(0, 50) + '...' : 'Template mode'}`);

    // Create initial log entry
    if (userId) {
      const { data: logData, error: logError } = await supabase
        .from('automation_logs')
        .insert({
          user_id: userId,
          lead_id: null,
          automation_id: automationId || null,
          type: 'whatsapp',
          status: 'pending',
          content: message,
          recipient_phone: formattedPhone,
          metadata: { 
            templateName,
            originalLeadId: leadId || null,
            configSource: adminConfig ? 'admin_config' : 'env_variables'
          }
        })
        .select('id')
        .single();

      if (logError) {
        console.error('[send-whatsapp] Error creating log:', logError);
      } else {
        logId = logData.id;
        console.log(`[send-whatsapp] Created log entry: ${logId}`);
      }
    }

    // Determine endpoint and payload based on mode
    let infobipEndpoint: string;
    let infobipPayload: any;

    if (useTemplate && templateData) {
      // Template message mode
      infobipEndpoint = `https://${INFOBIP_BASE_URL}/whatsapp/1/message/template`;
      infobipPayload = {
        messages: [{
          from: SENDER_NUMBER,
          to: formattedPhone,
          content: {
            templateName: templateData.templateName,
            templateData: {
              body: {
                placeholders: templateData.placeholders
              }
            },
            language: templateData.language || 'pt_PT'
          }
        }]
      };
      console.log(`[send-whatsapp] Sending TEMPLATE message: ${templateData.templateName}`);
    } else {
      // Text message mode - Infobip WhatsApp API format
      // The API expects "content" field, not "message"
      infobipEndpoint = `https://${INFOBIP_BASE_URL}/whatsapp/1/message/text`;
      infobipPayload = {
        from: SENDER_NUMBER,
        to: formattedPhone,
        content: {
          text: message
        },
        callbackData: logId || undefined,
        notifyUrl: `${supabaseUrl}/functions/v1/whatsapp-webhook`
      };
      console.log(`[send-whatsapp] Sending TEXT message to ${formattedPhone}`);
      console.log(`[send-whatsapp] Payload:`, JSON.stringify(infobipPayload));
    }

    // Send message via Infobip WhatsApp API
    const infobipResponse = await fetch(infobipEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': `App ${INFOBIP_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(infobipPayload),
    });

    const infobipResult = await infobipResponse.json();
    const httpStatus = infobipResponse.status;
    const isSuccess = httpStatus === 200 || httpStatus === 201;

    console.log(`[send-whatsapp] Infobip HTTP status: ${httpStatus}`);
    console.log(`[send-whatsapp] Infobip response:`, JSON.stringify(infobipResult));
    console.log(`[send-whatsapp] Success: ${isSuccess}`);

    if (!isSuccess) {
      console.error('[send-whatsapp] Infobip API error:', infobipResult);
      
      // Parse error for detailed logging
      const errorCode = infobipResult?.requestError?.serviceException?.messageId || 
                        infobipResult?.requestError?.serviceException?.id ||
                        infobipResult?.error?.code ||
                        'GENERAL_ERROR';
      const errorText = INFOBIP_ERROR_CODES[errorCode] || 
                        infobipResult?.requestError?.serviceException?.text ||
                        infobipResult?.error?.message ||
                        'Erro desconhecido da API Infobip';
      
      // Update log with full Infobip response
      if (logId) {
        await supabase
          .from('automation_logs')
          .update({ 
            status: 'failed',
            error_message: `${errorCode}: ${errorText}`,
            metadata: { 
              response_infobip: infobipResult,
              http_status: httpStatus,
              errorCode,
              data_hora_envio: new Date().toISOString()
            },
            updated_at: new Date().toISOString()
          })
          .eq('id', logId);
      }

      // Create admin alert for critical errors
      if (errorCode === 'INSUFFICIENT_BALANCE' || errorCode === 'TEMPLATE_NOT_APPROVED') {
        await supabase
          .from('admin_alerts')
          .insert({
            type: 'whatsapp_error',
            title: errorCode === 'INSUFFICIENT_BALANCE' ? 'Saldo Infobip Insuficiente' : 'Template Não Aprovado',
            message: errorText,
            data: { errorCode, infobipResult, httpStatus }
          });
      }

      return new Response(
        JSON.stringify({ 
          success: false, 
          error: errorText,
          errorCode,
          httpStatus,
          details: infobipResult 
        }),
        { status: httpStatus, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const externalMessageId = infobipResult.messages?.[0]?.messageId || infobipResult.messageId;
    const messageStatus = infobipResult.messages?.[0]?.status?.name || 'SENT';

    // Update log with sent status and full Infobip response
    if (logId) {
      await supabase
        .from('automation_logs')
        .update({ 
          status: 'sent',
          external_message_id: externalMessageId,
          metadata: {
            response_infobip: infobipResult,
            http_status: httpStatus,
            message_status: messageStatus,
            data_hora_envio: new Date().toISOString()
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', logId);
      console.log(`[send-whatsapp] Updated log ${logId} to 'sent' status with messageId: ${externalMessageId}`);
    }

    // Deduct credit from user profile
    if (userId) {
      const { data: userRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .maybeSingle();

      const isAdmin = !!userRole;

      if (!isAdmin) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('whatsapp_credits')
          .eq('id', userId)
          .single();

        if (profile && profile.whatsapp_credits > 0) {
          await supabase
            .from('profiles')
            .update({ 
              whatsapp_credits: profile.whatsapp_credits - 1,
              updated_at: new Date().toISOString()
            })
            .eq('id', userId);
          console.log(`[send-whatsapp] Deducted 1 credit from user ${userId}. Remaining: ${profile.whatsapp_credits - 1}`);
        }
      }
    }

    // Notify user if they have whatsapp_receive_leads configured
    if (userId) {
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('whatsapp_receive_leads, full_name')
        .eq('id', userId)
        .single();

      if (userProfile?.whatsapp_receive_leads) {
        console.log(`[send-whatsapp] User has notification number: ${userProfile.whatsapp_receive_leads}`);
        // Note: To avoid recursion, we don't send notification here
        // This could be handled by a separate trigger/function
      }
    }

    // Update automation stats
    if (automationId) {
      console.log(`[send-whatsapp] Updating automation stats for: ${automationId}`);

      const { data: automation, error: fetchError } = await supabase
        .from('automations')
        .select('messages_sent')
        .eq('id', automationId)
        .single();

      if (!fetchError && automation) {
        const { error: updateError } = await supabase
          .from('automations')
          .update({ 
            messages_sent: (automation.messages_sent || 0) + 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', automationId);

        if (updateError) {
          console.error('[send-whatsapp] Error updating automation stats:', updateError);
        } else {
          console.log('[send-whatsapp] Automation stats updated successfully');
        }
      }
    }

    console.log('[send-whatsapp] Message sent successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: externalMessageId,
        logId: logId,
        result: infobipResult 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor';
    console.error('[send-whatsapp] Unexpected error:', error);

    if (logId) {
      await supabase
        .from('automation_logs')
        .update({ 
          status: 'failed',
          error_message: errorMessage,
          updated_at: new Date().toISOString()
        })
        .eq('id', logId);
    }

    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});