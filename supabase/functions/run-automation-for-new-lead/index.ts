import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { leadId, leadTable = 'leads' } = await req.json();

    if (!leadId) {
      return new Response(
        JSON.stringify({ error: 'leadId é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[RUN-AUTOMATION] Processing lead:', leadId, 'from table:', leadTable);

    // Fetch lead data based on table
    let lead: any = null;
    let companyId: string | null = null;

    if (leadTable === 'leads_analysis') {
      const { data, error } = await supabase
        .from('leads_analysis')
        .select('*')
        .eq('id', leadId)
        .single();
      
      if (error) throw error;
      lead = data;
      
      // For leads_analysis, we need to find the company from user or use default
      if (lead.user_id) {
        const { data: userCompany } = await supabase
          .rpc('get_user_company_id', { _user_id: lead.user_id });
        companyId = userCompany;
      }
    } else {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('id', leadId)
        .single();
      
      if (error) throw error;
      lead = data;
      companyId = lead.company_id;
    }

    if (!lead) {
      return new Response(
        JSON.stringify({ error: 'Lead não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[RUN-AUTOMATION] Lead found:', lead.full_name, 'Company:', companyId);

    // If no company_id, try to find default company
    if (!companyId) {
      const { data: defaultCompany } = await supabase
        .from('companies')
        .select('id')
        .eq('slug', 'teste')
        .eq('is_active', true)
        .maybeSingle();
      
      companyId = defaultCompany?.id || null;
      console.log('[RUN-AUTOMATION] Using default company:', companyId);
    }

    if (!companyId) {
      console.log('[RUN-AUTOMATION] No company found for automation');
      return new Response(
        JSON.stringify({ success: false, message: 'Nenhuma empresa encontrada para automação' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find active triggers for new_lead event in this company
    const { data: triggers, error: triggerError } = await supabase
      .from('automation_triggers')
      .select(`
        *,
        template:whatsapp_templates(*)
      `)
      .eq('company_id', companyId)
      .eq('trigger_event', 'new_lead')
      .eq('is_active', true);

    if (triggerError) {
      console.error('[RUN-AUTOMATION] Error fetching triggers:', triggerError);
      throw triggerError;
    }

    if (!triggers || triggers.length === 0) {
      console.log('[RUN-AUTOMATION] No active triggers found for company:', companyId);
      return new Response(
        JSON.stringify({ success: true, message: 'Nenhuma automação ativa para novos leads' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[RUN-AUTOMATION] Found', triggers.length, 'active triggers');

    // Get company details for sending
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .single();

    if (companyError || !company) {
      throw new Error('Empresa não encontrada');
    }

    if (!company.meta_configured || !company.phone_number_id || !company.whatsapp_access_token) {
      console.log('[RUN-AUTOMATION] Company not configured for Meta WhatsApp');
      return new Response(
        JSON.stringify({ success: false, message: 'Empresa não configurada para WhatsApp Meta' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Process each trigger
    const results = [];
    for (const trigger of triggers) {
      try {
        console.log('[RUN-AUTOMATION] Processing trigger:', trigger.name);

        if (!lead.whatsapp) {
          console.log('[RUN-AUTOMATION] Lead has no WhatsApp number, skipping');
          results.push({ triggerId: trigger.id, success: false, reason: 'Sem WhatsApp' });
          continue;
        }

        // Get template
        const template = trigger.template;
        if (!template || template.status !== 'approved') {
          console.log('[RUN-AUTOMATION] Template not approved, skipping');
          results.push({ triggerId: trigger.id, success: false, reason: 'Template não aprovado' });
          continue;
        }

        // Build template params
        const templateParams = trigger.action_params?.template_params || [lead.full_name];

        // Call send-whatsapp-meta function
        const { data: sendResult, error: sendError } = await supabase.functions.invoke('send-whatsapp-meta', {
          body: {
            companyId: companyId,
            to: lead.whatsapp,
            templateName: template.template_name,
            templateParams: templateParams,
            triggerId: trigger.id,
            leadId: leadId
          }
        });

        if (sendError) {
          console.error('[RUN-AUTOMATION] Error sending message:', sendError);
          results.push({ triggerId: trigger.id, success: false, error: sendError.message });
        } else {
          console.log('[RUN-AUTOMATION] Message sent successfully:', sendResult);
          results.push({ triggerId: trigger.id, success: true, messageId: sendResult?.messageId });

          // Update trigger execution count
          await supabase
            .from('automation_triggers')
            .update({
              executions_count: (trigger.executions_count || 0) + 1,
              last_executed_at: new Date().toISOString()
            })
            .eq('id', trigger.id);
        }
      } catch (triggerError: any) {
        console.error('[RUN-AUTOMATION] Error processing trigger:', trigger.id, triggerError);
        results.push({ triggerId: trigger.id, success: false, error: triggerError?.message || 'Unknown error' });
      }
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[RUN-AUTOMATION] Error:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
