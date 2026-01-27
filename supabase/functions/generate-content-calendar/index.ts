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
    const { niche, userId } = await req.json();

    if (!niche) {
      return new Response(
        JSON.stringify({ error: "Nicho não fornecido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Generating content calendar for niche: ${niche}`);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const prompt = `Você é um especialista em marketing digital e criação de conteúdo para redes sociais.
    
O utilizador trabalha no nicho de: "${niche}"

Crie um calendário de 7 dias de conteúdo para redes sociais (Instagram/TikTok). Para cada dia da semana (Segunda a Domingo), forneça:

1. Uma ideia de post específica e criativa (máximo 2 frases)
2. O tipo de conteúdo mais adequado (video, image, carousel, ou story)
3. O melhor horário para postar
4. 3-5 hashtags relevantes para o nicho

Retorne APENAS um JSON válido no seguinte formato (sem texto adicional):
{
  "calendar": [
    {
      "dayName": "Segunda",
      "postIdea": "Ideia do post aqui",
      "contentType": "video",
      "bestTime": "19:00",
      "hashtags": ["hashtag1", "hashtag2", "hashtag3"]
    }
  ]
}

O conteúdo deve ser:
- Relevante para o nicho ${niche}
- Variado (misturar educativo, entretenimento, bastidores, dicas)
- Prático e fácil de executar
- Otimizado para engagement`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "Você é um assistente de marketing digital especializado em criar calendários de conteúdo. Responda apenas em JSON válido." },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições atingido. Tente novamente em alguns minutos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos de IA insuficientes. Adicione créditos na sua conta." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content returned from AI");
    }

    console.log("AI response received, parsing calendar...");

    // Parse JSON from AI response
    let calendar;
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        calendar = parsed.calendar || parsed;
      } else {
        throw new Error("No valid JSON found in response");
      }
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError, content);
      // Return fallback calendar
      calendar = generateFallbackCalendar(niche);
    }

    return new Response(
      JSON.stringify({ calendar, niche }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in generate-content-calendar:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro ao gerar calendário";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function generateFallbackCalendar(niche: string) {
  const days = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];
  const contentTypes = ["video", "image", "carousel", "story"];
  const times = ["08:00", "12:00", "19:00", "20:00", "21:00"];
  
  const nicheHashtags: Record<string, string[]> = {
    "Finanças": ["financas", "investimentos", "dinheiro", "riqueza", "educacaofinanceira"],
    "Mentor": ["mentoria", "desenvolvimentopessoal", "crescimento", "sucesso", "mindset"],
    "Saúde": ["saude", "bemestar", "vidasaudavel", "fitness", "qualidadedevida"],
    "Religioso": ["fe", "espiritualidade", "deus", "oracao", "paz"],
    "Marketing": ["marketingdigital", "vendas", "negocios", "empreendedorismo", "social"],
  };

  const defaultHashtags = nicheHashtags[niche] || ["conteudo", "dicas", "aprendizado", "crescimento", "sucesso"];

  return days.map((day, index) => ({
    dayName: day,
    postIdea: `Conteúdo de ${niche.toLowerCase()} para ${day.toLowerCase()}: Dica prática do dia sobre como melhorar resultados`,
    contentType: contentTypes[index % contentTypes.length],
    bestTime: times[index % times.length],
    hashtags: defaultHashtags,
  }));
}
