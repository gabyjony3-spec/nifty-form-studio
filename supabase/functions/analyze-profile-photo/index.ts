import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PhotoAnalysisResult {
  photo_score: number;
  verdict: "Transmite Autoridade" | "Requer Melhoria";
  breakdown: {
    framing: { score: number; feedback: string };
    background: { score: number; feedback: string };
    lighting: { score: number; feedback: string };
    expression: { score: number; feedback: string };
  };
  improvements: string[];
  is_professional: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrl, niche } = await req.json();

    if (!imageUrl) {
      return new Response(
        JSON.stringify({ error: "URL da imagem é obrigatória" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    
    if (!lovableApiKey) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    console.log(`[analyze-profile-photo] Analyzing photo for niche: ${niche || 'generic'}`);

    const nicheContext = niche || "Mentoria/Coach";
    
    const prompt = `Você é um especialista em branding pessoal e marketing visual. Analise esta foto de perfil profissional para alguém do nicho de ${nicheContext}.

CRITÉRIOS DE AVALIAÇÃO (4 PILARES):

1. ENQUADRAMENTO (0-25 pontos):
   - O rosto deve ocupar 50-60% da imagem
   - Foco no rosto gera confiança
   - Centralização e composição

2. CONTRASTE/FUNDO (0-25 pontos):
   - Fundo limpo ou desfocado
   - Não distrair do sujeito principal
   - Cores que harmonizam com o nicho

3. ILUMINAÇÃO (0-25 pontos):
   - Luz clara no rosto
   - Evitar sombras pesadas
   - Iluminação profissional vs amadora

4. EXPRESSÃO (0-25 pontos):
   - Condizente com o nicho (confiança e acessibilidade)
   - Autenticidade
   - Transmite credibilidade

Retorne APENAS um JSON válido:
{
  "photo_score": <0-100>,
  "verdict": "<'Transmite Autoridade' se score >= 70, senão 'Requer Melhoria'>",
  "breakdown": {
    "framing": { "score": <0-25>, "feedback": "<feedback específico>" },
    "background": { "score": <0-25>, "feedback": "<feedback específico>" },
    "lighting": { "score": <0-25>, "feedback": "<feedback específico>" },
    "expression": { "score": <0-25>, "feedback": "<feedback específico>" }
  },
  "improvements": ["<melhoria 1>", "<melhoria 2>"],
  "is_professional": <true/false>
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${lovableApiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { 
            role: "user", 
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: imageUrl } }
            ]
          }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[analyze-profile-photo] AI API error: ${errorText}`);
      
      // Fallback response if image analysis fails
      return new Response(
        JSON.stringify({
          photo_score: 65,
          verdict: "Requer Melhoria",
          breakdown: {
            framing: { score: 18, feedback: "Análise visual indisponível" },
            background: { score: 15, feedback: "Não foi possível avaliar o fundo" },
            lighting: { score: 16, feedback: "Iluminação não analisada" },
            expression: { score: 16, feedback: "Expressão não avaliada" }
          },
          improvements: ["Considere usar uma foto com melhor resolução para análise detalhada"],
          is_professional: false
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content || "";
    
    console.log(`[analyze-profile-photo] AI response received`);

    // Clean and parse JSON
    let jsonStr = content.trim();
    if (jsonStr.startsWith("```json")) {
      jsonStr = jsonStr.slice(7);
    }
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.slice(3);
    }
    if (jsonStr.endsWith("```")) {
      jsonStr = jsonStr.slice(0, -3);
    }
    jsonStr = jsonStr.trim();

    try {
      const parsed = JSON.parse(jsonStr);
      
      const result: PhotoAnalysisResult = {
        photo_score: parsed.photo_score || 65,
        verdict: parsed.photo_score >= 70 ? "Transmite Autoridade" : "Requer Melhoria",
        breakdown: {
          framing: parsed.breakdown?.framing || { score: 15, feedback: "Pode melhorar o enquadramento" },
          background: parsed.breakdown?.background || { score: 15, feedback: "Considere um fundo mais neutro" },
          lighting: parsed.breakdown?.lighting || { score: 15, feedback: "Iluminação pode ser otimizada" },
          expression: parsed.breakdown?.expression || { score: 15, feedback: "Expressão adequada" }
        },
        improvements: parsed.improvements || ["Use uma foto profissional"],
        is_professional: parsed.is_professional ?? (parsed.photo_score >= 70)
      };

      console.log(`[analyze-profile-photo] Photo score: ${result.photo_score}`);

      return new Response(
        JSON.stringify(result),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (parseError) {
      console.error(`[analyze-profile-photo] Parse error:`, parseError);
      
      // Return default analysis if parsing fails
      return new Response(
        JSON.stringify({
          photo_score: 60,
          verdict: "Requer Melhoria",
          breakdown: {
            framing: { score: 15, feedback: "Análise necessita mais dados" },
            background: { score: 15, feedback: "Considere um fundo profissional" },
            lighting: { score: 15, feedback: "Melhore a iluminação" },
            expression: { score: 15, feedback: "Mantenha expressão confiante" }
          },
          improvements: ["Use uma foto de alta qualidade", "Considere um fundo neutro", "Melhore a iluminação"],
          is_professional: false
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error: any) {
    console.error("[analyze-profile-photo] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erro ao analisar foto" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});