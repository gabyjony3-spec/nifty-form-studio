import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[ANALYZE-LINKEDIN] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user) throw new Error("User not authenticated");

    const userId = userData.user.id;
    const { profileUrl, username } = await req.json();
    
    // Accept either profileUrl or username
    const inputValue = username || profileUrl;
    if (!inputValue) throw new Error("LinkedIn profile URL or username is required");
    
    // Extract profile name from URL or use directly
    const profileName = extractProfileName(inputValue);
    logStep("Analyzing LinkedIn", { profileName });

    // Generate AI analysis using Lovable AI Gateway
    const analysisPrompt = `Você é um especialista em marketing digital e análise de redes sociais profissionais. Analise o perfil de LinkedIn "${profileName}" e forneça uma análise profissional detalhada.

IMPORTANTE: Baseie sua análise em melhores práticas do LinkedIn para profissionais e o nicho aparente do nome/cargo.

Forneça a resposta EXATAMENTE neste formato JSON (sem texto adicional antes ou depois):
{
  "score": <número de 0-100 baseado em boas práticas>,
  "followers": <estimativa baseada no tipo de perfil, número inteiro>,
  "engagement_rate": <taxa típica para o nicho, número decimal ex: 4.5>,
  "post_frequency": "<frequência ideal recomendada, string ex: '3-5 posts por semana'>",
  "nicho": "<nicho detectado: Executivo, Coach, Mentor, Tech, RH, Vendas, Marketing, etc>",
  "strengths": "<3 pontos fortes típicos para perfis de sucesso, separados por |>",
  "weaknesses": "<3 áreas de melhoria comuns, separadas por |>",
  "suggestions": "<5 sugestões práticas para crescimento no LinkedIn, separadas por |>",
  "swot": {
    "strengths": ["força 1", "força 2", "força 3"],
    "weaknesses": ["fraqueza 1", "fraqueza 2", "fraqueza 3"],
    "opportunities": ["oportunidade 1", "oportunidade 2", "oportunidade 3"],
    "threats": ["ameaça 1", "ameaça 2", "ameaça 3"]
  },
  "best_posting_times": ["08:00-09:00", "12:00-13:00", "17:00-18:00"],
  "content_recommendations": {
    "text_posts_percentage": <percentual recomendado para Posts de texto 0-100>,
    "articles_percentage": <percentual recomendado para Artigos 0-100>,
    "carousel_percentage": <percentual recomendado para Carrosséis 0-100>,
    "video_percentage": <percentual recomendado para Vídeos 0-100>,
    "primary_format": "<Texto|Carrossel|Vídeo|Artigo>"
  },
  "profile_optimization": {
    "headline_score": <0-100>,
    "about_score": <0-100>,
    "experience_score": <0-100>,
    "recommendations_needed": <número de recomendações sugeridas>
  }
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: analysisPrompt }]
      })
    });

    let analysis;
    
    if (response.ok) {
      const aiResponse = await response.json();
      const content = aiResponse.choices?.[0]?.message?.content || "";
      logStep("AI response received", { contentLength: content.length });
      
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          analysis = JSON.parse(jsonMatch[0]);
          logStep("AI analysis parsed successfully");
        } else {
          throw new Error("No JSON found in response");
        }
      } catch (parseError: unknown) {
        const errorMsg = parseError instanceof Error ? parseError.message : String(parseError);
        logStep("Failed to parse AI response, using defaults", { error: errorMsg });
        analysis = getDefaultAnalysis(profileName);
      }
    } else {
      const errorText = await response.text();
      logStep("AI API failed", { status: response.status, error: errorText });
      analysis = getDefaultAnalysis(profileName);
    }

    // Create or update social account
    const { data: existingAccount } = await supabaseClient
      .from("social_accounts")
      .select("id")
      .eq("user_id", userId)
      .eq("platform", "linkedin")
      .maybeSingle();

    let socialAccountId;
    
    if (existingAccount) {
      socialAccountId = existingAccount.id;
      await supabaseClient
        .from("social_accounts")
        .update({
          account_name: profileName,
          followers_count: analysis.followers,
          is_connected: true,
          connected_at: new Date().toISOString()
        })
        .eq("id", socialAccountId);
    } else {
      const { data: newAccount } = await supabaseClient
        .from("social_accounts")
        .insert({
          user_id: userId,
          platform: "linkedin",
          account_name: profileName,
          followers_count: analysis.followers,
          is_connected: true
        })
        .select("id")
        .single();
      
      socialAccountId = newAccount?.id;
    }

    // Save analysis
    await supabaseClient
      .from("social_media_analysis")
      .insert({
        user_id: userId,
        social_account_id: socialAccountId,
        platform: "linkedin",
        score: analysis.score,
        followers: analysis.followers,
        engagement_rate: analysis.engagement_rate,
        post_frequency: analysis.post_frequency,
        strengths: analysis.strengths,
        weaknesses: analysis.weaknesses,
        suggestions: analysis.suggestions
      });

    logStep("Analysis saved successfully");

    return new Response(JSON.stringify({
      success: true,
      analysis: {
        platform: "linkedin",
        profileName,
        ...analysis
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

function extractProfileName(url: string): string {
  const match = url.match(/linkedin\.com\/in\/([^\/\?]+)/);
  return match ? match[1].replace(/-/g, " ") : url.trim();
}

function getDefaultAnalysis(profileName: string) {
  return {
    score: 75,
    followers: 3500,
    engagement_rate: 4.2,
    post_frequency: "3-5 posts por semana",
    nicho: "Executivo/Negócios",
    strengths: "Perfil profissional completo|Networking ativo|Conteúdo de valor",
    weaknesses: "Poucas recomendações|Headline genérica|Falta de artigos longos",
    suggestions: "Peça recomendações aos colegas|Otimize sua headline com palavras-chave|Publique artigos mensais|Comente em posts de influenciadores|Use carrosséis para mais engagement",
    swot: {
      strengths: ["Rede de conexões", "Experiência comprovada", "Conteúdo educativo"],
      weaknesses: ["Pouca visibilidade", "Perfil incompleto", "Baixa frequência"],
      opportunities: ["Creator Mode", "LinkedIn Newsletter", "Eventos virtuais"],
      threats: ["Saturação de conteúdo", "Algoritmo em mudança", "Concorrência de thought leaders"]
    },
    best_posting_times: ["08:00-09:00", "12:00-13:00", "17:00-18:00"],
    content_recommendations: {
      text_posts_percentage: 40,
      articles_percentage: 15,
      carousel_percentage: 30,
      video_percentage: 15,
      primary_format: "Texto"
    },
    profile_optimization: {
      headline_score: 65,
      about_score: 70,
      experience_score: 80,
      recommendations_needed: 5
    }
  };
}
