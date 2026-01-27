import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { 
  History, Calendar as CalendarIcon, Instagram, Youtube, Linkedin, 
  TrendingUp, Filter, Eye, Target, Sparkles 
} from "lucide-react";
import { format, parseISO, startOfMonth, endOfMonth, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import ScoreCircle from "@/components/analysis/ScoreCircle";

interface AnalysisRecord {
  id: string;
  target_url: string | null;
  platform: string | null;
  score: number | null;
  niche_detected: string | null;
  current_followers: number | null;
  created_at: string;
}

const TikTokIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

export default function ProfileHistoryPage() {
  const navigate = useNavigate();
  const [analyses, setAnalyses] = useState<AnalysisRecord[]>([]);
  const [filteredAnalyses, setFilteredAnalyses] = useState<AnalysisRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [analysisDates, setAnalysisDates] = useState<Date[]>([]);

  useEffect(() => {
    fetchAllAnalyses();
  }, []);

  useEffect(() => {
    filterAnalyses();
  }, [analyses, platformFilter, selectedDate]);

  const fetchAllAnalyses = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("history_analysis")
        .select("id, target_url, platform, score, niche_detected, current_followers, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setAnalyses(data || []);
      
      // Extract unique dates for calendar heatmap
      const dates = (data || []).map(a => parseISO(a.created_at));
      setAnalysisDates(dates);
    } catch (error) {
      console.error("Error fetching analyses:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterAnalyses = () => {
    let filtered = [...analyses];

    if (platformFilter !== "all") {
      filtered = filtered.filter(a => a.platform?.toLowerCase() === platformFilter);
    }

    if (selectedDate) {
      filtered = filtered.filter(a => 
        isSameDay(parseISO(a.created_at), selectedDate)
      );
    }

    setFilteredAnalyses(filtered);
  };

  const getPlatformIcon = (platform: string | null) => {
    switch (platform?.toLowerCase()) {
      case "instagram": return <Instagram className="h-4 w-4 text-pink-400" />;
      case "youtube": return <Youtube className="h-4 w-4 text-red-400" />;
      case "linkedin": return <Linkedin className="h-4 w-4 text-blue-400" />;
      case "tiktok": return <TikTokIcon />;
      default: return <Target className="h-4 w-4 text-cyan-400" />;
    }
  };

  const extractUsername = (url: string | null): string => {
    if (!url) return "Perfil";
    const match = url.match(/(?:@)?([a-zA-Z0-9._-]+)(?:\/)?$/);
    return match ? `@${match[1]}` : "Perfil";
  };

  const formatFollowers = (count: number | null): string => {
    if (!count) return "N/A";
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  // Calculate stats
  const totalAnalyses = analyses.length;
  const avgScore = analyses.length > 0 
    ? Math.round(analyses.reduce((sum, a) => sum + (a.score || 0), 0) / analyses.length)
    : 0;
  const uniqueProfiles = new Set(analyses.map(a => a.target_url)).size;

  // Calendar day highlight
  const isDayHighlighted = (date: Date) => {
    return analysisDates.some(d => isSameDay(d, date));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <History className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Histórico Global</h1>
            <p className="text-muted-foreground">Todas as suas análises de perfil</p>
          </div>
        </div>
        
        <Button
          onClick={() => navigate("/dashboard/radar")}
          className="bg-gradient-to-r from-cyan-500 to-blue-600"
        >
          <Sparkles className="h-4 w-4 mr-2" />
          Nova Análise
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-cyan-950/30 to-cyan-900/10 border-cyan-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-cyan-400/80">Total de Análises</p>
                <p className="text-3xl font-bold text-cyan-400">{totalAnalyses}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-cyan-400/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-950/30 to-purple-900/10 border-purple-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-400/80">Score Médio</p>
                <p className="text-3xl font-bold text-purple-400">{avgScore}/100</p>
              </div>
              <Target className="h-8 w-8 text-purple-400/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-950/30 to-green-900/10 border-green-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-400/80">Perfis Únicos</p>
                <p className="text-3xl font-bold text-green-400">{uniqueProfiles}</p>
              </div>
              <History className="h-8 w-8 text-green-400/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-card border-border">
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Filtrar:</span>
            </div>
            
            <Select value={platformFilter} onValueChange={setPlatformFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Plataforma" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="youtube">YouTube</SelectItem>
                <SelectItem value="linkedin">LinkedIn</SelectItem>
                <SelectItem value="tiktok">TikTok</SelectItem>
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-40">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  {selectedDate ? format(selectedDate, "dd/MM/yyyy") : "Data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  locale={ptBR}
                  modifiers={{
                    highlighted: isDayHighlighted
                  }}
                  modifiersStyles={{
                    highlighted: {
                      backgroundColor: 'hsl(var(--primary) / 0.2)',
                      color: 'hsl(var(--primary))',
                      fontWeight: 'bold'
                    }
                  }}
                />
              </PopoverContent>
            </Popover>

            {selectedDate && (
              <Button variant="ghost" size="sm" onClick={() => setSelectedDate(undefined)}>
                Limpar data
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Analyses List */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            Análises ({filteredAnalyses.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredAnalyses.length === 0 ? (
            <div className="text-center py-12">
              <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                {analyses.length === 0 
                  ? "Nenhuma análise encontrada. Faça a sua primeira análise!"
                  : "Nenhuma análise corresponde aos filtros selecionados."
                }
              </p>
              {analyses.length === 0 && (
                <Button onClick={() => navigate("/dashboard/radar")}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Iniciar Primeira Análise
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAnalyses.map((analysis) => (
                <Card 
                  key={analysis.id}
                  className="bg-muted/30 border-border/50 hover:border-primary/50 transition-all cursor-pointer group"
                  onClick={() => navigate(`/dashboard/profile-result/${analysis.id}`)}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-2">
                        {getPlatformIcon(analysis.platform)}
                        <span className="font-medium text-foreground">
                          {extractUsername(analysis.target_url)}
                        </span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {analysis.platform || "Social"}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between mb-4">
                      <ScoreCircle score={analysis.score || 0} size={60} />
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Seguidores</p>
                        <p className="text-lg font-semibold text-foreground">
                          {formatFollowers(analysis.current_followers)}
                        </p>
                      </div>
                    </div>

                    {analysis.niche_detected && (
                      <Badge className="bg-primary/20 text-primary border-primary/30 mb-3">
                        {analysis.niche_detected}
                      </Badge>
                    )}

                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        {format(parseISO(analysis.created_at), "dd MMM yyyy, HH:mm", { locale: ptBR })}
                      </p>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Ver
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
