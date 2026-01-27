import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, Sparkles, Loader2, RefreshCw, Instagram, Video, Image, FileText } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "@/hooks/use-toast";
import { useCredits } from "@/hooks/useCredits";
import { CreditExhaustedModal } from "@/components/credits/CreditExhaustedModal";
interface PredictiveCalendarProps {
  userId?: string;
  detectedNiche?: string;
}
interface DayPost {
  day: string;
  dayName: string;
  postIdea: string;
  contentType: "video" | "image" | "carousel" | "story";
  bestTime: string;
  hashtags: string[];
}
const contentTypeIcons = {
  video: Video,
  image: Image,
  carousel: Instagram,
  story: FileText
};
const contentTypeLabels = {
  video: "Vídeo/Reel",
  image: "Imagem",
  carousel: "Carrossel",
  story: "Story"
};
export function PredictiveCalendar({
  userId,
  detectedNiche
}: PredictiveCalendarProps) {
  const [posts, setPosts] = useState<DayPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [niche, setNiche] = useState<string>(detectedNiche || "");
  const [hasGenerated, setHasGenerated] = useState(false);
  const {
    checkCredits,
    consumeCredit,
    showUpgradeModal,
    setShowUpgradeModal
  } = useCredits();

  // Load from database instead of localStorage
  useEffect(() => {
    const loadFromDatabase = async () => {
      if (!userId) {
        setInitialLoading(false);
        return;
      }
      try {
        const {
          data
        } = await supabase.from("history_analysis").select("calendar_data, niche_detected").eq("user_id", userId).order("updated_at", {
          ascending: false
        }).limit(1).maybeSingle();
        if (data?.calendar_data) {
          const calendarData = data.calendar_data as {
            posts?: DayPost[];
            niche?: string;
            generatedAt?: string;
          };
          if (calendarData.posts && Array.isArray(calendarData.posts)) {
            setPosts(calendarData.posts);
            setHasGenerated(true);
          }
          if (calendarData.niche) {
            setNiche(calendarData.niche);
          }
        }
        if (data?.niche_detected && !niche) {
          setNiche(data.niche_detected);
        }
      } catch (error) {
        console.error("Error loading calendar from database:", error);
      } finally {
        setInitialLoading(false);
      }
    };
    loadFromDatabase();
  }, [userId]);
  useEffect(() => {
    if (detectedNiche && detectedNiche !== niche) {
      setNiche(detectedNiche);
    }
  }, [detectedNiche]);
  const generateCalendar = async () => {
    if (!niche && !detectedNiche) {
      toast({
        title: "Nicho não detectado",
        description: "Faça uma análise de rede social primeiro para detectar o seu nicho",
        variant: "destructive"
      });
      return;
    }

    // Check credits before proceeding
    if (!checkCredits(1)) {
      return;
    }
    setLoading(true);
    try {
      const {
        data,
        error
      } = await supabase.functions.invoke("generate-content-calendar", {
        body: {
          niche: niche || detectedNiche,
          userId
        }
      });
      if (error) throw error;
      if (data?.calendar) {
        setPosts(data.calendar);
        setHasGenerated(true);

        // Consume credit after successful generation
        await consumeCredit(1);

        // Save to database instead of localStorage
        if (userId) {
          const calendarData = {
            posts: data.calendar,
            niche: niche || detectedNiche,
            generatedAt: new Date().toISOString()
          };
          await supabase.from("history_analysis").upsert({
            user_id: userId,
            calendar_data: calendarData,
            niche_detected: niche || detectedNiche,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id'
          });
        }
        toast({
          title: "Calendário gerado!",
          description: "7 dias de ideias de posts criadas pela IA"
        });
      }
    } catch (error: any) {
      console.error("Error generating calendar:", error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao gerar calendário",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const days = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];
  if (initialLoading) {
    return <Card className="glass-card">
        <CardContent className="py-8">
          <div className="animate-pulse flex flex-col items-center gap-4">
            <div className="h-8 w-48 bg-muted rounded" />
            <div className="h-32 w-full bg-muted rounded" />
          </div>
        </CardContent>
      </Card>;
  }
  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-cyan-400">
          <Calendar className="h-5 w-5" />
          Calendário Preditivo de 30 Dias
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasGenerated ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-cyan-950/30 border-2 border-dashed border-cyan-800/50 flex items-center justify-center mx-auto mb-4">
              <Calendar className="h-8 w-8 text-cyan-700/50" />
            </div>
            <p className="text-sm text-cyan-300/70 font-medium mb-4">
              {niche ? `Gerar plano de 30 dias para ${niche}` : "Detecte seu nicho primeiro"}
            </p>
            <Button
              onClick={generateCalendar}
              disabled={loading || (!niche && !detectedNiche)}
              className="gap-2 bg-gradient-to-r from-cyan-600 to-blue-600"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Gerando plano...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Gerar Plano de 30 Dias
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="text-cyan-400 border-cyan-600">
                {posts.length} dias planejados
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={generateCalendar}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
            
            <div className="grid grid-cols-7 gap-1 text-xs">
              {days.map(day => (
                <div key={day} className="text-center font-semibold text-muted-foreground p-1">
                  {day.slice(0, 3)}
                </div>
              ))}
            </div>
            
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {posts.slice(0, 7).map((post, idx) => {
                const Icon = contentTypeIcons[post.contentType] || Instagram;
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex items-center gap-3 p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-cyan-950/50 flex items-center justify-center">
                      <Icon className="h-4 w-4 text-cyan-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{post.postIdea}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{post.dayName}</span>
                        <span>•</span>
                        <span>{post.bestTime}</span>
                        <Badge variant="outline" className="text-[10px] px-1">
                          {contentTypeLabels[post.contentType] || post.contentType}
                        </Badge>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
      <CreditExhaustedModal open={showUpgradeModal} onOpenChange={setShowUpgradeModal} />
    </Card>
  );
}