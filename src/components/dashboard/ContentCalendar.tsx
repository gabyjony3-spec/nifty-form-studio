import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, Sparkles, Video, Image as ImageIcon, MessageSquare, RefreshCw, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ContentIdea {
  day: string;
  date: string;
  type: "reel" | "post" | "story" | "carousel";
  topic: string;
  bestTime: string;
  hashtags: string[];
}

interface ContentCalendarProps {
  niche?: string;
}

const getContentTypeIcon = (type: string) => {
  switch (type) {
    case "reel":
      return <Video className="h-4 w-4" />;
    case "carousel":
      return <ImageIcon className="h-4 w-4" />;
    case "story":
      return <MessageSquare className="h-4 w-4" />;
    default:
      return <ImageIcon className="h-4 w-4" />;
  }
};

const getContentTypeBadge = (type: string) => {
  const styles: Record<string, string> = {
    reel: "bg-red-500/20 text-red-500 border-red-500/30",
    post: "bg-blue-500/20 text-blue-500 border-blue-500/30",
    story: "bg-purple-500/20 text-purple-500 border-purple-500/30",
    carousel: "bg-green-500/20 text-green-500 border-green-500/30",
  };
  return styles[type] || styles.post;
};

export function ContentCalendar({ niche = "Negócios" }: ContentCalendarProps) {
  const [ideas, setIdeas] = useState<ContentIdea[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const generateCalendar = async () => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke("ai-chat", {
        body: {
          message: `Gere um calendário de conteúdo para 7 dias para o nicho "${niche}". 
          Para cada dia, sugira:
          1. Tipo de conteúdo (reel, post, story ou carousel)
          2. Tema/tópico específico
          3. Melhor horário para postar
          4. 3 hashtags relevantes
          
          Responda APENAS em formato JSON válido com esta estrutura exata:
          {
            "calendar": [
              {
                "day": "Segunda",
                "type": "reel",
                "topic": "Descrição do conteúdo",
                "bestTime": "19:00",
                "hashtags": ["hashtag1", "hashtag2", "hashtag3"]
              }
            ]
          }`,
        },
      });

      if (error) throw error;

      // Parse AI response
      const response = data.response || data.generatedText || "";
      const jsonMatch = response.match(/\{[\s\S]*"calendar"[\s\S]*\}/);
      
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        const today = new Date();
        
        const calendarWithDates = parsed.calendar.map((item: any, index: number) => {
          const date = new Date(today);
          date.setDate(date.getDate() + index);
          return {
            ...item,
            date: date.toLocaleDateString("pt-PT", { day: "2-digit", month: "short" }),
          };
        });
        
        setIdeas(calendarWithDates);
        toast.success("Calendário gerado com sucesso!");
      } else {
        throw new Error("Formato de resposta inválido");
      }
    } catch (error) {
      console.error("Error generating calendar:", error);
      toast.error("Erro ao gerar calendário. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Calendário de Conteúdo
        </CardTitle>
        <Button onClick={generateCalendar} disabled={isLoading} size="sm">
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Gerando...
            </>
          ) : ideas.length > 0 ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Regenerar
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Gerar com IA
            </>
          )}
        </Button>
      </CardHeader>
      <CardContent>
        {ideas.length === 0 ? (
          <div className="text-center py-12 space-y-4">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground" />
            <div>
              <p className="font-medium">Nenhum calendário gerado</p>
              <p className="text-sm text-muted-foreground">
                Clique em "Gerar com IA" para criar 7 dias de sugestões de conteúdo
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {ideas.map((idea, index) => (
              <div
                key={index}
                className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="text-center min-w-[60px]">
                  <p className="text-xs text-muted-foreground">{idea.day}</p>
                  <p className="text-lg font-bold">{idea.date}</p>
                </div>
                
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={getContentTypeBadge(idea.type)}>
                      {getContentTypeIcon(idea.type)}
                      <span className="ml-1 capitalize">{idea.type}</span>
                    </Badge>
                    <span className="text-xs text-muted-foreground">às {idea.bestTime}</span>
                  </div>
                  
                  <p className="text-sm font-medium">{idea.topic}</p>
                  
                  <div className="flex flex-wrap gap-1">
                    {idea.hashtags.map((tag, i) => (
                      <span key={i} className="text-xs text-primary">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
