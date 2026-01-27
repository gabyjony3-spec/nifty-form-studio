import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DayPlan {
  day: number;
  dayOfWeek: string;
  contentType: string;
  title: string;
  description: string;
  bestTime: string;
  hashtags: string[];
  caption?: string;
  tips?: string[];
}

interface WeeklyChecklist {
  id: string;
  day: string;
  task: string;
  description: string;
  completed: boolean;
}

interface NicheStrategy {
  niche: string;
  contentMix: { type: string; percentage: number }[];
  bestDays: string[];
  bestTimes: string[];
  hashtags: string[];
  contentPillars: string[];
  callToActions: string[];
}

// Niche-specific strategies
const NICHE_STRATEGIES: Record<string, NicheStrategy> = {
  "Marketing Digital": {
    niche: "Marketing Digital",
    contentMix: [
      { type: "Reels Tutorial", percentage: 30 },
      { type: "Carrossel Educativo", percentage: 25 },
      { type: "Stories Bastidores", percentage: 20 },
      { type: "Live Q&A", percentage: 15 },
      { type: "Prova Social", percentage: 10 },
    ],
    bestDays: ["Terça", "Quarta", "Quinta"],
    bestTimes: ["09:00", "12:00", "18:00", "20:00"],
    hashtags: ["marketingdigital", "empreendedorismo", "negociosonline", "vendas", "socialmedia"],
    contentPillars: ["Estratégia", "Ferramentas", "Cases de Sucesso", "Dicas Práticas"],
    callToActions: ["Link na bio", "Salve para depois", "Comente sua dúvida", "Compartilhe com quem precisa"],
  },
  "Finanças": {
    niche: "Finanças",
    contentMix: [
      { type: "Reels Explicativo", percentage: 35 },
      { type: "Carrossel Dados", percentage: 30 },
      { type: "Stories Dica Rápida", percentage: 20 },
      { type: "Análise de Mercado", percentage: 15 },
    ],
    bestDays: ["Segunda", "Terça", "Quinta"],
    bestTimes: ["07:00", "12:00", "19:00"],
    hashtags: ["financas", "investimentos", "educacaofinanceira", "dinheiro", "renda"],
    contentPillars: ["Investimentos", "Economia", "Orçamento Pessoal", "Renda Extra"],
    callToActions: ["Ative o sininho", "Salve para consultar", "Marque um amigo", "Comente o valor"],
  },
  "Saúde": {
    niche: "Saúde",
    contentMix: [
      { type: "Reels Exercício", percentage: 30 },
      { type: "Carrossel Receita", percentage: 25 },
      { type: "Stories Rotina", percentage: 25 },
      { type: "Antes e Depois", percentage: 10 },
      { type: "Mitos vs Fatos", percentage: 10 },
    ],
    bestDays: ["Segunda", "Quarta", "Sexta"],
    bestTimes: ["06:00", "12:00", "18:00"],
    hashtags: ["saude", "fitness", "bemestar", "vidasaudavel", "treino"],
    contentPillars: ["Exercícios", "Nutrição", "Bem-estar Mental", "Resultados"],
    callToActions: ["Salve o treino", "Experimente e conte", "Marque seu parceiro", "Compartilhe sua jornada"],
  },
  "default": {
    niche: "Geral",
    contentMix: [
      { type: "Reels", percentage: 30 },
      { type: "Carrossel", percentage: 25 },
      { type: "Stories", percentage: 25 },
      { type: "Post Único", percentage: 20 },
    ],
    bestDays: ["Terça", "Quarta", "Quinta", "Sexta"],
    bestTimes: ["12:00", "18:00", "20:00"],
    hashtags: ["dicas", "conteudo", "digital", "brasil"],
    contentPillars: ["Educação", "Entretenimento", "Inspiração", "Vendas"],
    callToActions: ["Salve para depois", "Comente sua opinião", "Compartilhe", "Siga para mais"],
  },
};

function getNicheStrategy(niche: string): NicheStrategy {
  const nicheKey = Object.keys(NICHE_STRATEGIES).find(key => 
    niche.toLowerCase().includes(key.toLowerCase()) || 
    key.toLowerCase().includes(niche.toLowerCase())
  );
  return NICHE_STRATEGIES[nicheKey || "default"];
}

