import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ContentPillar {
  type: "autoridade" | "conexao" | "conversao";
  title: string;
  caption: string;
  postType: string;
  icon: string;
  description: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { bio, niche } = await req.json();
    
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const systemPrompt = `Você é um estrategista de conteúdo especializado em Instagram. 
Sua missão é gerar um Método de 3 Pilares de Conteúdo personalizado baseado no nicho e bio do perfil.

Os 3 Pilares são:
1. AUTORIDADE - Conteúdo técnico que prova expertise (ensina algo, mostra conhecimento)
2. CONEXÃO - Histórias pessoais para gerar confiança (bastidores, jornada, vulnerabilidade)
3. CONVERSÃO - Chamada direta para ação/venda (ofertas, depoimentos, urgência)

Para cada pilar, crie:
- Um título magnético (máx 60 caracteres, com emoji)
- Uma legenda completa (máx 300 caracteres, com CTA)
- Tipo de post (Reels, Carrossel, Story, Foto)

Retorne APENAS um JSON válido com a estrutura:
{
  "pillars": [
    {
      "type": "autoridade",
      "title": "Título do post de autoridade",
      "caption": "Legenda completa com CTA",
      "postType": "Reels",
      "icon": "📚",
      "description": "Breve explicação do objetivo"
    },
    {
      "type": "conexao",
      "title": "Título do post de conexão",
      "caption": "Legenda completa com CTA",
      "postType": "Carrossel",
      "icon": "💬",
      "description": "Breve explicação do objetivo"
    },
    {
      "type": "conversao",
      "title": "Título do post de conversão",
      "caption": "Legenda completa com CTA",
      "postType": "Story",
      "icon": "💰",
      "description": "Breve explicação do objetivo"
    }
  ]
}`;

    const userPrompt = `Gere um Método de 3 Pilares de Conteúdo para este perfil:

- Nicho: ${niche || "Marketing Digital"}
- Bio atual: ${bio || "Não disponível"}

Crie conteúdo específico para este nicho, com títulos magnéticos e legendas que convertem.
Use linguagem em português de Portugal (pt-PT) ou Brasil (pt-BR) dependendo do contexto.`;

    console.log(`[generate-content-pillars] Generating pillars for niche: ${niche}`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.8,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[generate-content-pillars] AI API error: ${response.status} - ${errorText}`);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("Empty response from AI");
    }

    // Extract JSON from response
    let pillars: ContentPillar[];
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in response");
      }
      const parsed = JSON.parse(jsonMatch[0]);
      pillars = parsed.pillars;
    } catch (parseError) {
      console.error(`[generate-content-pillars] Parse error:`, parseError);
      // Return default pillars if parsing fails
      pillars = [
        {
          type: "autoridade",
          title: `🎯 3 Erros Fatais em ${niche || "Marketing Digital"}`,
          caption: `Você está cometendo esses erros? Veja como evitá-los e acelerar seus resultados. Salve este post! 💾\n\n#${(niche || "marketing").toLowerCase().replace(/\s+/g, "")} #dicas`,
          postType: "Carrossel",
          icon: "📚",
          description: "Post que mostra conhecimento técnico e expertise"
        },
        {
          type: "conexao",
          title: `💬 A história que ninguém conta sobre minha jornada`,
          caption: `Quando comecei, tudo era diferente. Hoje quero compartilhar os bastidores da minha transformação. Você já passou por isso? 👇`,
          postType: "Reels",
          icon: "💬",
          description: "Post que gera conexão emocional e confiança"
        },
        {
          type: "conversao",
          title: `🚀 Últimas vagas: Mentoria exclusiva`,
          caption: `Resultados reais de quem já participou ⬆️ Clique no link da bio para garantir sua vaga. Oferta por tempo limitado! ⏰`,
          postType: "Story",
          icon: "💰",
          description: "Post com chamada direta para ação"
        }
      ];
    }

    console.log(`[generate-content-pillars] Successfully generated ${pillars.length} pillars`);

    return new Response(
      JSON.stringify({ pillars }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error("[generate-content-pillars] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erro ao gerar pilares de conteúdo" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
