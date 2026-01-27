import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SocialAnalysisResult {
  platform: string;
  username: string;
  score: number;
  breakdown: {
    bio: number;
    visual: number;
    engagement: number;
    consistency: number;
  };
  followers: number;
  engagement_rate: number;
  post_frequency: string;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  niche_detected: string;
  best_posting_times: { hour: number; label: string; score: number }[];
  from_cache?: boolean;
  analysis_count?: number;
  next_analysis_available?: string;
  bio_analysis?: {
    has_cta: boolean;
    has_niche_keywords: boolean;
    suggested_bio: string;
    current_issues: string[];
  };
  photo_analysis?: {
    framing: number;
    background: number;
    lighting: number;
    expression: number;
    overall_score: number;
    suggestions: string[];
  };
  content_suggestions?: {
    type: string;
    description: string;
    frequency: string;
  }[];
  highlight_suggestions?: string[];
}

// Create hash for cache key
function createHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

function detectPlatform(url: string): { platform: string; username: string } | null {
  let cleanUrl = url.trim();
  const urlLower = cleanUrl.toLowerCase();
  
  if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
    if (cleanUrl.includes('.com') || cleanUrl.includes('.tv') || cleanUrl.includes('.app')) {
      cleanUrl = 'https://' + cleanUrl;
    }
  }
  
  // Instagram
  const instaPatterns = [
    /(?:https?:\/\/)?(?:www\.)?instagram\.com\/(?:@)?([a-zA-Z0-9._]+)\/?/i,
    /(?:https?:\/\/)?(?:www\.)?instagr\.am\/([a-zA-Z0-9._]+)\/?/i,
  ];
  for (const pattern of instaPatterns) {
    const match = cleanUrl.match(pattern);
    if (match && match[1] && !['p', 'reel', 'reels', 'stories', 'explore', 'accounts'].includes(match[1].toLowerCase())) {
      return { platform: 'instagram', username: match[1].replace('@', '') };
    }
  }
  
  // YouTube
  const ytPatterns = [
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/@([a-zA-Z0-9_-]+)\/?/i,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/(?:c|channel|user)\/([a-zA-Z0-9_-]+)\/?/i,
    /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([a-zA-Z0-9_-]+)\/?/i,
  ];
  for (const pattern of ytPatterns) {
    const match = cleanUrl.match(pattern);
    if (match && match[1] && !['watch', 'playlist', 'results', 'feed'].includes(match[1].toLowerCase())) {
      return { platform: 'youtube', username: match[1].replace('@', '') };
    }
  }
  
  // TikTok
  const tiktokPatterns = [
    /(?:https?:\/\/)?(?:www\.)?tiktok\.com\/@([a-zA-Z0-9._]+)\/?/i,
    /(?:https?:\/\/)?(?:www\.)?tiktok\.com\/([a-zA-Z0-9._]+)\/?/i,
    /(?:https?:\/\/)?vm\.tiktok\.com\/([a-zA-Z0-9]+)\/?/i,
  ];
  for (const pattern of tiktokPatterns) {
    const match = cleanUrl.match(pattern);
    if (match && match[1] && !['explore', 'foryou', 'discover', 'live'].includes(match[1].toLowerCase())) {
      return { platform: 'tiktok', username: match[1].replace('@', '') };
    }
  }
  
  // LinkedIn
  const linkedinPatterns = [
    /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/([a-zA-Z0-9_-]+)\/?/i,
    /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/company\/([a-zA-Z0-9_-]+)\/?/i,
  ];
  for (const pattern of linkedinPatterns) {
    const match = cleanUrl.match(pattern);
    if (match && match[1]) {
      return { platform: 'linkedin', username: match[1] };
    }
  }
  
  // Facebook
  const fbPatterns = [
    /(?:https?:\/\/)?(?:www\.)?facebook\.com\/(?:profile\.php\?id=)?([a-zA-Z0-9._-]+)\/?/i,
    /(?:https?:\/\/)?(?:www\.)?fb\.com\/([a-zA-Z0-9._-]+)\/?/i,
    /(?:https?:\/\/)?(?:www\.)?facebook\.com\/people\/[^\/]+\/(\d+)\/?/i,
  ];
  for (const pattern of fbPatterns) {
    const match = cleanUrl.match(pattern);
    if (match && match[1] && !['watch', 'groups', 'events', 'marketplace', 'gaming', 'pages'].includes(match[1].toLowerCase())) {
      return { platform: 'facebook', username: match[1] };
    }
  }
  
  // Twitter/X
  const twitterPatterns = [
    /(?:https?:\/\/)?(?:www\.)?(?:twitter|x)\.com\/([a-zA-Z0-9_]+)\/?/i,
  ];
  for (const pattern of twitterPatterns) {
    const match = cleanUrl.match(pattern);
    if (match && match[1] && !['home', 'explore', 'search', 'settings', 'i'].includes(match[1].toLowerCase())) {
      return { platform: 'twitter', username: match[1] };
    }
  }
  
  // Fallback detection
  if (urlLower.includes('instagram') || urlLower.includes('insta')) {
    const usernameMatch = cleanUrl.match(/([a-zA-Z0-9._]{1,30})/);
    if (usernameMatch) return { platform: 'instagram', username: usernameMatch[1] };
  }
  
  if (urlLower.includes('youtube') || urlLower.includes('yt')) {
    const usernameMatch = cleanUrl.match(/([a-zA-Z0-9_-]{1,50})/);
    if (usernameMatch) return { platform: 'youtube', username: usernameMatch[1] };
  }
  
  if (urlLower.includes('tiktok') || urlLower.includes('tt')) {
    const usernameMatch = cleanUrl.match(/([a-zA-Z0-9._]{1,30})/);
    if (usernameMatch) return { platform: 'tiktok', username: usernameMatch[1] };
  }
  
  console.log(`[detectPlatform] Could not match URL: "${cleanUrl}"`);
  return null;
}

