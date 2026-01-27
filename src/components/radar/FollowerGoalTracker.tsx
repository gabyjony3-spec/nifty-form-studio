import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Target, TrendingUp, Users } from "lucide-react";
interface FollowerGoalTrackerProps {
  userId: string | null;
  historyId?: string;
  initialGoal?: number | null;
  currentFollowers?: number | null;
}
export function FollowerGoalTracker({
  userId,
  historyId,
  initialGoal,
  currentFollowers: initialFollowers
}: FollowerGoalTrackerProps) {
  const [goal, setGoal] = useState<number>(initialGoal || 0);
  const [currentFollowers, setCurrentFollowers] = useState<number>(initialFollowers || 0);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const loadFollowers = async () => {
      if (!userId) return;
      try {
        // Try to get followers from social_accounts
        const {
          data
        } = await supabase.from("social_accounts").select("followers_count").eq("user_id", userId).limit(1).maybeSingle();
        if (data?.followers_count) {
          setCurrentFollowers(data.followers_count);
        } else if (initialFollowers) {
          setCurrentFollowers(initialFollowers);
        }
        if (initialGoal) {
          setGoal(initialGoal);
        }
      } catch (error) {
        console.error("Error loading followers:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadFollowers();
  }, [userId, initialFollowers, initialGoal]);
  const handleSaveGoal = async () => {
    if (!userId) return;
    setIsSaving(true);
    try {
      if (historyId) {
        await supabase.from("history_analysis").update({
          follower_goal: goal,
          current_followers: currentFollowers
        }).eq("id", historyId);
      } else {
        await supabase.from("history_analysis").insert({
          user_id: userId,
          follower_goal: goal,
          current_followers: currentFollowers
        });
      }
      setIsEditing(false);
      toast.success("Meta salva com sucesso!");
    } catch (error) {
      console.error("Error saving goal:", error);
      toast.error("Erro ao salvar meta");
    } finally {
      setIsSaving(false);
    }
  };
  const progress = goal > 0 ? Math.min(currentFollowers / goal * 100, 100) : 0;
  const remaining = Math.max(goal - currentFollowers, 0);
  if (isLoading) {
    return <Card className="glass-card">
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </CardContent>
      </Card>;
  }

  // Empty state - no goal set
  if (!goal || goal === 0) {
    return;
  }

  // Goal is set - show progress
  return <Card className="glass-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Target className="h-5 w-5 text-cyan-400" />
          Meta de Seguidores
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Atual</span>
          <span className="font-bold text-foreground">{currentFollowers.toLocaleString()}</span>
        </div>
        
        <Progress value={progress} className="h-3 bg-muted/30" />
        
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Meta</span>
          <span className="font-bold text-cyan-400">{goal.toLocaleString()}</span>
        </div>

        <div className="pt-2 border-t border-border/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-400" />
              <span className="text-sm text-muted-foreground">
                Faltam {remaining.toLocaleString()} seguidores
              </span>
            </div>
            <Button onClick={() => setIsEditing(true)} variant="ghost" size="sm" className="text-xs">
              Editar
            </Button>
          </div>
        </div>

        {isEditing && <div className="flex items-center gap-2 pt-2">
            <Input type="number" value={goal} onChange={e => setGoal(Number(e.target.value))} className="bg-background/50" />
            <Button onClick={handleSaveGoal} disabled={isSaving} size="sm" className="bg-gradient-to-r from-cyan-600 to-blue-600">
              {isSaving ? "..." : "Salvar"}
            </Button>
            <Button onClick={() => setIsEditing(false)} variant="ghost" size="sm">
              Cancelar
            </Button>
          </div>}
      </CardContent>
    </Card>;
}