import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Megaphone,
  Check,
  X,
  Eye,
  Loader2,
  RefreshCw,
  Image,
  Target,
  Euro,
  User,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Campaign {
  id: string;
  name: string;
  website_url: string;
  status: string;
  daily_budget: number;
  objective: string;
  ai_headline: string | null;
  ai_copy: string | null;
  creative_url: string | null;
  target_audience: any;
  created_at: string;
  user_id: string;
  user_email?: string;
  user_name?: string;
}

const AdminCampaignsPage = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [processing, setProcessing] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchCampaigns();
    
    // Setup realtime subscription
    const channel = supabase
      .channel('admin-campaigns')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ad_campaigns' },
        () => {
          fetchCampaigns();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const { data: campaignsData, error } = await supabase
        .from('ad_campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch user emails for each campaign
      const campaignsWithUsers = await Promise.all(
        (campaignsData || []).map(async (campaign) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('email, full_name')
            .eq('id', campaign.user_id)
            .maybeSingle();

          return {
            ...campaign,
            user_email: profile?.email || 'N/A',
            user_name: profile?.full_name || 'N/A',
          };
        })
      );

      setCampaigns(campaignsWithUsers);
    } catch (error: any) {
      console.error('Error fetching campaigns:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as campanhas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (campaign: Campaign) => {
    setProcessing(campaign.id);
    try {
      const { error } = await supabase
        .from('ad_campaigns')
        .update({ status: 'approved' })
        .eq('id', campaign.id);

      if (error) throw error;

      // Create notification for user
      await supabase.from('notifications').insert({
        user_id: campaign.user_id,
        type: 'campaign_approved',
        title: 'Campanha Aprovada! 🎉',
        message: `A sua campanha "${campaign.name}" foi aprovada e está pronta para publicação.`,
        data: { campaignId: campaign.id },
      });

      toast({
        title: "Campanha Aprovada",
        description: `A campanha "${campaign.name}" foi aprovada com sucesso.`,
      });

      fetchCampaigns();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async () => {
    if (!selectedCampaign) return;
    
    setProcessing(selectedCampaign.id);
    try {
      const { error } = await supabase
        .from('ad_campaigns')
        .update({
          status: 'rejected',
          ad_variations: { reject_reason: rejectReason },
        })
        .eq('id', selectedCampaign.id);

      if (error) throw error;

      // Create notification for user
      await supabase.from('notifications').insert({
        user_id: selectedCampaign.user_id,
        type: 'campaign_rejected',
        title: 'Campanha Rejeitada',
        message: `A sua campanha "${selectedCampaign.name}" foi rejeitada. Motivo: ${rejectReason}`,
        data: { campaignId: selectedCampaign.id, reason: rejectReason },
      });

      toast({
        title: "Campanha Rejeitada",
        description: `A campanha foi rejeitada e o cliente foi notificado.`,
      });

      setRejectOpen(false);
      setRejectReason("");
      setSelectedCampaign(null);
      fetchCampaigns();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setProcessing(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; className: string }> = {
      draft: { label: "Rascunho", className: "bg-muted text-muted-foreground" },
      pending: { label: "Pendente", className: "bg-yellow-500/20 text-yellow-600 border-yellow-500/30" },
      approved: { label: "Aprovada", className: "bg-green-500/20 text-green-600 border-green-500/30" },
      rejected: { label: "Rejeitada", className: "bg-red-500/20 text-red-600 border-red-500/30" },
      active: { label: "Ativa", className: "bg-blue-500/20 text-blue-600 border-blue-500/30" },
    };

    const badge = badges[status] || { label: status, className: "bg-muted" };
    return <Badge className={badge.className}>{badge.label}</Badge>;
  };

  const filteredCampaigns = campaigns.filter(
    (c) => statusFilter === "all" || c.status === statusFilter
  );

  const pendingCount = campaigns.filter((c) => c.status === "pending").length;
  const draftCount = campaigns.filter((c) => c.status === "draft").length;
  const approvedCount = campaigns.filter((c) => c.status === "approved").length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Megaphone className="h-6 w-6 text-primary" />
            Gestão de Campanhas Meta Ads
          </h1>
          <p className="text-muted-foreground mt-1">
            Aprove ou rejeite campanhas de anúncios dos utilizadores
          </p>
        </div>
        <Button onClick={fetchCampaigns} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{campaigns.length}</p>
              </div>
              <Megaphone className="h-8 w-8 text-muted-foreground/30" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-yellow-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-600">Pendentes</p>
                <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-yellow-500/20 flex items-center justify-center">
                <Loader2 className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Rascunhos</p>
                <p className="text-2xl font-bold">{draftCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600">Aprovadas</p>
                <p className="text-2xl font-bold text-green-600">{approvedCount}</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-green-500/20 flex items-center justify-center">
                <Check className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">Filtrar por status:</span>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="draft">Rascunhos</SelectItem>
                <SelectItem value="approved">Aprovadas</SelectItem>
                <SelectItem value="rejected">Rejeitadas</SelectItem>
                <SelectItem value="active">Ativas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Campaigns Table */}
      <Card>
        <CardHeader>
          <CardTitle>Campanhas ({filteredCampaigns.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredCampaigns.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma campanha encontrada
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Campanha</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Orçamento</TableHead>
                  <TableHead>Objetivo</TableHead>
                  <TableHead>Criada em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCampaigns.map((campaign) => (
                  <TableRow key={campaign.id}>
                    <TableCell>{getStatusBadge(campaign.status || "draft")}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{campaign.name}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {campaign.website_url}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm">{campaign.user_name}</p>
                          <p className="text-xs text-muted-foreground">{campaign.user_email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Euro className="h-3 w-3" />
                        {campaign.daily_budget || 0}/dia
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {campaign.objective || "REACH"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(campaign.created_at), "dd MMM yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedCampaign(campaign);
                            setDetailsOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {campaign.status === "pending" && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-green-600 hover:text-green-700 hover:bg-green-500/10"
                              onClick={() => handleApprove(campaign)}
                              disabled={processing === campaign.id}
                            >
                              {processing === campaign.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Check className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-500/10"
                              onClick={() => {
                                setSelectedCampaign(campaign);
                                setRejectOpen(true);
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Campaign Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes da Campanha</DialogTitle>
          </DialogHeader>
          {selectedCampaign && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Nome</label>
                  <p className="font-medium">{selectedCampaign.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <p>{getStatusBadge(selectedCampaign.status || "draft")}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">URL</label>
                  <p className="text-sm">{selectedCampaign.website_url}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Orçamento Diário</label>
                  <p>€{selectedCampaign.daily_budget || 0}</p>
                </div>
              </div>

              {selectedCampaign.ai_headline && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Headline (IA)</label>
                  <p className="p-2 bg-muted rounded-md">{selectedCampaign.ai_headline}</p>
                </div>
              )}

              {selectedCampaign.ai_copy && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Copy (IA)</label>
                  <p className="p-2 bg-muted rounded-md whitespace-pre-wrap">{selectedCampaign.ai_copy}</p>
                </div>
              )}

              {selectedCampaign.creative_url && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Criativo</label>
                  <div className="mt-2">
                    <img
                      src={selectedCampaign.creative_url}
                      alt="Ad creative"
                      className="max-w-full h-auto rounded-lg border"
                    />
                  </div>
                </div>
              )}

              {selectedCampaign.target_audience && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Público-Alvo
                  </label>
                  <div className="p-2 bg-muted rounded-md mt-1 text-sm">
                    <pre className="whitespace-pre-wrap">
                      {JSON.stringify(selectedCampaign.target_audience, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsOpen(false)}>
              Fechar
            </Button>
            {selectedCampaign?.status === "pending" && (
              <>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setDetailsOpen(false);
                    setRejectOpen(true);
                  }}
                >
                  <X className="h-4 w-4 mr-2" />
                  Rejeitar
                </Button>
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => {
                    handleApprove(selectedCampaign);
                    setDetailsOpen(false);
                  }}
                >
                  <Check className="h-4 w-4 mr-2" />
                  Aprovar
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar Campanha</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Por favor, indique o motivo da rejeição. O cliente será notificado.
            </p>
            <Textarea
              placeholder="Motivo da rejeição..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectReason.trim() || processing === selectedCampaign?.id}
            >
              {processing === selectedCampaign?.id ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <X className="h-4 w-4 mr-2" />
              )}
              Confirmar Rejeição
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCampaignsPage;
