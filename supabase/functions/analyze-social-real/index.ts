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
  following_count?: number;
  posts_count?: number;
  engagement_rate: number;
  post_frequency: string;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  niche_detected: string;
  best_posting_times: { hour: number; label: string; score: number }[];
  bio_analysis?: {
    has_cta: boolean;
    has_niche_keywords: boolean;
    suggested_bio: string;
    current_issues: string[];
    actual_bio?: string;
  };
  photo_analysis?: {
    framing: number;
    background: number;
    lighting: number;
    expression: number;
    overall_score: number;
    suggestions: string[];
    profile_image_url?: string;
  };
  content_suggestions?: {
    type: string;
    description: string;
    frequency: string;
  }[];
  highlight_suggestions?: any[];
  profile_data?: {
    full_name?: string;
    bio?: string;
    profile_pic_url?: string;
    external_url?: string;
    posts_count?: number;
    following_count?: number;
    is_verified?: boolean;
  };
  from_cache?: boolean;
  analysis_count?: number;
  data_source?: string;
  // New strategist fields
  profile_analysis?: any;
  strategic_adjustments?: {
    bio_versions: string[];
    photo_suggestions: string[];
    name_suggestion: string;
  };
  monthly_content_plan?: any;
  sales_funnel?: any;
  visual_identity?: any;
}

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
  ];
  for (const pattern of tiktokPatterns) {
    const match = cleanUrl.match(pattern);
    if (match && match[1]) {
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
  ];
  for (const pattern of fbPatterns) {
    const match = cleanUrl.match(pattern);
    if (match && match[1] && !['watch', 'groups', 'events', 'marketplace'].includes(match[1].toLowerCase())) {
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
  
  // Fallback - just username
  if (cleanUrl.startsWith('@')) {
    return { platform: 'instagram', username: cleanUrl.replace('@', '') };
  }
  
  console.log(`[detectPlatform] Could not match URL: "${cleanUrl}"`);
  return null;
}

// Parse follower count from string (e.g., "12.9M", "500K", "1,234")
function parseFollowerCount(text: string): number | null {
  if (!text) return null;
  const cleanText = text.replace(/,/g, '').trim();
  const match = cleanText.match(/([\d.]+)\s*([KMB])?/i);
  if (!match) return null;
  
  let count = parseFloat(match[1]);
  const suffix = (match[2] || '').toUpperCase();
  
  if (suffix === 'K') count *= 1000;
  else if (suffix === 'M') count *= 1000000;
  else if (suffix === 'B') count *= 1000000000;
  
  return Math.round(count);
}

// Fetch real profile data using multiple scraping strategies
async function fetchRealProfileData(platform: string, username: string): Promise<any> {
  console.log(`[fetchRealProfileData] Fetching data for ${platform}/${username}`);
  
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
    'Cache-Control': 'no-cache',
  };

  try {
    // For Instagram, try multiple strategies
    if (platform === 'instagram') {
      let result = null;
      
      // Strategy 1: Try i.instagram.com API (mobile app API)
      try {
        console.log('[fetchRealProfileData] Trying Instagram mobile API...');
        const apiUrl = `https://i.instagram.com/api/v1/users/web_profile_info/?username=${username}`;
        const response = await fetch(apiUrl, {
          headers: {
            'User-Agent': 'Instagram 275.0.0.27.98 Android (33/13; 420dpi; 1080x2400; samsung; SM-G998B; p3s; exynos2100)',
            'X-IG-App-ID': '936619743392459',
            'X-IG-WWW-Claim': '0',
            'Accept': '*/*',
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data?.data?.user) {
            const user = data.data.user;
            console.log(`[fetchRealProfileData] Instagram API success! Followers: ${user.edge_followed_by?.count}`);
            return {
              platform,
              username,
              full_name: user.full_name || username,
              bio: user.biography || null,
              profile_pic_url: user.profile_pic_url_hd || user.profile_pic_url || null,
              followers_count: user.edge_followed_by?.count || null,
              following_count: user.edge_follow?.count || null,
              posts_count: user.edge_owner_to_timeline_media?.count || null,
              is_verified: user.is_verified || false,
              external_url: user.external_url || null,
              source: 'instagram_api'
            };
          }
        }
      } catch (apiError) {
        console.log(`[fetchRealProfileData] Instagram API failed: ${apiError}`);
      }
      
      // Strategy 2: Fetch public profile page and extract meta tags
      try {
        console.log('[fetchRealProfileData] Trying Instagram HTML scraping...');
        const profileUrl = `https://www.instagram.com/${username}/`;
        const response = await fetch(profileUrl, { headers });
        
        if (response.ok) {
          const text = await response.text();
          
          // Extract from og:description (format: "X Followers, Y Following, Z Posts - Bio text")
          const descMatch = text.match(/<meta\s+(?:property|name)="og:description"\s+content="([^"]*)"/i) ||
                           text.match(/content="([^"]*)"[^>]*(?:property|name)="og:description"/i);
          
          const titleMatch = text.match(/<meta\s+(?:property|name)="og:title"\s+content="([^"]*)"/i) ||
                            text.match(/content="([^"]*)"[^>]*(?:property|name)="og:title"/i);
          
          const imageMatch = text.match(/<meta\s+(?:property|name)="og:image"\s+content="([^"]*)"/i) ||
                            text.match(/content="([^"]*)"[^>]*(?:property|name)="og:image"/i);

          let followers = null;
          let following = null;
          let posts = null;
          let bio = null;

          if (descMatch && descMatch[1]) {
            const desc = descMatch[1];
            console.log(`[fetchRealProfileData] Found og:description: ${desc.substring(0, 100)}...`);
            
            // Parse "X Followers, Y Following, Z Posts"
            const statsMatch = desc.match(/([\d.,]+[KMB]?)\s*Followers?,?\s*([\d.,]+[KMB]?)\s*Following,?\s*([\d.,]+[KMB]?)\s*Posts?/i);
            if (statsMatch) {
              followers = parseFollowerCount(statsMatch[1]);
              following = parseFollowerCount(statsMatch[2]);
              posts = parseFollowerCount(statsMatch[3]);
              console.log(`[fetchRealProfileData] Parsed stats - Followers: ${followers}, Following: ${following}, Posts: ${posts}`);
            }
            
            // Try alternative formats
            if (!followers) {
              const altFollowersMatch = desc.match(/([\d.,]+[KMB]?)\s*(?:seguidores|followers)/i);
              if (altFollowersMatch) {
                followers = parseFollowerCount(altFollowersMatch[1]);
              }
            }
            
            // Extract bio (after the stats part)
            const bioParts = desc.split(' - ');
            if (bioParts.length > 1) {
              bio = bioParts.slice(1).join(' - ').trim();
            }
          }
          
          if (followers || titleMatch) {
            console.log(`[fetchRealProfileData] Instagram HTML success! Followers: ${followers}`);
            return {
              platform,
              username,
              full_name: titleMatch ? titleMatch[1].split('(')[0].replace('@', '').trim() : username,
              bio: bio,
              profile_pic_url: imageMatch ? imageMatch[1] : null,
              followers_count: followers,
              following_count: following,
              posts_count: posts,
              source: 'instagram_html'
            };
          }
        }
      } catch (htmlError) {
        console.log(`[fetchRealProfileData] Instagram HTML scrape failed: ${htmlError}`);
      }
    }
    
    // For YouTube
    if (platform === 'youtube') {
      try {
        console.log('[fetchRealProfileData] Trying YouTube scraping...');
        const channelUrl = `https://www.youtube.com/@${username}`;
        const response = await fetch(channelUrl, { headers });
        
        if (response.ok) {
          const text = await response.text();
          
          const titleMatch = text.match(/<meta property="og:title" content="([^"]*)">/);
          const descMatch = text.match(/<meta property="og:description" content="([^"]*)">/);
          const imageMatch = text.match(/<meta property="og:image" content="([^"]*)">/);
          
          // Extract subscriber count from various patterns
          let subscribers = null;
          const subPatterns = [
            /"subscriberCountText":\s*\{"simpleText":\s*"([^"]+)"\}/,
            /"subscriberCountText":\s*"([^"]+)"/,
            /([\d.,]+[KMB]?)\s*(?:subscribers|inscritos)/i,
          ];
          
          for (const pattern of subPatterns) {
            const match = text.match(pattern);
            if (match) {
              subscribers = parseFollowerCount(match[1]);
              if (subscribers) break;
            }
          }
          
          if (titleMatch || subscribers) {
            console.log(`[fetchRealProfileData] YouTube success! Subscribers: ${subscribers}`);
            return {
              platform,
              username,
              full_name: titleMatch ? titleMatch[1] : username,
              bio: descMatch ? descMatch[1] : null,
              profile_pic_url: imageMatch ? imageMatch[1] : null,
              followers_count: subscribers,
              source: 'youtube_html'
            };
          }
        }
      } catch (ytError) {
        console.log(`[fetchRealProfileData] YouTube fetch failed: ${ytError}`);
      }
    }
    
    // For TikTok
    if (platform === 'tiktok') {
      try {
        console.log('[fetchRealProfileData] Trying TikTok scraping...');
        const profileUrl = `https://www.tiktok.com/@${username}`;
        const response = await fetch(profileUrl, { headers });
        
        if (response.ok) {
          const text = await response.text();
          
          const descMatch = text.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"[^>]*>/i);
          const titleMatch = text.match(/<title>([^<]*)<\/title>/i);
          
          let followers = null;
          if (descMatch && descMatch[1]) {
            const followersMatch = descMatch[1].match(/([\d.,]+[KMB]?)\s*Followers/i);
            if (followersMatch) {
              followers = parseFollowerCount(followersMatch[1]);
            }
          }
          
          if (followers || titleMatch) {
            console.log(`[fetchRealProfileData] TikTok success! Followers: ${followers}`);
            return {
              platform,
              username,
              full_name: titleMatch ? titleMatch[1].split('|')[0].replace('@', '').trim() : username,
              bio: descMatch ? descMatch[1] : null,
              followers_count: followers,
              source: 'tiktok_html'
            };
          }
        }
      } catch (ttError) {
        console.log(`[fetchRealProfileData] TikTok fetch failed: ${ttError}`);
      }
    }
    
    console.log('[fetchRealProfileData] No real data found, will use AI estimation');
    return null;
    
  } catch (error) {
    console.error('[fetchRealProfileData] Error:', error);
    return null;
  }
}