async function analyzeWithAI(platform: string, username: string, seed: number): Promise<SocialAnalysisResult> {
  const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
  
  if (!lovableApiKey) {
    throw new Error("LOVABLE_API_KEY not configured");
  }
  
  const prompt = `Você é um especialista em marketing digital e análise de redes sociais. Analise o perfil "${username}" no ${platform}.

Como você não tem acesso direto à API do ${platform}, faça uma análise baseada em padrões comuns para perfis deste tipo de plataforma e username.

IMPORTANTE: Forneça uma análise REALISTA e CONSISTENTE. Não varie muito entre chamadas para o mesmo perfil.

Retorne APENAS um JSON válido com esta estrutura exata:
{
  "score": <número de 0 a 100 - seja realista, a maioria dos perfis fica entre 45-75>,
  "breakdown": {
    "bio": <0-20 pontos: CTA clara +10, palavra-chave do nicho +10>,
    "visual": <0-20 pontos: foto profissional +10, consistência visual +10>,
    "engagement": <0-30 pontos: taxa de engajamento proporcional>,
    "consistency": <0-30 pontos: 1 ponto por dia ativo nos últimos 30 dias>
  },
  "followers": <número estimado de seguidores - seja realista baseado no tipo de perfil>,
  "engagement_rate": <taxa de engajamento estimada em percentagem - típico é 1-5%>,
  "post_frequency": "<frequência de posts ex: '3x por semana'>",
  "strengths": ["força 1 específica", "força 2 específica", "força 3 específica"],
  "weaknesses": ["fraqueza 1 específica e acionável", "fraqueza 2 específica e acionável", "fraqueza 3 específica e acionável"],
  "suggestions": ["sugestão 1 prática", "sugestão 2 prática", "sugestão 3 prática"],
  "niche_detected": "<nicho detectado ex: 'Mentoria de Negócios'>",
  "best_posting_times": [
    {"hour": 9, "label": "9h", "score": 85},
    {"hour": 12, "label": "12h", "score": 75},
    {"hour": 18, "label": "18h", "score": 90},
    {"hour": 20, "label": "20h", "score": 95},
    {"hour": 21, "label": "21h", "score": 80}
  ],
  "bio_analysis": {
    "has_cta": <true/false - se a bio tem call to action>,
    "has_niche_keywords": <true/false - se tem palavras-chave do nicho>,
    "suggested_bio": "<bio otimizada de 150 caracteres com emoji, nicho e CTA>",
    "current_issues": ["problema 1 da bio atual", "problema 2 da bio atual"]
  },
  "photo_analysis": {
    "framing": <0-20 pontos: enquadramento do rosto e composição>,
    "background": <0-20 pontos: fundo profissional e limpo>,
    "lighting": <0-20 pontos: iluminação adequada>,
    "expression": <0-20 pontos: expressão que transmite autoridade e confiança>,
    "overall_score": <0-100 média das 4 categorias>,
    "suggestions": ["sugestão 1 para melhorar foto", "sugestão 2 para melhorar foto"]
  },
  "content_suggestions": [
    {"type": "Reels de FAQ", "description": "Responda as perguntas mais comuns", "frequency": "2x por semana"},
    {"type": "Carrossel Tutorial", "description": "Ensine um conceito em 5-7 slides", "frequency": "1x por semana"},
    {"type": "Stories Bastidores", "description": "Mostre o dia-a-dia autêntico", "frequency": "Diário"}
  ],
  "highlight_suggestions": ["Destaque 1", "Destaque 2", "Destaque 3", "Destaque 4", "Destaque 5"]
}

Seed para consistência: ${seed}

IMPORTANTE: Retorne APENAS o JSON, sem markdown, sem explicações.`;

  console.log(`[analyze-social] Calling AI for ${platform}/${username} with seed ${seed}`);

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${lovableApiKey}`,
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: "Você é um analisador de perfis de redes sociais profissional. Responda apenas com JSON válido. Seja consistente e realista nas suas análises." },
        { role: "user", content: prompt }
      ],
      temperature: 0.3, // Lower temperature for more consistent results
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[analyze-social] AI API error: ${errorText}`);
    throw new Error(`AI API error: ${response.status}`);
  }

  const aiData = await response.json();
  const content = aiData.choices?.[0]?.message?.content || "";
  
  console.log(`[analyze-social] AI response received, parsing...`);

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
    
    // Generate photo analysis from parsed or create realistic defaults
    const photoAnalysis = parsed.photo_analysis || {
      framing: 12 + (seed % 8),
      background: 10 + (seed % 10),
      lighting: 11 + (seed % 9),
      expression: 13 + (seed % 7),
      overall_score: 0,
      suggestions: ["Melhore a iluminação do rosto", "Use um fundo mais neutro"]
    };
    
    // Calculate overall score if not provided
    if (!photoAnalysis.overall_score || photoAnalysis.overall_score === 0) {
      photoAnalysis.overall_score = Math.round(
        ((photoAnalysis.framing + photoAnalysis.background + photoAnalysis.lighting + photoAnalysis.expression) / 80) * 100
      );
    }
    
    return {
      platform,
      username,
      score: parsed.score || 65,
      breakdown: {
        bio: parsed.breakdown?.bio || 12,
        visual: parsed.breakdown?.visual || 14,
        engagement: parsed.breakdown?.engagement || 18,
        consistency: parsed.breakdown?.consistency || 21,
      },
      followers: parsed.followers || 1000,
      engagement_rate: parsed.engagement_rate || 3.5,
      post_frequency: parsed.post_frequency || "3x por semana",
      strengths: parsed.strengths || ["Presença ativa", "Conteúdo relevante"],
      weaknesses: parsed.weaknesses || ["Bio pode melhorar", "Inconsistência de horários"],
      suggestions: parsed.suggestions || ["Otimize a bio", "Poste nos horários de pico"],
      niche_detected: parsed.niche_detected || "Marketing Digital",
      best_posting_times: parsed.best_posting_times || [
        { hour: 9, label: "9h", score: 75 },
        { hour: 18, label: "18h", score: 90 },
        { hour: 20, label: "20h", score: 95 },
      ],
      bio_analysis: parsed.bio_analysis || {
        has_cta: false,
        has_niche_keywords: false,
        suggested_bio: `${parsed.niche_detected || "Expert"} | Transformo seguidores em clientes | Clique no link ↓`,
        current_issues: ["Falta CTA clara", "Palavras-chave do nicho ausentes"]
      },
      photo_analysis: photoAnalysis,
      content_suggestions: parsed.content_suggestions || [
        { type: "Reels de FAQ", description: "Responda perguntas comuns", frequency: "2x por semana" },
        { type: "Carrossel Tutorial", description: "Ensine conceitos em slides", frequency: "1x por semana" },
        { type: "Stories Bastidores", description: "Mostre o dia-a-dia", frequency: "Diário" }
      ],
      highlight_suggestions: parsed.highlight_suggestions || ["Comece Aqui", "Sobre Mim", "Resultados", "Serviços", "Contato"]
    };
  } catch (parseError) {
    console.error(`[analyze-social] Parse error:`, parseError);
    
    // Generate consistent fallback based on seed
    const photoScore = {
      framing: 12 + (seed % 8),
      background: 10 + (seed % 10),
      lighting: 11 + (seed % 9),
      expression: 13 + (seed % 7),
      overall_score: 0,
      suggestions: ["Melhore a iluminação do rosto", "Use um fundo mais neutro"]
    };
    photoScore.overall_score = Math.round(
      ((photoScore.framing + photoScore.background + photoScore.lighting + photoScore.expression) / 80) * 100
    );
    
    return {
      platform,
      username,
      score: 55 + (seed % 20),
      breakdown: { bio: 10 + (seed % 10), visual: 12 + (seed % 8), engagement: 15 + (seed % 15), consistency: 18 + (seed % 12) },
      followers: 500 + (seed % 2000),
      engagement_rate: 2.5 + (seed % 30) / 10,
      post_frequency: "3x por semana",
      strengths: ["Perfil encontrado", "Plataforma ativa"],
      weaknesses: ["Análise limitada sem dados reais"],
      suggestions: ["Continue a criar conteúdo consistente"],
      niche_detected: "Marketing Digital",
      best_posting_times: [
        { hour: 9, label: "9h", score: 75 },
        { hour: 18, label: "18h", score: 90 },
        { hour: 20, label: "20h", score: 95 },
      ],
      bio_analysis: {
        has_cta: false,
        has_niche_keywords: false,
        suggested_bio: "Expert Digital | Transformo seguidores em clientes | Clique no link ↓",
        current_issues: []
      },
      photo_analysis: photoScore,
      content_suggestions: [
        { type: "Reels de FAQ", description: "Responda perguntas comuns", frequency: "2x por semana" }
      ],
      highlight_suggestions: ["Comece Aqui", "Sobre Mim", "Resultados", "Serviços", "Contato"]
    };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { url } = await req.json();

    if (!url) {
      console.error("[analyze-social] Missing URL parameter");
      return new Response(
        JSON.stringify({ error: "URL é obrigatória" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[analyze-social] Analyzing URL: ${url}`);

    // Detect platform and extract username
    const detected = detectPlatform(url);
    
    if (!detected) {
      console.error(`[analyze-social] Could not detect platform from URL: ${url}`);
      return new Response(
        JSON.stringify({ 
          error: "Plataforma não reconhecida. Use links do Instagram, YouTube, TikTok, LinkedIn ou Facebook." 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[analyze-social] Detected: ${detected.platform} / ${detected.username}`);

    // Create cache key
    const cacheKey = `${detected.platform}_${detected.username.toLowerCase()}`;
    const urlHash = createHash(cacheKey);
    
    // Create seed for consistent AI results
    const seed = parseInt(urlHash.substring(0, 8), 16) % 1000000;

    console.log(`[analyze-social] Cache key: ${urlHash}, Seed: ${seed}`);

    // Check cache
    const { data: cacheData, error: cacheError } = await supabase
      .from("social_analysis_cache")
      .select("*")
      .eq("url_hash", urlHash)
      .maybeSingle();

    if (cacheError) {
      console.error("[analyze-social] Cache lookup error:", cacheError);
    }

    const now = new Date();

    // If cache exists and valid
    if (cacheData) {
      const expiresAt = new Date(cacheData.expires_at);
      const analysisCount = cacheData.analysis_count || 1;

      console.log(`[analyze-social] Cache found. Count: ${analysisCount}, Expires: ${expiresAt}`);

      // If cache not expired AND already has 2+ analyses, return cached result
      if (expiresAt > now && analysisCount >= 2) {
        console.log(`[analyze-social] Returning cached result (limit reached)`);
        
        const hoursRemaining = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60));
        
        const cachedResult: SocialAnalysisResult = {
          platform: cacheData.platform,
          username: cacheData.username,
          score: cacheData.score,
          breakdown: cacheData.breakdown as any,
          followers: cacheData.followers,
          engagement_rate: parseFloat(cacheData.engagement_rate) || 0,
          post_frequency: cacheData.post_frequency || "3x por semana",
          strengths: cacheData.strengths ? cacheData.strengths.split("|||") : [],
          weaknesses: cacheData.weaknesses ? cacheData.weaknesses.split("|||") : [],
          suggestions: cacheData.suggestions ? cacheData.suggestions.split("|||") : [],
          niche_detected: cacheData.niche_detected || "Marketing Digital",
          best_posting_times: cacheData.best_posting_times as any || [],
          from_cache: true,
          analysis_count: analysisCount,
          next_analysis_available: `${hoursRemaining}h`
        };

        return new Response(
          JSON.stringify(cachedResult),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // If cache exists but count < 2, allow "rectification" (new analysis)
      if (analysisCount < 2) {
        console.log(`[analyze-social] Allowing rectification analysis (count: ${analysisCount})`);
        
        const result = await analyzeWithAI(detected.platform, detected.username, seed);

        // Update cache with incremented count
        const { error: updateError } = await supabase
          .from("social_analysis_cache")
          .update({
            score: result.score,
            breakdown: result.breakdown,
            followers: result.followers,
            engagement_rate: result.engagement_rate,
            post_frequency: result.post_frequency,
            strengths: result.strengths.join("|||"),
            weaknesses: result.weaknesses.join("|||"),
            suggestions: result.suggestions.join("|||"),
            niche_detected: result.niche_detected,
            best_posting_times: result.best_posting_times,
            analysis_count: analysisCount + 1,
            cached_at: now.toISOString(),
          })
          .eq("url_hash", urlHash);

        if (updateError) {
          console.error("[analyze-social] Cache update error:", updateError);
        }

        result.analysis_count = analysisCount + 1;
        console.log(`[analyze-social] Rectification analysis complete. Score: ${result.score}`);

        return new Response(
          JSON.stringify(result),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // No cache or expired - perform new analysis
    console.log(`[analyze-social] Performing new analysis...`);
    
    const result = await analyzeWithAI(detected.platform, detected.username, seed);

    // Calculate expiration (24 hours from now)
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Insert or update cache
    const cacheRecord = {
      platform: detected.platform,
      username: detected.username,
      url_hash: urlHash,
      score: result.score,
      breakdown: result.breakdown,
      followers: result.followers,
      engagement_rate: result.engagement_rate,
      post_frequency: result.post_frequency,
      strengths: result.strengths.join("|||"),
      weaknesses: result.weaknesses.join("|||"),
      suggestions: result.suggestions.join("|||"),
      niche_detected: result.niche_detected,
      best_posting_times: result.best_posting_times,
      analysis_count: 1,
      cached_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
    };

    if (cacheData) {
      // Update existing (expired) cache
      const { error: updateError } = await supabase
        .from("social_analysis_cache")
        .update(cacheRecord)
        .eq("url_hash", urlHash);

      if (updateError) {
        console.error("[analyze-social] Cache update error:", updateError);
      }
    } else {
      // Insert new cache
      const { error: insertError } = await supabase
        .from("social_analysis_cache")
        .insert(cacheRecord);

      if (insertError) {
        console.error("[analyze-social] Cache insert error:", insertError);
      }
    }

    result.analysis_count = 1;
    console.log(`[analyze-social] New analysis complete. Score: ${result.score}`);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error("[analyze-social] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erro interno ao analisar perfil" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
