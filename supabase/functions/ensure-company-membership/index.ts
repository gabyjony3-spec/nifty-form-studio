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
    
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get user from token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      console.error('[ENSURE-COMPANY] Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Token inválido' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[ENSURE-COMPANY] User authenticated:', user.id, user.email);

    // Check if user already has company membership
    const { data: existingMembership, error: membershipError } = await supabaseClient
      .from('company_users')
      .select('id, company_id, role')
      .eq('user_id', user.id)
      .maybeSingle();

    if (membershipError) {
      console.error('[ENSURE-COMPANY] Error checking membership:', membershipError);
      throw membershipError;
    }

    if (existingMembership) {
      console.log('[ENSURE-COMPANY] User already has membership:', existingMembership);
      return new Response(
        JSON.stringify({ 
          ensured: true, 
          companyId: existingMembership.company_id,
          role: existingMembership.role,
          alreadyExisted: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if company already exists with user's slug (edge case recovery)
    const potentialSlug = `user-${user.id.substring(0, 8)}`;
    const { data: existingCompanyBySlug } = await supabaseClient
      .from('companies')
      .select('id')
      .eq('slug', potentialSlug)
      .maybeSingle();

    if (existingCompanyBySlug) {
      console.log('[ENSURE-COMPANY] Found orphan company, linking user:', existingCompanyBySlug.id);
      
      // Link user to existing company
      const { error: linkError } = await supabaseClient
        .from('company_users')
        .insert({
          user_id: user.id,
          company_id: existingCompanyBySlug.id,
          role: 'owner'
        });

      if (linkError) {
        console.error('[ENSURE-COMPANY] Error linking to orphan company:', linkError);
        throw linkError;
      }

      return new Response(
        JSON.stringify({ 
          ensured: true, 
          companyId: existingCompanyBySlug.id,
          role: 'owner',
          alreadyExisted: true,
          recovered: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin
    const { data: isAdmin } = await supabaseClient
      .rpc('has_role', { _user_id: user.id, _role: 'admin' });

    console.log('[ENSURE-COMPANY] Is admin:', isAdmin);

    if (isAdmin) {
      // Find or create default company for admin
      let { data: defaultCompany, error: companyError } = await supabaseClient
        .from('companies')
        .select('id')
        .eq('slug', 'teste')
        .maybeSingle();

      if (companyError) {
        console.error('[ENSURE-COMPANY] Error finding default company:', companyError);
        throw companyError;
      }

      if (!defaultCompany) {
        // Create default company if doesn't exist
        const { data: newCompany, error: createError } = await supabaseClient
          .from('companies')
          .insert({
            name: 'Teste',
            slug: 'teste',
            plan: 'trial',
            whatsapp_credits: 100,
            is_active: true
          })
          .select('id')
          .single();

        if (createError) {
          console.error('[ENSURE-COMPANY] Error creating default company:', createError);
          throw createError;
        }
        defaultCompany = newCompany;
      }

      // Link admin to company as owner
      const { error: linkError } = await supabaseClient
        .from('company_users')
        .insert({
          user_id: user.id,
          company_id: defaultCompany.id,
          role: 'owner'
        });

      if (linkError) {
        console.error('[ENSURE-COMPANY] Error linking admin to company:', linkError);
        throw linkError;
      }

      console.log('[ENSURE-COMPANY] Admin linked to company:', defaultCompany.id);

      return new Response(
        JSON.stringify({ 
          ensured: true, 
          companyId: defaultCompany.id,
          role: 'owner',
          alreadyExisted: false
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Non-admin user without company - CREATE COMPANY FOR THEM
    console.log('[ENSURE-COMPANY] Creating company for non-admin user:', user.email);
    
    // Get user profile for company name
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('full_name, email')
      .eq('id', user.id)
      .maybeSingle();

    const companyName = profile?.full_name || user.email?.split('@')[0] || 'Minha Empresa';
    const companySlug = `user-${user.id.substring(0, 8)}`;

    // Create company for user
    const { data: newCompany, error: createCompanyError } = await supabaseClient
      .from('companies')
      .insert({
        name: companyName,
        slug: companySlug,
        plan: 'trial',
        whatsapp_credits: 10,
        is_active: true
      })
      .select('id')
      .single();

    if (createCompanyError) {
      console.error('[ENSURE-COMPANY] Error creating company for user:', createCompanyError);
      throw createCompanyError;
    }

    // Link user to company as owner
    const { error: linkUserError } = await supabaseClient
      .from('company_users')
      .insert({
        user_id: user.id,
        company_id: newCompany.id,
        role: 'owner'
      });

    if (linkUserError) {
      console.error('[ENSURE-COMPANY] Error linking user to company:', linkUserError);
      throw linkUserError;
    }

    // Create initial credits for user
    await supabaseClient
      .from('user_credits')
      .upsert({
        user_id: user.id,
        current_balance: 10
      }, { onConflict: 'user_id' });

    console.log('[ENSURE-COMPANY] User linked to new company:', newCompany.id);

    return new Response(
      JSON.stringify({ 
        ensured: true, 
        companyId: newCompany.id,
        role: 'owner',
        alreadyExisted: false,
        created: true
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[ENSURE-COMPANY] Error:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