async function analyzeWithAI(
  platform: string, 
  username: string, 
  realData: any = null,
  seed: number
): Promise<SocialAnalysisResult> {
  const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
  
  if (!lovableApiKey) {
    throw new Error("LOVABLE_API_KEY not configured");
  }
  
  const hasRealData = realData && (realData.followers_count || realData.bio);
  
  const dataContext = hasRealData ? `
DADOS REAIS DO PERFIL (USE ESTES VALORES EXATOS):
- Nome: ${realData.full_name || username}
- Bio atual: ${realData.bio || "Não disponível"}
- Seguidores: ${realData.followers_count ? realData.followers_count.toLocaleString() : "Não disponível"}
- Foto de perfil: ${realData.profile_pic_url ? "Disponível" : "Não disponível"}
- Posts: ${realData.posts_count || "Não disponível"}
- Seguindo: ${realData.following_count || "Não disponível"}
- Verificado: ${realData.is_verified ? "Sim" : "Não"}
- Fonte dos dados: ${realData.source || "scraping"}

IMPORTANTE: Use o número EXATO de seguidores fornecido acima. NÃO invente números diferentes.
` : `
SEM DADOS REAIS disponíveis. Faça estimativas realistas baseadas no tipo de perfil "${username}" no ${platform}.
Considere que perfis verificados ou com nomes reconhecíveis tendem a ter mais seguidores.
`;

  const prompt = `Você é um ESTRATEGISTA DE INSTAGRAM E MARKETING DIGITAL especializado em posicionamento, autoridade e conversão.

Analise o perfil "${username}" no ${platform} considerando que o objetivo principal é:
👉 atrair seguidores qualificados
👉 construir autoridade no nicho
👉 gerar relacionamento
👉 converter seguidores em clientes ou leads.

${dataContext}

Retorne APENAS um JSON válido com esta estrutura COMPLETA (todos os campos são OBRIGATÓRIOS):

{
  "score": <número de 0 a 100 - cálculo: (engagement_rate * 10) + (frequência_posts * 5) + bónus>,
  "breakdown": {
    "bio": <0-20: CTA clara +10, palavra-chave do nicho +10>,
    "visual": <0-20: foto profissional +10, consistência visual +10>,
    "engagement": <0-30: taxa de engajamento proporcional>,
    "consistency": <0-30: frequência de posts>
  },
  "followers": ${hasRealData && realData.followers_count ? realData.followers_count : '<número estimado>'},
  "engagement_rate": <taxa real ou estimada 1-5%>,
  "post_frequency": "<frequência ex: '3x por semana'>",
  
  "profile_analysis": {
    "photo": {
      "score": <0-100>,
      "verdict": "<Excelente|Bom|Requer Melhoria|Crítico>",
      "issues": ["problema 1", "problema 2"]
    },
    "bio": {
      "score": <0-100>,
      "has_cta": <true/false>,
      "has_niche_keywords": <true/false>,
      "issues": ["problema 1", "problema 2"]
    },
    "name": {
      "optimized": <true/false>,
      "suggestion": "@sugestaoOtimizada"
    },
    "highlights": {
      "organized": <true/false>,
      "missing": ["Destaque que falta 1", "Destaque que falta 2"]
    },
    "visual_identity": {
      "consistent": <true/false>,
      "issues": ["problema de identidade visual"]
    },
    "feed": {
      "organized": <true/false>,
      "issues": ["problema do feed"]
    }
  },
  
  "strategic_adjustments": {
    "bio_versions": [
      "<bio versão 1 com emoji + nicho + CTA - max 150 chars>",
      "<bio versão 2 alternativa com promessa + resultados - max 150 chars>",
      "<bio versão 3 com autoridade + diferenciação - max 150 chars>"
    ],
    "photo_suggestions": [
      "Sugestão de melhoria da foto 1",
      "Sugestão de melhoria da foto 2"
    ],
    "name_suggestion": "<Nome otimizado para SEO do Instagram>"
  },
  
  "monthly_content_plan": {
    "weekly_frequency": <número de posts por semana>,
    "content_distribution": {
      "educativo": <porcentagem>,
      "autoridade": <porcentagem>,
      "emocional": <porcentagem>,
      "engajamento": <porcentagem>,
      "venda": <porcentagem>
    },
    "weekly_themes": [
      {"week": 1, "theme": "<tema da semana 1>", "focus": "<foco principal>"},
      {"week": 2, "theme": "<tema da semana 2>", "focus": "<foco principal>"},
      {"week": 3, "theme": "<tema da semana 3>", "focus": "<foco principal>"},
      {"week": 4, "theme": "<tema da semana 4>", "focus": "<foco principal>"}
    ]
  },
  
  "sales_funnel": {
    "top": {"objective": "Atração", "content_types": ["tipo 1", "tipo 2", "tipo 3"]},
    "middle": {"objective": "Relacionamento", "content_types": ["tipo 1", "tipo 2"]},
    "bottom": {"objective": "Conversão", "content_types": ["tipo 1", "tipo 2"]},
    "conversion_path": ["Etapa 1", "Etapa 2", "Etapa 3", "Etapa 4", "Etapa 5"]
  },
  
  "highlight_suggestions": [
    {
      "name": "COMECE AQUI", 
      "objective": "Apresentar quem você é", 
      "order": 1,
      "icon": "👋",
      "stories_script": [
        "Olá! Seja bem-vindo ao meu perfil. Sou [nome] e ajudo [público] a [transformação].",
        "Aqui você vai encontrar conteúdo sobre [tema 1], [tema 2] e [tema 3].",
        "Para começar, clique no link da bio e [CTA específica]."
      ]
    },
    {
      "name": "RESULTADOS", 
      "objective": "Prova social com depoimentos", 
      "order": 2,
      "icon": "⭐",
      "stories_script": [
        "Veja o que os nossos clientes estão conquistando...",
        "[Nome] conseguiu [resultado específico] em [tempo].",
        "Quer resultados assim? Fale connosco pelo link na bio!"
      ]
    },
    {
      "name": "SERVIÇOS", 
      "objective": "Mostrar o que você oferece", 
      "order": 3,
      "icon": "🎯",
      "stories_script": [
        "Conheça os nossos serviços/produtos:",
        "[Serviço 1]: Para quem quer [benefício]. [Serviço 2]: Para quem busca [benefício].",
        "Qual faz mais sentido para você? Responda aqui!"
      ]
    },
    {
      "name": "DÚVIDAS", 
      "objective": "Responder perguntas frequentes", 
      "order": 4,
      "icon": "❓",
      "stories_script": [
        "Perguntas que mais recebo:",
        "P: [Pergunta comum]? R: [Resposta objetiva]",
        "Tem outra dúvida? Envie uma mensagem!"
      ]
    },
    {
      "name": "CONTATO", 
      "objective": "Facilitar o contacto direto", 
      "order": 5,
      "icon": "📞",
      "stories_script": [
        "Quer falar diretamente comigo?",
        "WhatsApp: [número] | Email: [email]",
        "Ou simplesmente clique no link da bio!"
      ]
    }
  ],
  
  "visual_identity": {
    "color_palette": ["#cor1", "#cor2", "#cor3", "#cor4"],
    "font_recommendations": ["Fonte para títulos", "Fonte para corpo"],
    "feed_style": "<estilo recomendado para o feed>"
  },
  
  "strengths": ["força 1 específica", "força 2 específica", "força 3 específica"],
  "weaknesses": ["fraqueza 1 acionável", "fraqueza 2 acionável", "fraqueza 3 acionável"],
  "suggestions": ["sugestão 1 prática", "sugestão 2 prática", "sugestão 3 prática"],
  "niche_detected": "<nicho detectado ex: 'Marketing Digital'>",
  "best_posting_times": [
    {"hour": 9, "label": "9h", "score": 85},
    {"hour": 12, "label": "12h", "score": 75},
    {"hour": 18, "label": "18h", "score": 90},
    {"hour": 20, "label": "20h", "score": 95}
  ],
  "bio_analysis": {
    "has_cta": <true/false>,
    "has_niche_keywords": <true/false>,
    "suggested_bio": "<melhor bio das 3 versões>",
    "current_issues": ["problema 1", "problema 2"],
    "actual_bio": "${hasRealData && realData.bio ? realData.bio.replace(/"/g, '\\"').replace(/\n/g, ' ') : ''}"
  },
  "photo_analysis": {
    "framing": <0-20>,
    "background": <0-20>,
    "lighting": <0-20>,
    "expression": <0-20>,
    "overall_score": <0-100>,
    "suggestions": ["sugestão foto 1", "sugestão foto 2"]
  },
  "content_suggestions": [
    {"type": "Reels de FAQ", "description": "Responda perguntas comuns do nicho", "frequency": "2x por semana"},
    {"type": "Carrossel Tutorial", "description": "Ensine um conceito em 5-7 slides", "frequency": "1x por semana"},
    {"type": "Stories Bastidores", "description": "Mostre o dia-a-dia autêntico", "frequency": "Diário"}
  ]
}

CRITÉRIOS DE QUALIDADE:
- Clareza na comunicação
- Coerência estratégica  
- Autoridade percebida
- Potencial de conversão
- Linguagem alinhada ao público

NÃO seja genérico. Pense como um consultor responsável por gerar resultados REAIS.
Seed para consistência: ${seed}

IMPORTANTE: Retorne APENAS o JSON, sem markdown, sem explicações.`;

  console.log(`[analyze-social-real] Calling AI for ${platform}/${username}`);

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${lovableApiKey}`,
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: "Você é um analisador de perfis de redes sociais profissional. Responda apenas com JSON válido. Seja consistente e realista nas suas análises. Se dados reais forem fornecidos, use-os exatamente." },
        { role: "user", content: prompt }
      ],
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[analyze-social-real] AI API error: ${errorText}`);
    throw new Error(`AI API error: ${response.status}`);
  }

  const aiData = await response.json();
  const content = aiData.choices?.[0]?.message?.content || "";
  
  // Clean and parse JSON
  let jsonStr = content.trim();
  if (jsonStr.startsWith("```json")) jsonStr = jsonStr.slice(7);
  if (jsonStr.startsWith("```")) jsonStr = jsonStr.slice(3);
  if (jsonStr.endsWith("```")) jsonStr = jsonStr.slice(0, -3);
  jsonStr = jsonStr.trim();

  try {
    const parsed = JSON.parse(jsonStr);
    
    // CRITICAL: Force real data values - NEVER use AI estimation when we have real data
    console.log(`[analyze-social-real] Real data check - hasRealData: ${hasRealData}, realData.followers_count: ${realData?.followers_count}, realData.profile_pic_url: ${realData?.profile_pic_url?.substring(0, 50)}...`);
    
    const followers = realData?.followers_count || parsed.followers || 0;
    const followingCount = realData?.following_count || null;
    const postsCount = realData?.posts_count || null;
    
    const photoAnalysis = parsed.photo_analysis || {
      framing: 12 + (seed % 8),
      background: 10 + (seed % 10),
      lighting: 11 + (seed % 9),
      expression: 13 + (seed % 7),
      overall_score: 0,
      suggestions: ["Melhore a iluminação do rosto", "Use um fundo mais neutro"],
      profile_image_url: null
    };
    
    if (!photoAnalysis.overall_score) {
      photoAnalysis.overall_score = Math.round(
        ((photoAnalysis.framing + photoAnalysis.background + photoAnalysis.lighting + photoAnalysis.expression) / 80) * 100
      );
    }
    
    // CRITICAL: Always use real profile_pic_url when available
    if (realData?.profile_pic_url) {
      photoAnalysis.profile_image_url = realData.profile_pic_url;
      console.log(`[analyze-social-real] Setting profile_image_url from real data: ${realData.profile_pic_url.substring(0, 80)}...`);
    }
    
    const bioAnalysis = parsed.bio_analysis || {
      has_cta: false,
      has_niche_keywords: false,
      suggested_bio: `${parsed.niche_detected || "Expert"} | Transformo seguidores em clientes | Clique no link ↓`,
      current_issues: [],
      actual_bio: realData?.bio || null
    };
    
    if (realData?.bio) {
      bioAnalysis.actual_bio = realData.bio;
    }

    // Extract strategic adjustments - NAME SUGGESTION uses real name + niche bar
    const realName = realData?.full_name || username;
    const nicheKeyword = parsed.niche_detected || "Expert";
    const nameSuggestion = `${realName} | ${nicheKeyword}`;
    
    console.log(`[analyze-social-real] Name suggestion: "${nameSuggestion}" (from real_name: ${realName})`);
    
    const strategicAdjustments = parsed.strategic_adjustments || {
      bio_versions: [
        bioAnalysis.suggested_bio,
        `🎯 ${nicheKeyword} | Resultados comprovados | Link na bio ↓`,
        `💡 ${nicheKeyword} | Conteúdo que transforma | Clique abaixo`
      ],
      photo_suggestions: photoAnalysis.suggestions || [],
      name_suggestion: nameSuggestion
    };

    // Extract sales funnel
    const salesFunnel = parsed.sales_funnel || {
      top: { objective: "Atração", content_types: ["Reels virais", "Carrosséis educativos"] },
      middle: { objective: "Relacionamento", content_types: ["Stories interativos", "Lives Q&A"] },
      bottom: { objective: "Conversão", content_types: ["Depoimentos", "Ofertas limitadas"] },
      conversion_path: ["Post", "Stories", "Link bio", "WhatsApp", "Venda"]
    };

    // Extract visual identity
    const visualIdentity = parsed.visual_identity || {
      color_palette: ["#1E3A8A", "#3B82F6", "#FBBF24", "#F8FAFC"],
      font_recommendations: ["Montserrat para títulos", "Open Sans para corpo"],
      feed_style: "Clean e profissional com cores consistentes"
    };

    // Extract monthly content plan
    const monthlyContentPlan = parsed.monthly_content_plan || {
      weekly_frequency: 5,
      content_distribution: { educativo: 40, autoridade: 20, emocional: 15, engajamento: 15, venda: 10 },
      weekly_themes: [
        { week: 1, theme: "Fundamentos", focus: "Conteúdo educativo" },
        { week: 2, theme: "Autoridade", focus: "Cases e resultados" },
        { week: 3, theme: "Relacionamento", focus: "Bastidores e conexão" },
        { week: 4, theme: "Conversão", focus: "Ofertas e CTAs" }
      ]
    };
    
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
      followers,
      engagement_rate: parsed.engagement_rate || 3.5,
      post_frequency: parsed.post_frequency || "3x por semana",
      strengths: parsed.strengths || ["Presença ativa"],
      weaknesses: parsed.weaknesses || ["Bio pode melhorar"],
      suggestions: parsed.suggestions || ["Otimize a bio"],
      niche_detected: parsed.niche_detected || "Marketing Digital",
      best_posting_times: parsed.best_posting_times || [
        { hour: 9, label: "9h", score: 75 },
        { hour: 18, label: "18h", score: 90 },
        { hour: 20, label: "20h", score: 95 },
      ],
      bio_analysis: bioAnalysis,
      photo_analysis: photoAnalysis,
      content_suggestions: parsed.content_suggestions || [
        { type: "Reels de FAQ", description: "Responda perguntas comuns", frequency: "2x por semana" }
      ],
      highlight_suggestions: parsed.highlight_suggestions || [
        { name: "COMECE AQUI", objective: "Apresentar quem você é", order: 1, icon: "👋", stories_script: ["Bem-vindo ao meu perfil!", "Aqui você encontra conteúdo valioso.", "Clique no link da bio!"] },
        { name: "RESULTADOS", objective: "Prova social", order: 2, icon: "⭐", stories_script: ["Resultados reais dos clientes", "Case de sucesso", "Você pode ser o próximo!"] },
        { name: "CONTEÚDO", objective: "Melhores posts", order: 3, icon: "📚", stories_script: ["Melhores conteúdos", "Dicas práticas", "Salve para consultar depois!"] },
        { name: "SERVIÇOS", objective: "O que oferece", order: 4, icon: "🎯", stories_script: ["Nossos serviços", "Como funciona", "Entre em contacto!"] },
        { name: "CONTATO", objective: "Como falar", order: 5, icon: "📞", stories_script: ["Fale connosco", "WhatsApp/Email", "Respondemos em 24h!"] }
      ],
      // CRITICAL: Always include real profile data when available
      following_count: followingCount,
      posts_count: postsCount,
      profile_data: hasRealData ? {
        full_name: realData.full_name,
        bio: realData.bio,
        profile_pic_url: realData.profile_pic_url,
        posts_count: realData.posts_count,
        following_count: realData.following_count,
      } : undefined,
      data_source: hasRealData ? realData.source : 'ai_estimation',
      // New strategist fields
      profile_analysis: parsed.profile_analysis,
      strategic_adjustments: strategicAdjustments,
      monthly_content_plan: monthlyContentPlan,
      sales_funnel: salesFunnel,
      visual_identity: visualIdentity
    };
  } catch (parseError) {
    console.error(`[analyze-social-real] Parse error:`, parseError);
    throw new Error("Failed to parse AI response");
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

    const { url, force_refresh } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ error: "URL é obrigatória" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[analyze-social-real] Analyzing URL: ${url}, force_refresh: ${force_refresh}`);

    const detected = detectPlatform(url);
    
    if (!detected) {
      return new Response(
        JSON.stringify({ 
          error: "Plataforma não reconhecida. Use links do Instagram, YouTube, TikTok, LinkedIn ou Facebook." 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const cacheKey = `${detected.platform}_${detected.username.toLowerCase()}`;
    const urlHash = createHash(cacheKey);
    const seed = parseInt(urlHash.substring(0, 8), 16) % 1000000;
    const now = new Date();

    // Check cache first (unless force refresh)
    if (!force_refresh) {
      const { data: cacheData } = await supabase
        .from("social_analysis_cache")
        .select("*")
        .eq("url_hash", urlHash)
        .maybeSingle();

      if (cacheData) {
        const expiresAt = new Date(cacheData.expires_at);
        const analysisCount = cacheData.analysis_count || 1;

        if (expiresAt > now && analysisCount >= 2) {
          console.log(`[analyze-social-real] Returning cached result`);
          
          const hoursRemaining = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60));
          
          return new Response(
            JSON.stringify({
              platform: cacheData.platform,
              username: cacheData.username,
              score: cacheData.score,
              breakdown: cacheData.breakdown,
              followers: cacheData.followers,
              engagement_rate: parseFloat(cacheData.engagement_rate) || 0,
              post_frequency: cacheData.post_frequency || "3x por semana",
              strengths: cacheData.strengths ? cacheData.strengths.split("|||") : [],
              weaknesses: cacheData.weaknesses ? cacheData.weaknesses.split("|||") : [],
              suggestions: cacheData.suggestions ? cacheData.suggestions.split("|||") : [],
              niche_detected: cacheData.niche_detected || "Marketing Digital",
              best_posting_times: cacheData.best_posting_times || [],
              from_cache: true,
              analysis_count: analysisCount,
              next_analysis_available: `${hoursRemaining}h`
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    }

    // Try to fetch real profile data
    console.log(`[analyze-social-real] Fetching real profile data...`);
    const realData = await fetchRealProfileData(detected.platform, detected.username);
    
    // Perform AI analysis with real data context
    console.log(`[analyze-social-real] Performing AI analysis...`);
    const result = await analyzeWithAI(detected.platform, detected.username, realData, seed);

    // Calculate expiration (24 hours from now)
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Update or insert cache
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

    await supabase
      .from("social_analysis_cache")
      .upsert(cacheRecord, { onConflict: 'url_hash' });

    console.log(`[analyze-social-real] Analysis complete. Score: ${result.score}, Followers: ${result.followers}, Source: ${result.data_source}`);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error("[analyze-social-real] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erro interno ao analisar perfil" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
