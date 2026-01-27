import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Emojis proibidos pelo Meta (alguns exemplos - emojis de armas, violência, etc.)
const forbiddenPatterns = [
  /🔫|💣|🔪|💀|☠️|🩸|💉|🚬|🍺|🍻|🥃|🍷|🍸|🍹/g, // armas, violência, álcool
  /\b(grátis|free|urgente|última chance|oferta limitada|clique aqui|spam)\b/gi, // palavras que causam rejeição
];

// Função para validar e limpar o texto gerado
function validateAndClean(text: string): { cleanText: string; warnings: string[] } {
  let cleanText = text;
  const warnings: string[] = [];

  for (const pattern of forbiddenPatterns) {
    if (pattern.test(text)) {
      warnings.push("Alguns elementos foram removidos para melhor aprovação pelo Meta");
      cleanText = cleanText.replace(pattern, '');
    }
    pattern.lastIndex = 0; // Reset regex
  }

  // Limitar comprimento do corpo (1024 caracteres é o limite do Meta)
  if (cleanText.length > 1024) {
    cleanText = cleanText.substring(0, 1020) + '...';
    warnings.push("Texto truncado para 1024 caracteres (limite Meta)");
  }

  return { cleanText, warnings };
}

// Função para gerar nome de template a partir do objectivo
function generateTemplateName(objective: string): string {
  return objective
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9\s]/g, '') // Remove caracteres especiais
    .trim()
    .replace(/\s+/g, '_') // Substitui espaços por underscores
    .substring(0, 50); // Limita tamanho
}

// Função para sugerir categoria
function suggestCategory(objective: string, bodyText: string): string {
  const lowerObjective = (objective + ' ' + bodyText).toLowerCase();
  
  if (lowerObjective.includes('código') || lowerObjective.includes('verificação') || 
      lowerObjective.includes('otp') || lowerObjective.includes('password')) {
    return 'AUTHENTICATION';
  }
  
  if (lowerObjective.includes('lembrete') || lowerObjective.includes('confirmação') ||
      lowerObjective.includes('agendamento') || lowerObjective.includes('entrega') ||
      lowerObjective.includes('pagamento') || lowerObjective.includes('notificação')) {
    return 'UTILITY';
  }
  
  return 'MARKETING';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { objective, language = 'pt_PT' } = await req.json();

    if (!objective) {
      return new Response(
        JSON.stringify({ error: 'Objetivo é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY não configurado');
    }

    const languageMap: Record<string, string> = {
      'pt_PT': 'português de Portugal',
      'pt_BR': 'português do Brasil',
      'en_US': 'inglês americano',
      'es_ES': 'espanhol'
    };

    const systemPrompt = `Você é um especialista em copywriting para WhatsApp Business API. Crie templates de mensagens profissionais e eficazes.

REGRAS CRÍTICAS:
1. Use {{1}} para o nome do lead, {{2}} para empresa, {{3}} para outros dados dinâmicos
2. Use formatação WhatsApp: *negrito*, _itálico_, ~riscado~
3. Mantenha o tom profissional mas acolhedor
4. Limite-se a 1-2 emojis apropriados para negócios (✅ 📊 🚀 💡 📈 🎯)
5. NÃO use: emojis de armas, violência, álcool, cigarros
6. EVITE palavras spam: grátis, urgente, última chance, clique aqui
7. Máximo 900 caracteres
8. Termine com uma pergunta ou call-to-action suave
9. Escreva em ${languageMap[language] || 'português de Portugal'}

Retorne APENAS um JSON válido com esta estrutura exata:
{
  "body_text": "texto da mensagem aqui",
  "header_text": "cabeçalho curto opcional ou null",
  "footer_text": "rodapé opcional ou null"
}`;

    console.log('Generating template for objective:', objective);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Crie um template WhatsApp para: ${objective}` }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Limite de requisições excedido. Tente novamente em alguns segundos.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Créditos IA esgotados. Contacte o administrador.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('Resposta vazia da IA');
    }

    console.log('AI raw response:', content);

    // Extrair JSON da resposta
    let generatedTemplate;
    try {
      // Tenta extrair JSON do texto (pode vir com markdown ```json```)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        generatedTemplate = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('JSON não encontrado na resposta');
      }
    } catch (parseError) {
      console.error('Parse error:', parseError, 'Content:', content);
      throw new Error('Erro ao processar resposta da IA');
    }

    // Validar e limpar o texto
    const { cleanText, warnings } = validateAndClean(generatedTemplate.body_text || '');

    // Gerar sugestões automáticas
    const suggestedName = generateTemplateName(objective);
    const suggestedCategory = suggestCategory(objective, cleanText);

    const result = {
      body_text: cleanText,
      header_text: generatedTemplate.header_text || null,
      footer_text: generatedTemplate.footer_text || null,
      suggested_name: suggestedName,
      suggested_category: suggestedCategory,
      warnings: warnings,
    };

    console.log('Generated template result:', result);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating template:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