const DAYS_OF_WEEK = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, niche, score, weaknesses } = await req.json();

    if (!userId || !niche) {
      return new Response(
        JSON.stringify({ error: "userId e niche são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const strategy = getNicheStrategy(niche);
    const weaknessesArray: string[] = weaknesses ? (Array.isArray(weaknesses) ? weaknesses : weaknesses.split("|||")) : [];

    console.log(`[generate-30-day-plan] Generating plan for niche: ${niche}, score: ${score}`);

    const weaknessesText = weaknessesArray.map((w: string, i: number) => `${i + 1}. ${w}`).join('\n');

    // Generate 30-day content plan with AI
    const prompt = `Você é um estrategista de conteúdo especializado no nicho de ${niche}.
    
Crie um plano de conteúdo para 30 dias que ajude a melhorar um perfil com score ${score || 50}/100.

Fraquezas identificadas a resolver:
${weaknessesText}

Pilares de conteúdo recomendados: ${strategy.contentPillars.join(', ')}
Mix de conteúdo ideal: ${strategy.contentMix.map(m => `${m.type} (${m.percentage}%)`).join(', ')}

Retorne APENAS um JSON válido com esta estrutura:
{
  "plan": [
    {
      "day": 1,
      "dayOfWeek": "Segunda",
      "contentType": "Reels Tutorial",
      "title": "Título atrativo do conteúdo",
      "description": "Descrição detalhada do que criar",
      "bestTime": "18:00",
      "hashtags": ["hashtag1", "hashtag2", "hashtag3", "hashtag4", "hashtag5"],
      "caption": "Sugestão de legenda completa com emojis e CTA",
      "tips": ["Dica de gravação 1", "Dica de edição 2"]
    }
    // ... mais 29 dias
  ],
  "weeklyChecklist": [
    {
      "id": "week1_mon_1",
      "day": "Segunda",
      "task": "Tarefa específica",
      "description": "Como executar esta tarefa"
    }
    // ... 12 tarefas para a primeira semana (2 por dia útil + fim de semana)
  ],
  "summary": {
    "totalPosts": 30,
    "reelsCount": 10,
    "carouselCount": 8,
    "storiesCount": 8,
    "otherCount": 4,
    "mainFocus": "Foco principal do mês",
    "expectedGrowth": "10-15%"
  }
}

IMPORTANTE: 
- Crie conteúdo variado e relevante para cada dia
- Use os melhores horários: ${strategy.bestTimes.join(', ')}
- Priorize os melhores dias: ${strategy.bestDays.join(', ')}
- Inclua CTAs fortes em cada caption
- Retorne APENAS o JSON, sem markdown`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${lovableApiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { 
            role: "system", 
            content: "Você é um estrategista de marketing de conteúdo. Crie planos detalhados e acionáveis. Responda apenas com JSON válido." 
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[generate-30-day-plan] AI error: ${errorText}`);
      throw new Error(`AI API error: ${response.status}`);
    }

    const aiData = await response.json();
    let content = aiData.choices?.[0]?.message?.content || "";
    
    // Clean JSON
    content = content.trim();
    if (content.startsWith("```json")) content = content.slice(7);
    if (content.startsWith("```")) content = content.slice(3);
    if (content.endsWith("```")) content = content.slice(0, -3);
    content = content.trim();

    let planData;
    try {
      planData = JSON.parse(content);
    } catch (parseError) {
      console.error("[generate-30-day-plan] Parse error, generating fallback plan");
      
      // Generate fallback plan
      planData = generateFallbackPlan(niche, strategy);
    }

    // Save to database
    const calendarData = {
      plan: planData.plan,
      weeklyChecklist: planData.weeklyChecklist,
      summary: planData.summary,
      niche,
      generatedAt: new Date().toISOString()
    };

    const checklistData: Record<string, boolean> = {};
    planData.weeklyChecklist?.forEach((item: WeeklyChecklist) => {
      checklistData[item.id] = false;
    });

    await supabase
      .from("history_analysis")
      .update({ 
        calendar_data: calendarData,
        checklist_data: checklistData,
        updated_at: new Date().toISOString()
      })
      .eq("user_id", userId);

    console.log(`[generate-30-day-plan] Plan generated with ${planData.plan?.length || 0} days`);

    return new Response(
      JSON.stringify({
        success: true,
        plan: planData.plan,
        weeklyChecklist: planData.weeklyChecklist,
        summary: planData.summary,
        strategy: {
          niche: strategy.niche,
          contentPillars: strategy.contentPillars,
          bestTimes: strategy.bestTimes,
          hashtags: strategy.hashtags
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error("[generate-30-day-plan] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erro ao gerar plano" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function generateFallbackPlan(niche: string, strategy: NicheStrategy) {
  const plan: DayPlan[] = [];
  const contentTypes = strategy.contentMix.map(m => m.type);
  
  for (let day = 1; day <= 30; day++) {
    const dayOfWeek = DAYS_OF_WEEK[(day - 1) % 7];
    const contentType = contentTypes[day % contentTypes.length];
    const pillar = strategy.contentPillars[day % strategy.contentPillars.length];
    const time = strategy.bestTimes[day % strategy.bestTimes.length];
    
    plan.push({
      day,
      dayOfWeek,
      contentType,
      title: `${pillar}: Conteúdo do Dia ${day}`,
      description: `Crie um ${contentType.toLowerCase()} sobre ${pillar.toLowerCase()} para engajar sua audiência de ${niche}.`,
      bestTime: time,
      hashtags: strategy.hashtags.slice(0, 5),
      caption: `🔥 ${pillar} | Dia ${day} do desafio de 30 dias!\n\n[Sua mensagem aqui]\n\n${strategy.callToActions[day % strategy.callToActions.length]}\n\n#${strategy.hashtags.join(' #')}`,
      tips: [
        `Use boa iluminação`,
        `Mantenha vídeos entre 15-30 segundos`,
        `Inclua legendas/captions`
      ]
    });
  }

  const weeklyChecklist: WeeklyChecklist[] = [];
  const tasks = [
    { task: "Ajustar Bio", description: "Revise e otimize sua bio com CTA clara" },
    { task: "Criar 3 Conteúdos", description: "Prepare conteúdos para a semana" },
    { task: "Interagir 30min", description: "Responda comentários e DMs" },
    { task: "Analisar Métricas", description: "Veja o que funcionou melhor" },
    { task: "Postar nos Horários", description: "Siga os melhores horários" },
    { task: "Stories Diários", description: "Mantenha presença constante" },
  ];

  DAYS_OF_WEEK.slice(0, 6).forEach((day, dayIndex) => {
    const task = tasks[dayIndex % tasks.length];
    weeklyChecklist.push({
      id: `week1_${day.toLowerCase()}_1`,
      day,
      task: task.task,
      description: task.description,
      completed: false
    });
  });

  return {
    plan,
    weeklyChecklist,
    summary: {
      totalPosts: 30,
      reelsCount: 10,
      carouselCount: 8,
      storiesCount: 8,
      otherCount: 4,
      mainFocus: `Crescimento no nicho de ${niche}`,
      expectedGrowth: "10-15%"
    }
  };
}
