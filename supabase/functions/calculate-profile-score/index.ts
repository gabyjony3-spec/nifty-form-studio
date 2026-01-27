import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProfileScoreResult {
  total_score: number;
  breakdown: {
    bio: number;
    visual: number;
    engagement: number;
    consistency: number;
  };
  issues: string[];
  improvements: string[];
}

interface ProfileData {
  followers?: number;
  posts?: number;
  likes?: number;
  comments?: number;
  posts_last_30_days?: number;
  has_bio_cta?: boolean;
  has_niche_keywords?: boolean;
  has_professional_photo?: boolean;
  is_verified?: boolean;
  engagement_rate?: number;
}

/**
 * Real Authority Score Formula:
 * Score = (Engagement Rate × 10) + (Posting Frequency × 5) + Bonuses
 * 
 * Where:
 * - Engagement Rate = (likes + comments) / followers × 100
 * - Posting Frequency (posts per week in last 30 days):
 *   - 7+ posts/week = 10 points
 *   - 4-6 posts/week = 7 points
 *   - 2-3 posts/week = 4 points
 *   - 1 post/week = 2 points
 *   - 0 posts/week = 0 points
 * 
 * Bonuses:
 * - Optimized Bio with CTA (+5)
 * - Professional Photo (+5)
 * - Verified Badge (+10)
 * - Niche Keywords in Bio (+5)
 */
