import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CheckCircle2, ListTodo, Sparkles } from "lucide-react";

interface ChecklistItem {
  id: string;
  day: string;
  task: string;
  description?: string;
}

interface WeeklyChecklistProps {
  userId: string | null;
  historyId?: string;
  niche?: string | null;
  initialData?: Record<string, boolean> | null;
  onComplete?: () => void;
}

const DEFAULT_CHECKLIST: ChecklistItem[] = [
  // Segunda-feira
  { id: "mon_bio", day: "Segunda", task: "Ajuste de Bio", description: "Verifique se responde: O que faz? Para quem? Qual resultado?" },
  { id: "mon_post", day: "Segunda", task: "Post de Autoridade", description: "Publique foto profissional com sua história" },
  // Terça-feira
  { id: "tue_stories", day: "Terça", task: "Stories de Bastidores", description: "Mostre sua rotina de trabalho" },
  { id: "tue_questions", day: "Terça", task: "Caixa de Perguntas", description: "Pergunte: Qual sua maior dificuldade?" },
  // Quarta-feira
  { id: "wed_carousel", day: "Quarta", task: "Carrossel Educativo", description: "Crie: 3 passos para resolver [Problema]" },
  { id: "wed_interact", day: "Quarta", task: "Interação", description: "Responda 10 comentários ou DMs" },
  // Quinta-feira
  { id: "thu_proof", day: "Quinta", task: "Prova Social", description: "Poste depoimento ou estudo de caso" },
  { id: "thu_reels", day: "Quinta", task: "Reels de Dica Rápida", description: "Vídeo de 30s com uma sacada útil" },
  // Sexta-feira
  { id: "fri_live", day: "Sexta", task: "Live ou Vídeo Longo", description: "Fale sobre por que a maioria falha sozinho" },
  { id: "fri_dms", day: "Sexta", task: "Check de Directs", description: "Converta dúvidas em chamadas" },
  // Fim de semana
  { id: "sat_radar", day: "Sábado", task: "Análise do Radar", description: "Veja seu Profile Score" },
  { id: "sun_plan", day: "Domingo", task: "Planejar Semana", description: "Defina os temas com o Calendário Preditivo" },
];

export function WeeklyChecklist({
  userId,
  historyId,
  niche,
  initialData,
  onComplete
}: WeeklyChecklistProps) {
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>(initialData || {});
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(false);
    if (initialData) {
      setCheckedItems(initialData);
    }
  }, [initialData]);

  const handleCheck = async (itemId: string) => {
    const newCheckedItems = {
      ...checkedItems,
      [itemId]: !checkedItems[itemId]
    };
    setCheckedItems(newCheckedItems);

    // Check if all items are completed
    const completedCount = Object.values(newCheckedItems).filter(Boolean).length;
    const isAllComplete = completedCount === DEFAULT_CHECKLIST.length;

    if (isAllComplete && onComplete) {
      onComplete();
    }

    // Save to database
    if (userId) {
      setIsSaving(true);
      try {
        if (historyId) {
          await supabase
            .from("history_analysis")
            .update({ checklist_data: newCheckedItems })
            .eq("id", historyId);
        } else {
          await supabase
            .from("history_analysis")
            .insert({
              user_id: userId,
              checklist_data: newCheckedItems
            });
        }
      } catch (error) {
        console.error("Error saving checklist:", error);
        toast.error("Erro ao salvar checklist");
      } finally {
        setIsSaving(false);
      }
    }
  };

  const completedCount = Object.values(checkedItems).filter(Boolean).length;
  const totalItems = DEFAULT_CHECKLIST.length;
  const progress = (completedCount / totalItems) * 100;

  // Group by day
  const groupedByDay = DEFAULT_CHECKLIST.reduce((acc, item) => {
    if (!acc[item.day]) {
      acc[item.day] = [];
    }
    acc[item.day].push(item);
    return acc;
  }, {} as Record<string, ChecklistItem[]>);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-4 w-full mb-4" />
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full mb-2" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ListTodo className="h-5 w-5 text-primary" />
            Checklist da Semana
          </div>
          {isSaving && (
            <span className="text-xs text-muted-foreground">Salvando...</span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progresso</span>
            <span className="font-semibold">{completedCount}/{totalItems}</span>
          </div>
          <Progress value={progress} className="h-2" />
          {progress === 100 && (
            <div className="flex items-center gap-2 text-green-500 text-sm">
              <Sparkles className="h-4 w-4" />
              <span>Parabéns! +5 pontos no Profile Score!</span>
            </div>
          )}
        </div>

        {/* Niche hint */}
        {niche && (
          <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-2">
            📌 Checklist otimizado para <strong>{niche}</strong>
          </p>
        )}

        {/* Checklist by day */}
        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
          {Object.entries(groupedByDay).map(([day, items]) => (
            <div key={day}>
              <h4 className="text-sm font-semibold text-muted-foreground mb-2">
                {day}
              </h4>
              <div className="space-y-2">
                {items.map((item) => (
                  <label
                    key={item.id}
                    className={`flex items-start gap-3 p-2 rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${
                      checkedItems[item.id] ? 'bg-green-500/10' : ''
                    }`}
                  >
                    <Checkbox
                      checked={checkedItems[item.id] || false}
                      onCheckedChange={() => handleCheck(item.id)}
                      className="mt-0.5"
                    />
                    <div className="flex-1">
                      <span className={`text-sm ${checkedItems[item.id] ? 'line-through text-muted-foreground' : ''}`}>
                        {item.task}
                      </span>
                      {item.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {item.description}
                        </p>
                      )}
                    </div>
                    {checkedItems[item.id] && (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    )}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
