import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { isSameDay, parseISO, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Instagram, Youtube, Linkedin, Target, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface AnalysisDate {
  id: string;
  date: Date;
  platform: string | null;
  score: number | null;
  target_url: string | null;
}

interface ReportCalendarProps {
  onDateSelect?: (date: Date | undefined) => void;
}

const TikTokIcon = () => (
  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

export function ReportCalendar({ onDateSelect }: ReportCalendarProps) {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [analysisData, setAnalysisData] = useState<AnalysisDate[]>([]);
  const [selectedDayAnalyses, setSelectedDayAnalyses] = useState<AnalysisDate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalysisDates();
  }, []);

  useEffect(() => {
    if (selectedDate) {
      const dayAnalyses = analysisData.filter(a => isSameDay(a.date, selectedDate));
      setSelectedDayAnalyses(dayAnalyses);
    } else {
      setSelectedDayAnalyses([]);
    }
  }, [selectedDate, analysisData]);

  const fetchAnalysisDates = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("history_analysis")
        .select("id, created_at, platform, score, target_url")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const transformed = (data || []).map(item => ({
        id: item.id,
        date: parseISO(item.created_at),
        platform: item.platform,
        score: item.score,
        target_url: item.target_url
      }));

      setAnalysisData(transformed);
    } catch (error) {
      console.error("Error fetching analysis dates:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    onDateSelect?.(date);
  };

  const getPlatformIcon = (platform: string | null) => {
    switch (platform?.toLowerCase()) {
      case "instagram": return <Instagram className="h-3 w-3 text-pink-400" />;
      case "youtube": return <Youtube className="h-3 w-3 text-red-400" />;
      case "linkedin": return <Linkedin className="h-3 w-3 text-blue-400" />;
      case "tiktok": return <TikTokIcon />;
      default: return <Target className="h-3 w-3 text-cyan-400" />;
    }
  };

  const extractUsername = (url: string | null): string => {
    if (!url) return "Perfil";
    const match = url.match(/(?:@)?([a-zA-Z0-9._-]+)(?:\/)?$/);
    return match ? `@${match[1]}` : "Perfil";
  };

  // Count analyses per day for heatmap intensity
  const getAnalysisCount = (date: Date): number => {
    return analysisData.filter(a => isSameDay(a.date, date)).length;
  };

  const isDayHighlighted = (date: Date) => {
    return getAnalysisCount(date) > 0;
  };

  // Calculate heatmap intensity
  const getHeatmapStyle = (date: Date) => {
    const count = getAnalysisCount(date);
    if (count === 0) return {};
    
    const opacity = Math.min(0.2 + (count * 0.15), 0.8);
    return {
      backgroundColor: `hsl(var(--primary) / ${opacity})`,
      color: count >= 3 ? 'white' : 'hsl(var(--primary))',
      fontWeight: 'bold' as const,
      borderRadius: '50%'
    };
  };

  return (
    <div className="space-y-4">
      <Calendar
        mode="single"
        selected={selectedDate}
        onSelect={handleDateSelect}
        locale={ptBR}
        modifiers={{
          highlighted: isDayHighlighted
        }}
        modifiersStyles={{
          highlighted: {
            backgroundColor: 'hsl(var(--primary) / 0.3)',
            color: 'hsl(var(--primary))',
            fontWeight: 'bold'
          }
        }}
        className="rounded-md border"
      />

      {/* Heatmap Legend */}
      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <span>Menos</span>
        <div className="flex gap-1">
          {[0.2, 0.4, 0.6, 0.8].map((opacity, i) => (
            <div 
              key={i}
              className="h-4 w-4 rounded"
              style={{ backgroundColor: `hsl(var(--primary) / ${opacity})` }}
            />
          ))}
        </div>
        <span>Mais</span>
      </div>

      {/* Selected Day Analyses */}
      {selectedDate && (
        <div className="border-t pt-4">
          <p className="text-sm font-medium mb-2">
            {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
            <Badge variant="outline" className="ml-2">
              {selectedDayAnalyses.length} análise{selectedDayAnalyses.length !== 1 ? 's' : ''}
            </Badge>
          </p>
          
          {selectedDayAnalyses.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma análise neste dia</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {selectedDayAnalyses.map((analysis) => (
                <div
                  key={analysis.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                  onClick={() => navigate(`/dashboard/profile-result/${analysis.id}`)}
                >
                  <div className="flex items-center gap-2">
                    {getPlatformIcon(analysis.platform)}
                    <span className="text-sm font-medium">
                      {extractUsername(analysis.target_url)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="outline"
                      className={
                        analysis.score && analysis.score >= 70 ? "text-green-400 border-green-500/50" :
                        analysis.score && analysis.score >= 50 ? "text-yellow-400 border-yellow-500/50" :
                        "text-red-400 border-red-500/50"
                      }
                    >
                      {analysis.score || 0}
                    </Badge>
                    <Eye className="h-3 w-3 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
