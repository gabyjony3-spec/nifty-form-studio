import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, Target, Clock, CheckCircle2, Sparkles, Edit2, Save, PartyPopper, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { PerformanceComparison } from "./PerformanceComparison";
import { PredictiveCalendar } from "./PredictiveCalendar";
import { toast } from "@/hooks/use-toast";
interface EvolutionDashboardProps {
  userId?: string;
}
interface Goal {
  id: string;
  text: string;
  completed: boolean;
  fromAI?: boolean;
}
interface AnalysisHistoryData {
  day: string;
  engagement: number;
  followers: number;
}
const defaultGoals: Goal[] = [{
  id: "1",
  text: "Atualizar Bio do perfil",
  completed: false
}, {
  id: "2",
  text: "Postar 3 Reels esta semana",
  completed: false
}, {
  id: "3",
  text: "Usar hashtags sugeridas pela IA",
  completed: false
}, {
  id: "4",
  text: "Responder a todos os comentários",
  completed: false
}, {
  id: "5",
  text: "Publicar nos melhores horários",
  completed: false
}];
const bestPostingTimes = [{
  day: "Segunda",
  times: ["08:00", "12:00", "19:00"],
  heat: 70
}, {
  day: "Terça",
  times: ["09:00", "13:00", "20:00"],
  heat: 85
}, {
  day: "Quarta",
  times: ["08:00", "12:00", "18:00"],
  heat: 65
}, {
  day: "Quinta",
  times: ["10:00", "14:00", "21:00"],
  heat: 90
}, {
  day: "Sexta",
  times: ["09:00", "15:00", "20:00"],
  heat: 95
}, {
  day: "Sábado",
  times: ["11:00", "16:00", "21:00"],
  heat: 80
}, {
  day: "Domingo",
  times: ["10:00", "15:00", "19:00"],
  heat: 75
}];
export function EvolutionDashboard({
  userId: propUserId
}: EvolutionDashboardProps) {
  const [userId, setUserId] = useState<string | undefined>(propUserId);
  const [goals, setGoals] = useState<Goal[]>(() => {
    const saved = localStorage.getItem("evolution_goals");
    return saved ? JSON.parse(saved) : defaultGoals;
  });
  const [targetFollowers, setTargetFollowers] = useState(() => {
    const saved = localStorage.getItem("target_followers");
    return saved ? parseInt(saved) : 10000;
  });
  const [currentFollowers, setCurrentFollowers] = useState(0);
  const [lastScore, setLastScore] = useState<number | null>(null);
  const [engagementData, setEngagementData] = useState<AnalysisHistoryData[]>([]);
  const [editingTarget, setEditingTarget] = useState(false);
  const [tempTarget, setTempTarget] = useState(targetFollowers.toString());
  const [showCelebration, setShowCelebration] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [detectedNiche, setDetectedNiche] = useState<string>("");
  // Get user ID if not provided
  useEffect(() => {
    const getUser = async () => {
      if (!propUserId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserId(user.id);
        }
      }
    };
    getUser();
  }, [propUserId]);

  useEffect(() => {
    localStorage.setItem("evolution_goals", JSON.stringify(goals));

    // Check if all goals completed for celebration
    const allCompleted = goals.length > 0 && goals.every(g => g.completed);
    if (allCompleted && !showCelebration) {
      setShowCelebration(true);
      toast({
        title: "🎉 Parabéns!",
        description: "Você completou todas as tarefas da semana!"
      });
      setTimeout(() => setShowCelebration(false), 3000);
    }
  }, [goals]);

  useEffect(() => {
    localStorage.setItem("target_followers", targetFollowers.toString());
  }, [targetFollowers]);

  useEffect(() => {
    const fetchRealData = async () => {
      if (!userId) return;
      try {
        // Fetch all analyses for engagement chart
        const {
          data: analyses
        } = await supabase.from("social_media_analysis").select("score, followers, engagement_rate, analyzed_at, suggestions, platform").eq("user_id", userId).order("analyzed_at", {
          ascending: true
        }).limit(7);
        if (analyses && analyses.length > 0) {
          // Set current followers from latest analysis
          const latest = analyses[analyses.length - 1];
          setCurrentFollowers(latest.followers || 0);
          setLastScore(latest.score || 0);

          // Parse AI suggestions from latest analysis
          if (latest.suggestions) {
            const suggestionsList = latest.suggestions.split(/[.;\n]/).filter((s: string) => s.trim().length > 10).slice(0, 5).map((s: string) => s.trim());
            setAiSuggestions(suggestionsList);
          }

          // Transform to chart data
          const chartData = analyses.map(a => ({
            day: new Date(a.analyzed_at).toLocaleDateString("pt-PT", {
              weekday: "short"
            }),
            engagement: a.engagement_rate || 0,
            followers: a.followers || 0
          }));
          setEngagementData(chartData);
        }

        // Try to get detected niche from localStorage or detect it
        const savedNiche = localStorage.getItem("detected_niche");
        if (savedNiche) {
          setDetectedNiche(savedNiche);
        }
      } catch (error) {
        console.error("Error fetching analysis data:", error);
      }
    };
    fetchRealData();
  }, [userId]);
  const toggleGoal = (id: string) => {
    setGoals(prev => prev.map(goal => goal.id === id ? {
      ...goal,
      completed: !goal.completed
    } : goal));
  };
  const handleSaveTarget = () => {
    const newTarget = parseInt(tempTarget);
    if (!isNaN(newTarget) && newTarget > 0) {
      setTargetFollowers(newTarget);
      setEditingTarget(false);
      toast({
        title: "Meta atualizada!",
        description: `Nova meta: ${newTarget.toLocaleString()} seguidores`
      });
    }
  };
  const generateAITasks = () => {
    if (aiSuggestions.length > 0) {
      const aiGoals: Goal[] = aiSuggestions.map((suggestion, index) => ({
        id: `ai-${Date.now()}-${index}`,
        text: suggestion.length > 50 ? suggestion.substring(0, 50) + "..." : suggestion,
        completed: false,
        fromAI: true
      }));
      setGoals(aiGoals);
      toast({
        title: "Tarefas atualizadas!",
        description: "Checklist gerado com base nas sugestões da IA"
      });
    } else {
      toast({
        title: "Sem sugestões",
        description: "Faça uma análise primeiro para gerar tarefas personalizadas",
        variant: "destructive"
      });
    }
  };
  const completedPercentage = goals.length > 0 ? goals.filter(g => g.completed).length / goals.length * 100 : 0;
  const followerProgress = targetFollowers > 0 ? Math.min(currentFollowers / targetFollowers * 100, 100) : 0;

  // Use ONLY real data - no mock fallback
  const chartData = engagementData.length > 0 ? engagementData : [];
  const hasRealData = chartData.length > 0;
  return <div className="space-y-6">
      

      {/* Performance Comparison - Before/After */}
      <PerformanceComparison userId={userId} />

      {/* Predictive Content Calendar */}
      <PredictiveCalendar userId={userId} detectedNiche={detectedNiche} />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Engagement Growth Chart */}
        <Card className="col-span-full lg:col-span-2 glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Crescimento de Engajamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            {hasRealData ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                    <XAxis dataKey="day" tick={{
                    fontSize: 12,
                    fill: 'hsl(var(--muted-foreground))'
                  }} />
                    <YAxis tick={{
                    fontSize: 12,
                    fill: 'hsl(var(--muted-foreground))'
                  }} />
                    <Tooltip contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }} labelStyle={{
                    color: 'hsl(var(--foreground))'
                  }} />
                    <Line type="monotone" dataKey="engagement" stroke="hsl(var(--primary))" strokeWidth={3} dot={{
                    fill: 'hsl(var(--primary))'
                  }} name="Engagement %" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center">
                <div className="text-center space-y-4">
                  <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground/50" />
                  <div>
                    <p className="font-medium text-muted-foreground">Sem dados reais disponíveis</p>
                    <p className="text-sm text-muted-foreground/70">Faça uma análise de perfil para ver o crescimento de engajamento</p>
                  </div>
                </div>
              </div>
            )}
            <p className="text-sm text-muted-foreground mt-4">
              {hasRealData ? "Taxa de engajamento baseada nas suas análises reais" : "Conecte suas redes sociais para ver dados reais"}
            </p>
          </CardContent>
        </Card>

        {/* Goals Progress with Editable Target */}
        <Card className="glass-card relative overflow-hidden">
          <AnimatePresence>
            {showCelebration && <motion.div initial={{
            opacity: 0
          }} animate={{
            opacity: 1
          }} exit={{
            opacity: 0
          }} className="absolute inset-0 bg-primary/20 z-10 flex items-center justify-center">
                <PartyPopper className="h-16 w-16 text-primary animate-bounce" />
              </motion.div>}
          </AnimatePresence>
          
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Meta de Seguidores
              </div>
              <Button variant="ghost" size="icon" onClick={() => {
              setEditingTarget(!editingTarget);
              setTempTarget(targetFollowers.toString());
            }}>
                <Edit2 className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {editingTarget ? <div className="space-y-3">
                <Label htmlFor="targetGoal">Meta de seguidores</Label>
                <div className="flex gap-2">
                  <Input id="targetGoal" type="number" value={tempTarget} onChange={e => setTempTarget(e.target.value)} placeholder="10000" className="flex-1" />
                  <Button size="icon" onClick={handleSaveTarget}>
                    <Save className="h-4 w-4" />
                  </Button>
                </div>
              </div> : <>
                <div className="text-center">
                  <span className="text-4xl font-bold text-primary">
                    {currentFollowers.toLocaleString()}
                  </span>
                  <span className="text-muted-foreground"> / {targetFollowers.toLocaleString()}</span>
                </div>
                <Progress value={followerProgress} className="h-3" />
                <p className="text-sm text-muted-foreground text-center">
                  {Math.max(0, targetFollowers - currentFollowers).toLocaleString()} seguidores para a meta
                </p>
              </>}
            {lastScore && <div className="pt-4 border-t border-border/50">
                <p className="text-sm text-muted-foreground">Último Score da IA</p>
                <p className="text-2xl font-bold text-primary">{lastScore}/100</p>
              </div>}
          </CardContent>
        </Card>

        {/* Best Posting Times Heatmap */}
        <Card className="col-span-full lg:col-span-2 glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Melhores Horários para Postar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {bestPostingTimes.map(item => <div key={item.day} className="flex items-center gap-4">
                  <span className="w-24 text-sm font-medium">{item.day}</span>
                  <div className="flex-1 h-8 rounded-lg flex items-center justify-center gap-2 text-sm" style={{
                background: `linear-gradient(90deg, hsl(var(--primary) / ${item.heat / 100}) 0%, hsl(var(--primary) / ${item.heat / 150}) 100%)`
              }}>
                    {item.times.map((time, i) => <span key={i} className="bg-background/80 px-2 py-0.5 rounded text-xs font-medium">
                        {time}
                      </span>)}
                  </div>
                  <span className="w-12 text-right text-sm text-muted-foreground">
                    {item.heat}%
                  </span>
                </div>)}
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              Baseado na atividade do seu público-alvo
            </p>
          </CardContent>
        </Card>

        {/* Weekly Checklist - Now with AI Integration */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                Checklist da Semana
              </div>
              <Button variant="ghost" size="icon" onClick={generateAITasks} title="Gerar tarefas com IA">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={completedPercentage} className="h-2" />
            <p className="text-sm text-muted-foreground">
              {goals.filter(g => g.completed).length} de {goals.length} tarefas concluídas
            </p>
            <div className="space-y-3 max-h-[200px] overflow-y-auto">
              {goals.map(goal => <motion.div key={goal.id} initial={{
              opacity: 0,
              x: -10
            }} animate={{
              opacity: 1,
              x: 0
            }} className="flex items-start gap-3 cursor-pointer group" onClick={() => toggleGoal(goal.id)}>
                  <Checkbox checked={goal.completed} onCheckedChange={() => toggleGoal(goal.id)} className="mt-0.5" />
                  <div className="flex-1">
                    <span className={`text-sm ${goal.completed ? 'line-through text-muted-foreground' : ''}`}>
                      {goal.text}
                    </span>
                    {goal.fromAI && <span className="ml-2 text-xs text-primary/70">✨ IA</span>}
                  </div>
                </motion.div>)}
            </div>
            <Button variant="outline" className="w-full mt-4" onClick={() => {
            setGoals(defaultGoals);
            localStorage.removeItem("evolution_goals");
            toast({
              title: "Semana reiniciada!",
              description: "Todas as tarefas foram resetadas"
            });
          }}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Reiniciar Semana
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>;
}