import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { websiteUrl, analysisData, userId } = await req.json();

    if (!websiteUrl || !userId) {
      return new Response(
        JSON.stringify({ error: "websiteUrl and userId are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log(`Generating ad campaign for URL: ${websiteUrl}`);

    // Build context from analysis data
    const analysisContext = analysisData ? `
Website Analysis Data:
- Overall Score: ${analysisData.overall_score || 'N/A'}/100
- SEO Score: ${analysisData.seo_score || 'N/A'}/100
- Speed Score: ${analysisData.speed_score || 'N/A'}/100
- Conversion Score: ${analysisData.conversion_score || 'N/A'}/100
- Recommendations: ${analysisData.recommendations || 'N/A'}
` : '';

    const systemPrompt = `Você é um especialista em marketing digital e criação de campanhas de anúncios para Meta Ads (Facebook e Instagram). 
Sua tarefa é analisar um website e criar uma campanha de anúncios completa e otimizada.

RESPONDA SEMPRE EM PORTUGUÊS DE PORTUGAL.

Retorne um JSON válido com a seguinte estrutura:
{
  "campaign_name": "Nome criativo da campanha",
  "headline": "Headline persuasivo (máximo 40 caracteres)",
  "copy_aida": {
    "attention": "Frase de atenção que para o scroll",
    "interest": "Desperte interesse com benefícios",
    "desire": "Crie desejo com prova social ou urgência",
    "action": "Call-to-action claro e direto"
  },
  "full_copy": "Copy completa do anúncio pronta para usar (máximo 125 palavras)",
  "ad_variations": [
    {
      "headline": "Variação 1 do headline",
      "copy": "Copy alternativa 1"
    },
    {
      "headline": "Variação 2 do headline", 
      "copy": "Copy alternativa 2"
    },
    {
      "headline": "Variação 3 do headline",
      "copy": "Copy alternativa 3"
    }
  ],
  "target_audience": {
    "interests": ["interesse1", "interesse2", "interesse3"],
    "age_min": 25,
    "age_max": 55,
    "gender": "all",
    "locations": ["Portugal"],
    "behaviors": ["comportamento1", "comportamento2"]
  },
  "recommended_objective": "REACH ou TRAFFIC ou CONVERSIONS",
  "recommended_daily_budget": 15,
  "estimated_reach": "5.000 - 15.000 pessoas/dia",
  "cta_type": "LEARN_MORE ou SHOP_NOW ou SIGN_UP ou CONTACT_US"
}`;

    const userPrompt = `Analise este website e crie uma campanha de anúncios Meta Ads completa:

URL do Website: ${websiteUrl}

${analysisContext}

Crie uma campanha persuasiva que:
1. Capture atenção nos primeiros 3 segundos
2. Use gatilhos mentais (escassez, prova social, autoridade)
3. Tenha um CTA claro e urgente
4. Seja otimizada para o objetivo recomendado

IMPORTANTE: Retorne APENAS o JSON, sem markdown ou texto adicional.`;

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
          { role: "user", content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "API credits depleted. Please add funds." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiData = await response.json();
    const aiContent = aiData.choices?.[0]?.message?.content;

    if (!aiContent) {
      throw new Error("No content returned from AI");
    }

    console.log("AI Response:", aiContent);

    // Parse AI response
    let campaignData;
    try {
      // Remove markdown code blocks if present
      const cleanedContent = aiContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      campaignData = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      // Fallback to default campaign data
      campaignData = {
        campaign_name: `Campanha - ${new URL(websiteUrl).hostname}`,
        headline: "Descubra a Solução Ideal",
        copy_aida: {
          attention: "🚀 Transforme o seu negócio hoje!",
          interest: "Milhares de clientes já descobriram como podemos ajudar.",
          desire: "Resultados comprovados em menos de 30 dias.",
          action: "Clique agora e saiba mais!"
        },
        full_copy: "🚀 Transforme o seu negócio hoje! Milhares de clientes já descobriram como podemos ajudar. Resultados comprovados em menos de 30 dias. Clique agora e saiba mais!",
        ad_variations: [
          { headline: "A Solução que Procurava", copy: "Descubra como podemos transformar o seu negócio." },
          { headline: "Resultados Garantidos", copy: "Junte-se a milhares de clientes satisfeitos." },
          { headline: "Oferta Limitada", copy: "Não perca esta oportunidade única!" }
        ],
        target_audience: {
          interests: ["Negócios", "Empreendedorismo", "Marketing Digital"],
          age_min: 25,
          age_max: 55,
          gender: "all",
          locations: ["Portugal"],
          behaviors: ["Compradores online", "Utilizadores de tecnologia"]
        },
        recommended_objective: "TRAFFIC",
        recommended_daily_budget: 15,
        estimated_reach: "5.000 - 15.000 pessoas/dia",
        cta_type: "LEARN_MORE"
      };
    }

    // Save campaign to database
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: savedCampaign, error: saveError } = await supabase
      .from("ad_campaigns")
      .insert({
        user_id: userId,
        name: campaignData.campaign_name,
        website_url: websiteUrl,
        source_analysis_id: analysisData?.id || null,
        ai_headline: campaignData.headline,
        ai_copy: campaignData.full_copy,
        ai_description: JSON.stringify(campaignData.copy_aida),
        ad_variations: campaignData.ad_variations,
        target_audience: campaignData.target_audience,
        daily_budget: campaignData.recommended_daily_budget,
        objective: campaignData.recommended_objective,
        status: "draft"
      })
      .select()
      .single();

    if (saveError) {
      console.error("Error saving campaign:", saveError);
      throw new Error("Failed to save campaign");
    }

    console.log("Campaign saved:", savedCampaign.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        campaign: {
          ...savedCampaign,
          ...campaignData
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error in generate-ad-campaign:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});