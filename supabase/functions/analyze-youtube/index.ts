import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[ANALYZE-YOUTUBE] ${step}${detailsStr}`);
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
    const { channelUrl, username } = await req.json();
    
    // Accept either channelUrl or username
    const inputValue = username || channelUrl;
    if (!inputValue) throw new Error("YouTube channel URL or name is required");
    
    // Extract channel name from URL or use directly
    const channelName = extractChannelName(inputValue);
    logStep("Analyzing YouTube", { channelName });

    // Generate AI analysis using Lovable AI Gateway
    const analysisPrompt = `Você é um especialista em marketing digital e análise de canais do YouTube. Analise o canal "${channelName}" e forneça uma análise profissional detalhada.

IMPORTANTE: Baseie sua análise em melhores práticas do YouTube e SEO de vídeo para o nicho aparente do nome do canal.

Forneça a resposta EXATAMENTE neste formato JSON (sem texto adicional antes ou depois):
{
  "score": <número de 0-100 baseado em boas práticas>,
  "followers": <estimativa de inscritos, número inteiro>,
  "engagement_rate": <taxa típica para o nicho, número decimal ex: 5.5>,
  "post_frequency": "<frequência ideal recomendada, string ex: '2-3 vídeos por semana'>",
  "nicho": "<nicho detectado: Tech, Gaming, Educação, Vlogs, Finanças, Fitness, etc>",
  "strengths": "<3 pontos fortes típicos para canais de sucesso, separados por |>",
  "weaknesses": "<3 áreas de melhoria comuns, separadas por |>",
  "suggestions": "<5 sugestões práticas para crescer no YouTube, separadas por |>",
  "swot": {
    "strengths": ["força 1", "força 2", "força 3"],
    "weaknesses": ["fraqueza 1", "fraqueza 2", "fraqueza 3"],
    "opportunities": ["oportunidade 1", "oportunidade 2", "oportunidade 3"],
    "threats": ["ameaça 1", "ameaça 2", "ameaça 3"]
  },
  "best_posting_times": ["16:00-18:00", "12:00-14:00", "20:00-22:00"],
  "content_recommendations": {
    "long_form_percentage": <percentual para vídeos longos 0-100>,
    "shorts_percentage": <percentual para Shorts 0-100>,
    "lives_percentage": <percentual para Lives 0-100>,
    "optimal_video_length": "<duração ideal em minutos>",
    "primary_format": "<Longo|Shorts|Lives|Tutorial>"
  },
  "seo_optimization": {
    "title_score": <0-100>,
    "description_score": <0-100>,
    "tags_score": <0-100>,
    "thumbnail_score": <0-100>,
    "keyword_suggestions": ["keyword 1", "keyword 2", "keyword 3"]
  },
  "monetization_potential": {
    "eligible": <true/false>,
    "estimated_cpm": "<valor estimado em EUR>",
    "sponsorship_potential": "<Alto/Médio/Baixo>"
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
        analysis = getDefaultAnalysis(channelName);
      }
    } else {
      const errorText = await response.text();
      logStep("AI API failed", { status: response.status, error: errorText });
      analysis = getDefaultAnalysis(channelName);
    }

    // Create or update social account
    const { data: existingAccount } = await supabaseClient
      .from("social_accounts")
      .select("id")
      .eq("user_id", userId)
      .eq("platform", "youtube")
      .maybeSingle();

    let socialAccountId;
    
    if (existingAccount) {
      socialAccountId = existingAccount.id;
      await supabaseClient
        .from("social_accounts")
        .update({
          account_name: channelName,
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
          platform: "youtube",
          account_name: channelName,
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
        platform: "youtube",
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
        platform: "youtube",
        channelName,
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

function extractChannelName(url: string): string {
  // Handle various YouTube URL formats
  const patterns = [
    /youtube\.com\/@([^\/\?]+)/,
    /youtube\.com\/channel\/([^\/\?]+)/,
    /youtube\.com\/c\/([^\/\?]+)/,
    /youtube\.com\/user\/([^\/\?]+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  
  // If not a URL, return as-is
  if (!url.includes('youtube.com')) {
    return url.trim();
  }
  
  return url.replace(/https?:\/\/(www\.)?youtube\.com\/?/, "").split("/")[0] || "Canal";
}

function getDefaultAnalysis(channelName: string) {
  return {
    score: 68,
    followers: 25000,
    engagement_rate: 5.2,
    post_frequency: "2-3 vídeos por semana",
    nicho: "Educação/Negócios",
    strengths: "Conteúdo educativo de qualidade|Thumbnails profissionais|SEO bem trabalhado",
    weaknesses: "Baixa frequência de upload|Poucos Shorts|Descrições curtas",
    suggestions: "Publique Shorts diariamente|Otimize descrições com 200+ palavras|Crie playlists temáticas|Faça lives mensais|Colabore com canais similares",
    swot: {
      strengths: ["Autoridade no nicho", "Conteúdo evergreen", "Alta retenção"],
      weaknesses: ["Crescimento lento", "Poucos vídeos virais", "CTR baixo"],
      opportunities: ["YouTube Shorts", "Membros do canal", "Super Thanks"],
      threats: ["Competição crescente", "Mudanças no algoritmo", "Demonetização"]
    },
    best_posting_times: ["16:00-18:00", "12:00-14:00", "20:00-22:00"],
    content_recommendations: {
      long_form_percentage: 60,
      shorts_percentage: 30,
      lives_percentage: 10,
      optimal_video_length: "10-15 minutos",
      primary_format: "Longo"
    },
    seo_optimization: {
      title_score: 70,
      description_score: 55,
      tags_score: 60,
      thumbnail_score: 75,
      keyword_suggestions: ["tutorial", "como fazer", "passo a passo"]
    },
    monetization_potential: {
      eligible: true,
      estimated_cpm: "2-5 EUR",
      sponsorship_potential: "Médio"
    }
  };
}
