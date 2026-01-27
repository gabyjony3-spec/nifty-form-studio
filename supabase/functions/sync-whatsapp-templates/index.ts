import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MetaComponent {
  type: string;
  format?: string;
  text?: string;
  buttons?: Array<{
    type: string;
    text: string;
    url?: string;
    phone_number?: string;
  }>;
  example?: {
    body_text?: string[][];
    header_text?: string[];
  };
}

interface MetaTemplate {
  id: string;
  name: string;
  status: string;
  category: string;
  language: string;
  components: MetaComponent[];
}

interface MetaResponse {
  data: MetaTemplate[];
  paging?: {
    cursors?: {
      before?: string;
      after?: string;
    };
    next?: string;
  };
}

function extractComponentData(components: MetaComponent[]) {
  let headerText = null;
  let bodyText = null;
  let footerText = null;
  let buttons: any[] = [];

  for (const component of components) {
    switch (component.type) {
      case 'HEADER':
        if (component.format === 'TEXT' && component.text) {
          headerText = component.text;
        }
        break;
      case 'BODY':
        if (component.text) {
          bodyText = component.text;
        }
        break;
      case 'FOOTER':
        if (component.text) {
          footerText = component.text;
        }
        break;
      case 'BUTTONS':
        if (component.buttons) {
          buttons = component.buttons;
        }
        break;
    }
  }

  return { headerText, bodyText, footerText, buttons };
}

async function fetchAllTemplates(wabaId: string, accessToken: string): Promise<MetaTemplate[]> {
  const allTemplates: MetaTemplate[] = [];
  let url = `https://graph.facebook.com/v19.0/${wabaId}/message_templates?fields=id,name,status,category,language,components&limit=100`;

  while (url) {
    console.log(`Fetching templates from: ${url.substring(0, 100)}...`);
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Meta API Error:', JSON.stringify(errorData));
      throw new Error(`Meta API Error: ${errorData.error?.message || response.statusText}`);
    }

    const data: MetaResponse = await response.json();
    allTemplates.push(...data.data);
    
    console.log(`Fetched ${data.data.length} templates. Total: ${allTemplates.length}`);
    
    // Check for next page
    url = data.paging?.next || '';
  }

  return allTemplates;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { companyId } = await req.json();

    if (!companyId) {
      return new Response(
        JSON.stringify({ error: 'companyId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Starting template sync for company: ${companyId}`);

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get company credentials
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id, name, waba_id, whatsapp_access_token, meta_configured')
      .eq('id', companyId)
      .single();

    if (companyError || !company) {
      console.error('Company not found:', companyError);
      return new Response(
        JSON.stringify({ error: 'Company not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!company.waba_id || !company.whatsapp_access_token) {
      return new Response(
        JSON.stringify({ error: 'Company does not have Meta WhatsApp configured. Please set WABA ID and Access Token.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Company ${company.name} - WABA ID: ${company.waba_id}`);

    // Fetch templates from Meta API
    const metaTemplates = await fetchAllTemplates(company.waba_id, company.whatsapp_access_token);
    console.log(`Total templates fetched from Meta: ${metaTemplates.length}`);

    // Get existing templates for this company
    const { data: existingTemplates } = await supabase
      .from('whatsapp_templates')
      .select('id, template_name, language_code, template_id')
      .eq('company_id', companyId);

    const existingMap = new Map(
      (existingTemplates || []).map(t => [`${t.template_name}_${t.language_code}`, t])
    );

    let added = 0;
    let updated = 0;
    const syncedKeys = new Set<string>();

    // Process each template from Meta
    for (const template of metaTemplates) {
      const key = `${template.name}_${template.language}`;
      syncedKeys.add(key);

      const { headerText, bodyText, footerText, buttons } = extractComponentData(template.components || []);

      const templateData = {
        company_id: companyId,
        template_name: template.name,
        template_id: template.id,
        language_code: template.language,
        category: template.category,
        status: template.status.toLowerCase(),
        components: template.components || [],
        header_text: headerText,
        body_text: bodyText,
        footer_text: footerText,
        buttons: buttons,
        updated_at: new Date().toISOString(),
      };

      const existing = existingMap.get(key);

      if (existing) {
        // Update existing template
        const { error: updateError } = await supabase
          .from('whatsapp_templates')
          .update(templateData)
          .eq('id', existing.id);

        if (updateError) {
          console.error(`Error updating template ${template.name}:`, updateError);
        } else {
          updated++;
        }
      } else {
        // Insert new template
        const { error: insertError } = await supabase
          .from('whatsapp_templates')
          .insert(templateData);

        if (insertError) {
          console.error(`Error inserting template ${template.name}:`, insertError);
        } else {
          added++;
        }
      }
    }

    // Mark templates that no longer exist in Meta as deleted
    let deleted = 0;
    for (const [key, template] of existingMap) {
      if (!syncedKeys.has(key)) {
        const { error: deleteError } = await supabase
          .from('whatsapp_templates')
          .update({ status: 'deleted_remotely', updated_at: new Date().toISOString() })
          .eq('id', template.id);

        if (!deleteError) {
          deleted++;
        }
      }
    }

    const result = {
      success: true,
      total: metaTemplates.length,
      added,
      updated,
      deleted,
      company: company.name,
    };

    console.log('Sync completed:', JSON.stringify(result));

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error syncing templates:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
