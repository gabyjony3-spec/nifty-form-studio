import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { messages, context, message, stream = false } = body;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Support simple message format (message string instead of messages array)
    const chatMessages = messages || (message ? [{ role: "user", content: message }] : []);

    // Build system prompt with context - NO MARKDOWN FORMATTING
    let systemPrompt = `Você é um Consultor de Vendas Especialista da plataforma AI INsight, focado em ajudar utilizadores a maximizar os seus resultados de marketing digital.

REGRAS IMPORTANTES DE FORMATAÇÃO:
- NUNCA use asteriscos (*) ou duplo asteriscos (**) nas respostas
- NUNCA use markdown ou formatação especial
- Escreva texto limpo e direto, sem símbolos de formatação
- Use apenas texto simples e quebras de linha para organizar
- Para listas, use traços (-) ou números, sem asteriscos

PERSONALIDADE:
- Seja profissional, empático e focado em resultados (ROI)
- Não seja agressivo; mostre que o upgrade é o passo natural para quem quer escalar
- Destaque os benefícios tangíveis e o valor real da plataforma

CAPACIDADES:
- Interpretar resultados de análises de websites e redes sociais
- Sugerir melhorias de SEO, velocidade e conversão
- Criar mensagens persuasivas para automações de WhatsApp, Instagram e Email
- Dar dicas práticas e acionáveis de marketing digital
- Otimizar bios e perfis de redes sociais
- Sugerir ideias de conteúdo baseadas em tendências

Use português de Portugal. Seja conciso e específico.`;

    // Add analysis context if provided - WITH SALES APPROACH
    if (context?.analysisHistory) {
      const lastAnalysis = context.analysisHistory[0];
      const score = lastAnalysis?.overall_score || lastAnalysis?.score || "N/A";
      const weakPoint = score < 60 ? "SEO e velocidade" : score < 80 ? "copywriting e conversão" : "otimização avançada";
      
      systemPrompt += `

CONTEXTO DA ANÁLISE RECENTE:
${JSON.stringify(context.analysisHistory, null, 2)}

SCRIPT DE CONVERSÃO PÓS-ANÁLISE:
Após dar os insights da análise, siga esta sequência naturalmente:

1. ENTREGA DO VALOR:
"Análise concluída com sucesso! O seu score de ${score} indica que existem oportunidades imediatas de melhoria em ${weakPoint}."

2. CONVITE PARA AUTOMAÇÃO:
"Sabia que pode converter estes insights em vendas agora mesmo? Com o nosso Plano Pro, a nossa IA não apenas analisa, mas ativa a Automação de WhatsApp para responder aos seus novos leads em segundos, 24/7."

3. DESTAQUE BENEFÍCIOS PRO:
- Análises ilimitadas de websites e redes sociais
- Automação WhatsApp 24/7 com Infobip
- Relatórios mensais de performance
- Suporte prioritário

Use estes dados para dar sugestões personalizadas baseadas nos scores e problemas identificados.`;
    }

    if (context?.automationType) {
      systemPrompt += `

O utilizador está a criar uma automação do tipo: ${context.automationType}
Ajude-o a criar mensagens persuasivas e gatilhos eficazes.
Destaque como o Plano Pro permite automação 24/7 sem limites.`;
    }

    if (context?.trialEndsIn) {
      systemPrompt += `

GATILHO DE URGÊNCIA:
O período de teste do utilizador expira em ${context.trialEndsIn}.
Mencione isto naturalmente: "Notei que o seu período de teste expira em breve. Se fizer o upgrade para o Plano Pro agora, terá acesso ilimitado a análises avançadas, suporte prioritário e ao motor de vendas automático que trabalha por si."`;
    }

    console.log("Sending request to Lovable AI with context:", { 
      hasAnalysisHistory: !!context?.analysisHistory,
      automationType: context?.automationType,
      stream: stream,
      messageCount: chatMessages.length
    });

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...chatMessages,
        ],
        stream: stream,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Handle streaming vs non-streaming
    if (stream) {
      console.log("Streaming response from AI gateway");
      return new Response(response.body, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    } else {
      // Non-streaming: parse and return the response
      const data = await response.json();
      const generatedText = data.choices?.[0]?.message?.content || "";
      console.log("Non-streaming response received, length:", generatedText.length);
      
      return new Response(JSON.stringify({ 
        response: generatedText,
        generatedText: generatedText 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    console.error("Chat error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
