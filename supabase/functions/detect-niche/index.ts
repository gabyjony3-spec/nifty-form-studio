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
    const { profileUrl, platform, bio, username } = await req.json();

    if (!profileUrl && !bio && !username) {
      return new Response(
        JSON.stringify({ error: "URL, bio ou username necessário" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Detecting niche for: ${username || profileUrl} on ${platform}`);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const prompt = `Analise o seguinte perfil de rede social e determine o nicho principal do criador de conteúdo.

Plataforma: ${platform || "Instagram"}
Username: ${username || "N/A"}
URL do Perfil: ${profileUrl || "N/A"}
Bio/Descrição: ${bio || "N/A"}

Nichos possíveis:
- Finanças (investimentos, educação financeira, criptomoedas)
- Mentor/Coach (desenvolvimento pessoal, mindset, liderança)
- Saúde/Fitness (exercícios, nutrição, bem-estar)
- Religioso/Espiritual (fé, igreja, meditação)
- Marketing Digital (vendas, empreendedorismo, negócios)
- Tecnologia (programação, gadgets, IA)
- Moda/Beleza (estilo, maquiagem, skincare)
- Gastronomia (receitas, restaurantes, culinária)
- Viagens (turismo, destinos, aventura)
- Educação (cursos, ensino, professores)
- Entretenimento (humor, música, games)
- Lifestyle (dia a dia, família, casa)

Com base nas informações fornecidas, retorne APENAS um JSON válido:
{
  "niche": "Nome do nicho principal",
  "confidence": 0.85,
  "subNiches": ["sub-nicho1", "sub-nicho2"],
  "reasoning": "Breve explicação do porquê este nicho foi detectado"
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "Você é um especialista em análise de perfis de redes sociais. Determine o nicho com base nas informações disponíveis. Responda apenas em JSON válido." },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições atingido" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos de IA insuficientes" }),
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

    console.log("AI niche detection response received");

    // Parse JSON from AI response
    let result;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No valid JSON found");
      }
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError);
      // Return a fallback
      result = {
        niche: "Marketing Digital",
        confidence: 0.5,
        subNiches: ["empreendedorismo"],
        reasoning: "Não foi possível determinar o nicho com certeza. Assumindo nicho genérico."
      };
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in detect-niche:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro ao detectar nicho";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
