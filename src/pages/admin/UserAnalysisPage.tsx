import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Radar, Users, TrendingUp, Calendar, Eye } from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface HistoryAnalysis {
  id: string;
  user_id: string;
  target_url: string | null;
  platform: string | null;
  score: number | null;
  niche_detected: string | null;
  created_at: string | null;
  profile_score_breakdown: any;
  full_report_json: any;
  profiles?: {
    email: string | null;
    full_name: string | null;
  };
}

export default function UserAnalysisPage() {
  const [analyses, setAnalyses] = useState<HistoryAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchEmail, setSearchEmail] = useState("");
  const [searchDate, setSearchDate] = useState("");
  const [selectedAnalysis, setSelectedAnalysis] = useState<HistoryAnalysis | null>(null);

  useEffect(() => {
    fetchAnalyses();
    
    // Setup realtime subscription
    const channel = supabase
      .channel("admin-analysis-updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "history_analysis",
        },
        () => {
          fetchAnalyses();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchAnalyses = async () => {
    try {
      // Fetch analyses
      const { data: analysisData, error: analysisError } = await supabase
        .from("history_analysis")
        .select("*")
        .order("created_at", { ascending: false });

      if (analysisError) throw analysisError;

      // Fetch profiles for each analysis
      const userIds = [...new Set(analysisData?.map(a => a.user_id) || [])];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, email, full_name")
        .in("id", userIds);

      const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);

      const enrichedData = (analysisData || []).map(analysis => ({
        ...analysis,
        profiles: profilesMap.get(analysis.user_id) || { email: null, full_name: null }
      }));

      setAnalyses(enrichedData);
    } catch (error) {
      console.error("Error fetching analyses:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAnalyses = analyses.filter((analysis) => {
    const emailMatch = searchEmail
      ? analysis.profiles?.email?.toLowerCase().includes(searchEmail.toLowerCase())
      : true;
    const dateMatch = searchDate
      ? analysis.created_at?.includes(searchDate)
      : true;
    return emailMatch && dateMatch;
  });

  const stats = {
    total: analyses.length,
    avgScore: analyses.length > 0 
      ? Math.round(analyses.filter(a => a.score).reduce((acc, a) => acc + (a.score || 0), 0) / analyses.filter(a => a.score).length)
      : 0,
    todayCount: analyses.filter(a => 
      a.created_at && new Date(a.created_at).toDateString() === new Date().toDateString()
    ).length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-red-400">Análises de Utilizadores</h1>
        <p className="text-red-300/70">Visualize todas as análises do Radar de Nicho em tempo real</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-red-950/50 to-gray-900/50 border-red-800/30">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-red-500/20">
              <Radar className="h-6 w-6 text-red-400" />
            </div>
            <div>
              <p className="text-sm text-red-300/70">Total de Análises</p>
              <p className="text-2xl font-bold text-red-100">{stats.total}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-950/50 to-gray-900/50 border-red-800/30">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-green-500/20">
              <TrendingUp className="h-6 w-6 text-green-400" />
            </div>
            <div>
              <p className="text-sm text-red-300/70">Score Médio</p>
              <p className="text-2xl font-bold text-red-100">{stats.avgScore}%</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-950/50 to-gray-900/50 border-red-800/30">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-blue-500/20">
              <Calendar className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-red-300/70">Análises Hoje</p>
              <p className="text-2xl font-bold text-red-100">{stats.todayCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-gradient-to-br from-red-950/50 to-gray-900/50 border-red-800/30">
        <CardHeader>
          <CardTitle className="text-red-400 flex items-center gap-2">
            <Search className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm text-red-300">Pesquisar por Email</label>
              <Input
                placeholder="exemplo@email.com"
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                className="bg-red-950/30 border-red-800/50 text-red-100"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-red-300">Filtrar por Data</label>
              <Input
                type="date"
                value={searchDate}
                onChange={(e) => setSearchDate(e.target.value)}
                className="bg-red-950/30 border-red-800/50 text-red-100"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="bg-gradient-to-br from-red-950/50 to-gray-900/50 border-red-800/30">
        <CardHeader>
          <CardTitle className="text-red-400 flex items-center gap-2">
            <Users className="h-5 w-5" />
            Histórico de Análises ({filteredAnalyses.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full bg-red-900/20" />
              ))}
            </div>
          ) : filteredAnalyses.length === 0 ? (
            <div className="text-center py-12">
              <Radar className="h-12 w-12 mx-auto text-red-500/50 mb-4" />
              <p className="text-red-300">Nenhuma análise encontrada</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-red-800/30">
                    <TableHead className="text-red-300">Utilizador</TableHead>
                    <TableHead className="text-red-300">Plataforma</TableHead>
                    <TableHead className="text-red-300">URL Analisada</TableHead>
                    <TableHead className="text-red-300">Nicho</TableHead>
                    <TableHead className="text-red-300">Score</TableHead>
                    <TableHead className="text-red-300">Data</TableHead>
                    <TableHead className="text-red-300">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAnalyses.map((analysis) => (
                    <TableRow key={analysis.id} className="border-red-800/30 hover:bg-red-950/30">
                      <TableCell>
                        <div>
                          <p className="font-medium text-red-100">
                            {analysis.profiles?.full_name || "N/A"}
                          </p>
                          <p className="text-xs text-red-300/70">
                            {analysis.profiles?.email || "N/A"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {analysis.platform ? (
                          <Badge variant="outline" className="border-red-600 text-red-400">
                            {analysis.platform}
                          </Badge>
                        ) : (
                          <span className="text-red-300/50">-</span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-red-300">
                        {analysis.target_url || "-"}
                      </TableCell>
                      <TableCell>
                        {analysis.niche_detected ? (
                          <Badge className="bg-red-600/20 text-red-400 border-red-600/30">
                            {analysis.niche_detected}
                          </Badge>
                        ) : (
                          <span className="text-red-300/50">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {analysis.score !== null ? (
                          <span className={`font-bold ${
                            analysis.score >= 70 ? "text-green-400" :
                            analysis.score >= 50 ? "text-yellow-400" : "text-red-400"
                          }`}>
                            {analysis.score}%
                          </span>
                        ) : (
                          <span className="text-red-300/50">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-red-300">
                        {analysis.created_at
                          ? format(new Date(analysis.created_at), "dd/MM/yyyy HH:mm", { locale: pt })
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedAnalysis(analysis)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-950/50"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedAnalysis} onOpenChange={() => setSelectedAnalysis(null)}>
        <DialogContent className="max-w-2xl bg-gray-900 border-red-800/30">
          <DialogHeader>
            <DialogTitle className="text-red-400">Detalhes da Análise</DialogTitle>
          </DialogHeader>
          {selectedAnalysis && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-red-300/70">Utilizador</p>
                  <p className="font-medium text-red-100">{selectedAnalysis.profiles?.full_name}</p>
                  <p className="text-xs text-red-300/50">{selectedAnalysis.profiles?.email}</p>
                </div>
                <div>
                  <p className="text-sm text-red-300/70">Score</p>
                  <p className="text-2xl font-bold text-red-100">{selectedAnalysis.score || 0}%</p>
                </div>
              </div>
              
              {selectedAnalysis.profile_score_breakdown && (
                <div>
                  <p className="text-sm text-red-300/70 mb-2">Breakdown do Score</p>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(selectedAnalysis.profile_score_breakdown).map(([key, value]) => (
                      <div key={key} className="flex justify-between p-2 bg-red-950/30 rounded">
                        <span className="text-red-300 capitalize">{key}</span>
                        <span className="text-red-100 font-medium">{String(value)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedAnalysis.full_report_json && (
                <div>
                  <p className="text-sm text-red-300/70 mb-2">Relatório Completo</p>
                  <pre className="p-4 bg-red-950/30 rounded text-xs text-red-200 overflow-auto max-h-60">
                    {JSON.stringify(selectedAnalysis.full_report_json, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