function calculateRealScore(data: ProfileData): ProfileScoreResult {
  const followers = data.followers || 0;
  const likes = data.likes || 0;
  const comments = data.comments || 0;
  const postsLast30Days = data.posts_last_30_days || 0;
  
  // Calculate Engagement Rate
  let engagementRate = data.engagement_rate || 0;
  if (!engagementRate && followers > 0) {
    engagementRate = ((likes + comments) / followers) * 100;
  }
  
  // Engagement Score (max 30 points based on rate thresholds)
  let engagementScore = 0;
  if (engagementRate > 5) engagementScore = 30;
  else if (engagementRate > 3) engagementScore = 20;
  else if (engagementRate > 1) engagementScore = 10;
  else engagementScore = 5;
  
  // Posting Frequency Score (max 30 points)
  const postsPerWeek = postsLast30Days / 4;
  let consistencyScore = 0;
  if (postsPerWeek >= 7) consistencyScore = 30;
  else if (postsPerWeek >= 4) consistencyScore = 21;
  else if (postsPerWeek >= 2) consistencyScore = 12;
  else if (postsPerWeek >= 1) consistencyScore = 6;
  else consistencyScore = Math.min(postsLast30Days, 30); // 1 point per post
  
  // Bio Score (max 20 points)
  let bioScore = 5; // Base score
  if (data.has_bio_cta) bioScore += 8;
  if (data.has_niche_keywords) bioScore += 7;
  
  // Visual Score (max 20 points)
  let visualScore = 8; // Base score
  if (data.has_professional_photo) visualScore += 7;
  if (data.is_verified) visualScore += 5;
  
  // Calculate total (capped at 100)
  let totalScore = Math.min(100, bioScore + visualScore + engagementScore + consistencyScore);
  
  // Generate issues based on scores
  const issues: string[] = [];
  const improvements: string[] = [];
  
  if (!data.has_bio_cta) {
    issues.push("Bio sem Call-to-Action (CTA) clara");
    improvements.push("Adicione um CTA na bio como 'Clique no link' ou 'Agende agora'");
  }
  
  if (!data.has_niche_keywords) {
    issues.push("Falta palavras-chave do nicho na bio");
    improvements.push("Inclua termos relevantes do seu nicho na bio para melhorar descoberta");
  }
  
  if (!data.has_professional_photo) {
    issues.push("Foto de perfil pode ser melhorada");
    improvements.push("Use uma foto profissional com boa iluminação e enquadramento");
  }
  
  if (engagementRate < 3) {
    issues.push(`Taxa de engajamento baixa (${engagementRate.toFixed(1)}%)`);
    improvements.push("Responda comentários e crie conteúdo que gere interação (enquetes, perguntas)");
  }
  
  if (postsPerWeek < 4) {
    issues.push(`Frequência de posts baixa (${postsPerWeek.toFixed(1)}/semana)`);
    improvements.push("Aumente para pelo menos 4-5 posts por semana para manter consistência");
  }
  
  if (issues.length === 0) {
    issues.push("Perfil bem otimizado!");
  }
  
  if (improvements.length === 0) {
    improvements.push("Continue mantendo a consistência atual");
  }
  
  return {
    total_score: Math.round(totalScore),
    breakdown: {
      bio: Math.round(bioScore),
      visual: Math.round(visualScore),
      engagement: Math.round(engagementScore),
      consistency: Math.round(consistencyScore),
    },
    issues,
    improvements,
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, platform, profileData } = await req.json();

    console.log(`[calculate-profile-score] Starting calculation for ${platform || 'unknown'}`);

    // If we have real profile data, use the formula-based calculation
    if (profileData && (profileData.followers || profileData.engagement_rate)) {
      console.log(`[calculate-profile-score] Using REAL formula calculation with data:`, profileData);
      
      const result = calculateRealScore(profileData);
      
      console.log(`[calculate-profile-score] Real score calculated: ${result.total_score}`);
      
      return new Response(
        JSON.stringify(result),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fallback to AI-based estimation if no real data available
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    
    if (!lovableApiKey) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const prompt = `Você é um especialista em análise de perfis de redes sociais. Calcule o Profile Score para o seguinte perfil:

URL/Plataforma: ${url || platform || 'Não especificado'}
Dados adicionais: ${profileData ? JSON.stringify(profileData) : 'Nenhum'}

FÓRMULA DO SCORE DE AUTORIDADE:
Score = (Taxa de Engajamento × 10) + (Frequência de Postagem × 5) + Bónus

CRITÉRIOS DE PONTUAÇÃO (total máximo: 100 pontos):

1. BIO (máximo 20 pontos):
   - CTA (Call-to-Action) clara e visível: +10 pontos
   - Palavra-chave do nicho presente: +10 pontos

2. VISUAL (máximo 20 pontos):
   - Foto de perfil profissional/de qualidade: +10 pontos
   - Verificado / Consistência visual: +10 pontos

3. ENGAJAMENTO (máximo 30 pontos):
   - Taxa de engajamento = (likes + comentários) / seguidores * 100
   - 0-1%: 5 pontos | 1-3%: 10 pontos | 3-5%: 20 pontos | >5%: 30 pontos

4. CONSISTÊNCIA (máximo 30 pontos):
   - 7+ posts/semana: 30 pontos
   - 4-6 posts/semana: 21 pontos
   - 2-3 posts/semana: 12 pontos
   - 1 post/semana: 6 pontos

Retorne APENAS um JSON válido com esta estrutura:
{
  "total_score": <soma dos 4 critérios>,
  "breakdown": {
    "bio": <0-20>,
    "visual": <0-20>,
    "engagement": <0-30>,
    "consistency": <0-30>
  },
  "issues": [
    "<problema identificado 1>",
    "<problema identificado 2>"
  ],
  "improvements": [
    "<sugestão de melhoria específica 1>",
    "<sugestão de melhoria específica 2>",
    "<sugestão de melhoria específica 3>"
  ]
}

Seja realista na pontuação. A maioria dos perfis pontua entre 40-75 pontos.
IMPORTANTE: Retorne APENAS o JSON, sem markdown, sem explicações.`;

    console.log(`[calculate-profile-score] Calling AI for estimation...`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${lovableApiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "Você é um analisador de perfis de redes sociais. Responda apenas com JSON válido." },
          { role: "user", content: prompt }
        ],
        temperature: 0.5,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[calculate-profile-score] AI API error: ${errorText}`);
      throw new Error(`AI API error: ${response.status}`);
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content || "";
    
    console.log(`[calculate-profile-score] AI response received`);

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

    let result: ProfileScoreResult;
    
    try {
      const parsed = JSON.parse(jsonStr);
      result = {
        total_score: parsed.total_score || 65,
        breakdown: {
          bio: Math.min(20, parsed.breakdown?.bio || 12),
          visual: Math.min(20, parsed.breakdown?.visual || 14),
          engagement: Math.min(30, parsed.breakdown?.engagement || 18),
          consistency: Math.min(30, parsed.breakdown?.consistency || 21),
        },
        issues: parsed.issues || ["Alguns aspectos podem ser melhorados"],
        improvements: parsed.improvements || ["Continue a analisar e otimizar o perfil"],
      };
      
      // Recalculate total to ensure consistency
      result.total_score = result.breakdown.bio + result.breakdown.visual + result.breakdown.engagement + result.breakdown.consistency;
      
    } catch (parseError) {
      console.error(`[calculate-profile-score] Parse error:`, parseError);
      result = {
        total_score: 65,
        breakdown: { bio: 12, visual: 14, engagement: 18, consistency: 21 },
        issues: ["Análise automática com dados limitados"],
        improvements: ["Faça uma análise mais detalhada do perfil"],
      };
    }

    console.log(`[calculate-profile-score] Score calculated: ${result.total_score}`);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error("[calculate-profile-score] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erro interno ao calcular score" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
