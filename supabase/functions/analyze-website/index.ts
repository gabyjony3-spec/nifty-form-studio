import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Generate a consistent hash for URL caching
function hashUrl(url: string): string {
  // Normalize URL: remove trailing slashes, lowercase
  const normalized = url.toLowerCase().replace(/\/+$/, '').replace(/^https?:\/\//, '');
  // Simple hash using charCodeAt
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return `url_${Math.abs(hash).toString(16)}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url: websiteUrl, force_refresh = false } = await req.json();
    console.log("Analyzing website:", websiteUrl, "Force refresh:", force_refresh);

    if (!websiteUrl) {
      throw new Error("URL do website é obrigatória");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Autenticação necessária");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      throw new Error("Usuário não autenticado");
    }

    const urlHash = hashUrl(websiteUrl);

    // Check cache (24 hours) unless force_refresh is true
    if (!force_refresh) {
      const { data: cachedResult } = await supabase
        .from("audit_cache")
        .select("*")
        .eq("url_hash", urlHash)
        .gt("expires_at", new Date().toISOString())
        .maybeSingle();

      if (cachedResult) {
        console.log("Returning cached result for:", websiteUrl);
        
        // Save to user's analysis history with cached data
        const { data: savedAnalysis, error: saveError } = await supabase
          .from("website_analysis")
          .insert({
            user_id: user.id,
            url: websiteUrl,
            seo_score: cachedResult.seo_score,
            speed_score: cachedResult.speed_score,
            structure_score: cachedResult.structure_score,
            conversion_score: cachedResult.conversion_score,
            copywriting_score: cachedResult.copywriting_score,
            overall_score: cachedResult.overall_score,
            recommendations: cachedResult.full_report?.action_items?.map((item: any) => item.action).join("\n• ") || "",
            full_report: cachedResult.full_report,
          })
          .select()
          .single();

        if (saveError) {
          console.error("Error saving cached analysis:", saveError);
          throw new Error("Erro ao salvar análise");
        }

        return new Response(JSON.stringify({ ...savedAnalysis, fromCache: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Fetch website content
    const websiteResponse = await fetch(websiteUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; WebsiteAnalyzer/1.0)",
      },
    });

    if (!websiteResponse.ok) {
      throw new Error(`Não foi possível acessar o website: ${websiteResponse.statusText}`);
    }

    const htmlContent = await websiteResponse.text();
    
    // Extract basic info (first 8000 chars to get more context)
    const contentPreview = htmlContent.substring(0, 8000);

    // Call Lovable AI for analysis
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY não configurada");
    }

    const systemPrompt = `Você é um consultor sênior de marketing digital e estratégia de negócios.
Analise websites como se estivesse apresentando um relatório executivo para um CEO.
Seu objetivo é fornecer insights acionáveis, não apenas dados técnicos.
Responda sempre em português brasileiro.
Seja específico e prático nas recomendações.
IMPORTANTE: Seja consistente nas avaliações. Sites com problemas graves devem ter scores baixos (20-40), sites medianos (50-70), sites bons (75-90).`;

    const userPrompt = `Analise o website ${websiteUrl} como um consultor estratégico.

HTML do site:
${contentPreview}

ESTRUTURA DO RELATÓRIO (responda em JSON válido):

{
  "vision_overview": "Resumo executivo de 2-3 frases sobre a proposta de valor do site, posicionamento no mercado e primeira impressão como potencial cliente",
  
  "strengths": [
    {"title": "Título do ponto forte", "description": "Descrição detalhada do que o site faz bem"}
  ],
  
  "opportunities": [
    {"title": "Título da oportunidade", "description": "Como pode melhorar", "impact": "alto|médio|baixo"}
  ],
  
  "critical_alerts": [
    {"title": "Título do alerta", "description": "Problema e impacto", "urgency": "urgente|importante"}
  ],
  
  "traffic_estimate": {
    "domain_authority": "baixa|média|alta",
    "monthly_potential": "Estimativa de visitantes mensais (ex: 1.000-5.000)",
    "insight": "Insight sobre o potencial de crescimento do site"
  },
  
  "action_items": [
    {"action": "Descrição da ação específica", "category": "SEO|Conversão|Velocidade|Copywriting|Estrutura", "impact": "alto|médio|baixo", "difficulty": "fácil|médio|difícil"}
  ],
  
  "seo_score": 0-100,
  "speed_score": 0-100,
  "structure_score": 0-100,
  "conversion_score": 0-100,
  "copywriting_score": 0-100,
  "overall_score": 0-100
}

INSTRUÇÕES:
- Forneça 3-5 itens em strengths, opportunities e critical_alerts
- Forneça 5-7 action_items priorizados por impacto
- Seja específico e acionável nas recomendações
- Avalie criticamente, não apenas elogie
- Os scores devem ser CONSISTENTES: se há problemas graves, o score deve refletir isso (baixo)
- O overall_score deve ser a média ponderada dos outros scores
- Retorne APENAS o JSON, sem texto adicional ou markdown`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
      }),
    });

    if (aiResponse.status === 429) {
      throw new Error("Limite de requisições excedido. Tente novamente mais tarde.");
    }

    if (aiResponse.status === 402) {
      throw new Error("Créditos insuficientes. Adicione créditos no workspace.");
    }

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI Gateway error:", aiResponse.status, errorText);
      throw new Error("Erro ao processar análise com IA");
    }

    const aiData = await aiResponse.json();
    console.log("AI Response received");

    let analysisResult;
    try {
      const content = aiData.choices[0].message.content;
      // Try to extract JSON from markdown code blocks or raw content
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || 
                       content.match(/```\n([\s\S]*?)\n```/) ||
                       content.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
      analysisResult = JSON.parse(jsonStr.trim());
    } catch (e) {
      console.error("Error parsing AI response:", e);
      console.error("Raw content:", aiData.choices[0].message.content);
      throw new Error("Erro ao processar resposta da IA");
    }

    // Save to cache for 24 hours
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    
    await supabase
      .from("audit_cache")
      .upsert({
        url: websiteUrl,
        url_hash: urlHash,
        seo_score: analysisResult.seo_score,
        speed_score: analysisResult.speed_score,
        structure_score: analysisResult.structure_score,
        conversion_score: analysisResult.conversion_score,
        copywriting_score: analysisResult.copywriting_score,
        overall_score: analysisResult.overall_score,
        full_report: {
          vision_overview: analysisResult.vision_overview,
          strengths: analysisResult.strengths,
          opportunities: analysisResult.opportunities,
          critical_alerts: analysisResult.critical_alerts,
          traffic_estimate: analysisResult.traffic_estimate,
          action_items: analysisResult.action_items,
        },
        cached_at: new Date().toISOString(),
        expires_at: expiresAt,
      }, { onConflict: 'url_hash' });

    console.log("Analysis cached for:", websiteUrl);

    // Save to user's analysis history
    const { data: savedAnalysis, error: saveError } = await supabase
      .from("website_analysis")
      .insert({
        user_id: user.id,
        url: websiteUrl,
        seo_score: analysisResult.seo_score,
        speed_score: analysisResult.speed_score,
        structure_score: analysisResult.structure_score,
        conversion_score: analysisResult.conversion_score,
        copywriting_score: analysisResult.copywriting_score,
        overall_score: analysisResult.overall_score,
        recommendations: analysisResult.action_items?.map((item: any) => item.action).join("\n• ") || "",
        full_report: {
          vision_overview: analysisResult.vision_overview,
          strengths: analysisResult.strengths,
          opportunities: analysisResult.opportunities,
          critical_alerts: analysisResult.critical_alerts,
          traffic_estimate: analysisResult.traffic_estimate,
          action_items: analysisResult.action_items,
        },
      })
      .select()
      .single();

    if (saveError) {
      console.error("Error saving analysis:", saveError);
      throw new Error("Erro ao salvar análise");
    }

    console.log("Analysis saved successfully:", savedAnalysis.id);

    return new Response(JSON.stringify({ ...savedAnalysis, fromCache: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in analyze-website:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erro ao analisar website" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
