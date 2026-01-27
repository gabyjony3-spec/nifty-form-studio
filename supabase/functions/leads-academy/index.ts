import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface LeadPayload {
  nome: string
  email: string
  telefone?: string
  servico: string
  origem: string
  user_id: string
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  // Only accept POST requests
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ sucesso: false, erro: 'Método não permitido. Use POST.' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    // Validate API Key
    const authHeader = req.headers.get('authorization')
    const adminApiKey = Deno.env.get('ADMIN_API_KEY')

    if (!adminApiKey) {
      console.error('ADMIN_API_KEY não configurada')
      return new Response(
        JSON.stringify({ sucesso: false, erro: 'Configuração do servidor inválida' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('Requisição sem header Authorization')
      return new Response(
        JSON.stringify({ sucesso: false, erro: 'Header Authorization ausente ou inválido' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const providedKey = authHeader.replace('Bearer ', '')
    
    if (providedKey !== adminApiKey) {
      console.log('API Key inválida')
      return new Response(
        JSON.stringify({ sucesso: false, erro: 'API Key inválida' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse request body
    let payload: LeadPayload
    try {
      payload = await req.json()
    } catch {
      return new Response(
        JSON.stringify({ sucesso: false, erro: 'JSON inválido no corpo da requisição' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate required fields
    const { nome, email, servico, origem, user_id, telefone } = payload

    if (!nome || typeof nome !== 'string' || nome.trim().length === 0) {
      return new Response(
        JSON.stringify({ sucesso: false, erro: 'Campo "nome" é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return new Response(
        JSON.stringify({ sucesso: false, erro: 'Campo "email" é obrigatório e deve ser válido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!servico || typeof servico !== 'string' || servico.trim().length === 0) {
      return new Response(
        JSON.stringify({ sucesso: false, erro: 'Campo "servico" é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!origem || typeof origem !== 'string' || origem.trim().length === 0) {
      return new Response(
        JSON.stringify({ sucesso: false, erro: 'Campo "origem" é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!user_id || typeof user_id !== 'string' || user_id.trim().length === 0) {
      return new Response(
        JSON.stringify({ sucesso: false, erro: 'Campo "user_id" é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Insert lead into database
    const { data, error } = await supabase
      .from('leads_servicos')
      .insert({
        nome: nome.trim(),
        email: email.trim().toLowerCase(),
        telefone: telefone?.trim() || null,
        servico: servico.trim(),
        origem: origem.trim(),
        user_id: user_id.trim(),
        status: 'Novo'
        // data_criacao é definido automaticamente pelo DEFAULT
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao inserir lead:', error)
      return new Response(
        JSON.stringify({ sucesso: false, erro: 'Erro ao guardar lead na base de dados', detalhes: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Lead criado com sucesso:', data.id)

    return new Response(
      JSON.stringify({
        sucesso: true,
        mensagem: 'Lead registrado com sucesso',
        lead_id: data.id
      }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Erro inesperado:', error)
    return new Response(
      JSON.stringify({ sucesso: false, erro: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
