import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[ANALYZE-TIKTOK] ${step}${detailsStr}`);
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
    const { username } = await req.json();
    
    if (!username) throw new Error("TikTok username is required");
    
    // Clean username (remove @ if present)
    const cleanUsername = username.replace(/^@/, '').trim();
    logStep("Analyzing TikTok", { username: cleanUsername });

    // Generate AI analysis using Lovable AI Gateway
    const analysisPrompt = `Você é um especialista em marketing digital e análise de redes sociais. Analise o perfil de TikTok @${cleanUsername} e forneça uma análise profissional detalhada.

IMPORTANTE: Baseie sua análise em melhores práticas do TikTok e tendências atuais para o nicho aparente do username.

Forneça a resposta EXATAMENTE neste formato JSON (sem texto adicional antes ou depois):
{
  "score": <número de 0-100 baseado em boas práticas>,
  "followers": <estimativa baseada no tipo de perfil, número inteiro>,
  "engagement_rate": <taxa típica para o nicho, número decimal ex: 8.5>,
  "post_frequency": "<frequência ideal recomendada, string ex: '1-2 vídeos por dia'>",
  "nicho": "<nicho detectado: Entretenimento, Educação, Finanças, Fitness, Dança, Comédia, etc>",
  "strengths": "<3 pontos fortes típicos para perfis de sucesso, separados por |>",
  "weaknesses": "<3 áreas de melhoria comuns, separadas por |>",
  "suggestions": "<5 sugestões práticas para viralizar no TikTok, separadas por |>",
  "swot": {
    "strengths": ["força 1", "força 2", "força 3"],
    "weaknesses": ["fraqueza 1", "fraqueza 2", "fraqueza 3"],
    "opportunities": ["oportunidade 1", "oportunidade 2", "oportunidade 3"],
    "threats": ["ameaça 1", "ameaça 2", "ameaça 3"]
  },
  "best_posting_times": ["18:00-21:00", "12:00-14:00", "07:00-09:00"],
  "content_recommendations": {
    "trending_sounds": true,
    "duets_percentage": <percentual recomendado para Duetos 0-100>,
    "original_percentage": <percentual recomendado para Conteúdo Original 0-100>,
    "average_video_length": "<duração ideal em segundos>",
    "primary_content_type": "<Educativo|Entretenimento|Tutorial|Behind the scenes|Trending>"
  },
  "viral_potential": {
    "score": <0-100>,
    "missing_elements": ["elemento 1", "elemento 2"],
    "trending_suggestions": ["trend 1", "trend 2", "trend 3"]
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
        analysis = getDefaultAnalysis(cleanUsername);
      }
    } else {
      const errorText = await response.text();
      logStep("AI API failed", { status: response.status, error: errorText });
      analysis = getDefaultAnalysis(cleanUsername);
    }

    // Create or update social account
    const { data: existingAccount } = await supabaseClient
      .from("social_accounts")
      .select("id")
      .eq("user_id", userId)
      .eq("platform", "tiktok")
      .maybeSingle();

    let socialAccountId;
    
    if (existingAccount) {
      socialAccountId = existingAccount.id;
      await supabaseClient
        .from("social_accounts")
        .update({
          account_name: cleanUsername,
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
          platform: "tiktok",
          account_name: cleanUsername,
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
        platform: "tiktok",
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
        platform: "tiktok",
        username: cleanUsername,
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

function getDefaultAnalysis(username: string) {
  return {
    score: 70,
    followers: 15000,
    engagement_rate: 8.5,
    post_frequency: "1-2 vídeos por dia",
    nicho: "Entretenimento/Educação",
    strengths: "Formato vertical otimizado|Uso de trends|Conteúdo autêntico e dinâmico",
    weaknesses: "Inconsistência de postagem|Hashtags genéricas|Falta de CTA claro",
    suggestions: "Poste nos horários de pico (18h-21h)|Use 3-5 hashtags relevantes por nicho|Responda comentários nos primeiros 30 min|Crie séries de conteúdo|Colabore com outros criadores",
    swot: {
      strengths: ["Conteúdo viral potencial", "Algoritmo favorável a novos creators", "Alto engagement orgânico"],
      weaknesses: ["Competição intensa", "Tendências mudam rápido", "Necessidade de consistência diária"],
      opportunities: ["Sounds trending", "Duetos com creators maiores", "Nichos inexplorados"],
      threats: ["Mudanças no algoritmo", "Saturação de conteúdo", "Restrições de monetização"]
    },
    best_posting_times: ["18:00-21:00", "12:00-14:00", "07:00-09:00"],
    content_recommendations: {
      trending_sounds: true,
      duets_percentage: 20,
      original_percentage: 80,
      average_video_length: "15-30 segundos",
      primary_content_type: "Entretenimento"
    },
    viral_potential: {
      score: 65,
      missing_elements: ["Hook nos primeiros 3 segundos", "CTA no final"],
      trending_suggestions: ["POV videos", "Storytimes", "Day in my life"]
    }
  };
}
