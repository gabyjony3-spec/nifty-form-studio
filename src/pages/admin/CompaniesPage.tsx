import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Building2, 
  Plus, 
  Users, 
  Settings,
  Loader2,
  CheckCircle,
  XCircle,
  RefreshCw,
  Pencil,
  Trash2,
  Save,
  Eye,
  EyeOff,
  MessageSquare
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

interface Company {
  id: string;
  name: string;
  slug: string | null;
  plan: string;
  whatsapp_credits: number;
  is_active: boolean;
  meta_configured: boolean;
  created_at: string;
  user_count?: number;
  phone_number_id?: string | null;
  waba_id?: string | null;
  whatsapp_access_token?: string | null;
}

const CompaniesPage = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Edit state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [editName, setEditName] = useState("");
  const [editPlan, setEditPlan] = useState("");
  const [editCredits, setEditCredits] = useState("");
  const [saving, setSaving] = useState(false);
  
  // Meta credentials state
  const [editPhoneNumberId, setEditPhoneNumberId] = useState("");
  const [editWabaId, setEditWabaId] = useState("");
  const [editAccessToken, setEditAccessToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  
  // Delete state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingCompany, setDeletingCompany] = useState<Company | null>(null);
  const [deleting, setDeleting] = useState(false);
  
  // Form fields
  const [newCompanyName, setNewCompanyName] = useState("");
  const [newCompanyPlan, setNewCompanyPlan] = useState("trial");
  const [newCompanyCredits, setNewCompanyCredits] = useState("10");

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    setLoading(true);
    try {
      // Fetch companies
      const { data: companiesData, error } = await supabase
        .from("companies")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch user counts for each company
      const { data: userCounts } = await supabase
        .from("company_users")
        .select("company_id");

      const countMap = new Map<string, number>();
      userCounts?.forEach(cu => {
        countMap.set(cu.company_id, (countMap.get(cu.company_id) || 0) + 1);
      });

      const companiesWithCounts = (companiesData as Company[]).map(c => ({
        ...c,
        user_count: countMap.get(c.id) || 0
      }));

      setCompanies(companiesWithCounts);
    } catch (error) {
      console.error("Error loading companies:", error);
      toast({
        title: "Erro ao carregar",
        description: "Não foi possível carregar as empresas",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createCompany = async () => {
    if (!newCompanyName.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Insira um nome para a empresa",
        variant: "destructive"
      });
      return;
    }

    setCreating(true);
    try {
      const slug = newCompanyName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      
      const { data, error } = await supabase
        .from("companies")
        .insert({
          name: newCompanyName,
          slug,
          plan: newCompanyPlan,
          whatsapp_credits: parseInt(newCompanyCredits) || 10
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Empresa Criada! ✅",
        description: `${newCompanyName} foi criada com sucesso`
      });

      setNewCompanyName("");
      setNewCompanyPlan("trial");
      setNewCompanyCredits("10");
      setDialogOpen(false);
      loadCompanies();
    } catch (error: any) {
      console.error("Error creating company:", error);
      toast({
        title: "Erro ao criar",
        description: error.message || "Não foi possível criar a empresa",
        variant: "destructive"
      });
    } finally {
      setCreating(false);
    }
  };

  const toggleCompanyStatus = async (companyId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("companies")
        .update({ is_active: !currentStatus })
        .eq("id", companyId);

      if (error) throw error;

      toast({
        title: currentStatus ? "Empresa Desativada" : "Empresa Ativada",
        description: currentStatus ? "A empresa foi desativada" : "A empresa foi reativada"
      });

      loadCompanies();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível alterar o status",
        variant: "destructive"
      });
    }
  };

  // Edit company
  const openEditDialog = (company: Company) => {
    setEditingCompany(company);
    setEditName(company.name);
    setEditPlan(company.plan);
    setEditCredits(company.whatsapp_credits.toString());
    setEditPhoneNumberId(company.phone_number_id || "");
    setEditWabaId(company.waba_id || "");
    setEditAccessToken(company.whatsapp_access_token || "");
    setShowToken(false);
    setEditDialogOpen(true);
  };

  const saveCompanyEdit = async () => {
    if (!editingCompany || !editName.trim()) return;

    setSaving(true);
    try {
      const slug = editName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      
      // Limpar Phone Number ID (apenas dígitos)
      const cleanPhoneId = editPhoneNumberId.replace(/\D/g, '');
      
      // Verificar se Meta está configurado
      const metaConfigured = !!(cleanPhoneId && editAccessToken);
      
      const { error } = await supabase
        .from("companies")
        .update({
          name: editName,
          slug,
          plan: editPlan,
          whatsapp_credits: parseInt(editCredits) || 0,
          phone_number_id: cleanPhoneId || null,
          waba_id: editWabaId || null,
          whatsapp_access_token: editAccessToken || null,
          meta_configured: metaConfigured
        })
        .eq("id", editingCompany.id);

      if (error) throw error;

      toast({
        title: metaConfigured ? "Empresa e Meta Configurados! ✅" : "Empresa Atualizada! ✅",
        description: metaConfigured 
          ? `${editName} - Integração Meta ativa` 
          : `${editName} foi atualizada com sucesso`
      });

      setEditDialogOpen(false);
      setEditingCompany(null);
      loadCompanies();
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar",
        description: error.message || "Não foi possível atualizar a empresa",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const testMetaConnection = async () => {
    if (!editPhoneNumberId || !editAccessToken) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha Phone Number ID e Access Token",
        variant: "destructive"
      });
      return;
    }
    
    setTestingConnection(true);
    try {
      const cleanPhoneId = editPhoneNumberId.replace(/\D/g, '');
      const response = await fetch(
        `https://graph.facebook.com/v19.0/${cleanPhoneId}`,
        {
          headers: { 'Authorization': `Bearer ${editAccessToken}` }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Conexão verificada! ✅",
          description: `Número: ${data.display_phone_number || cleanPhoneId}`
        });
      } else {
        const error = await response.json();
        toast({
          title: "Erro na conexão",
          description: error.error?.message || "Verifique as credenciais Meta",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Erro no teste",
        description: "Não foi possível verificar a conexão com a API Meta",
        variant: "destructive"
      });
    } finally {
      setTestingConnection(false);
    }
  };

  // Delete company
  const openDeleteDialog = (company: Company) => {
    setDeletingCompany(company);
    setDeleteDialogOpen(true);
  };

  const deleteCompany = async () => {
    if (!deletingCompany) return;

    // Check if has users
    if (deletingCompany.user_count && deletingCompany.user_count > 0) {
      toast({
        title: "Não é possível excluir",
        description: "Esta empresa tem utilizadores associados. Remova-os primeiro.",
        variant: "destructive"
      });
      setDeleteDialogOpen(false);
      return;
    }

    setDeleting(true);
    try {
      const { error } = await supabase
        .from("companies")
        .delete()
        .eq("id", deletingCompany.id);

      if (error) throw error;

      toast({
        title: "Empresa Excluída",
        description: `${deletingCompany.name} foi excluída com sucesso`
      });

      setDeleteDialogOpen(false);
      setDeletingCompany(null);
      loadCompanies();
    } catch (error: any) {
      toast({
        title: "Erro ao excluir",
        description: error.message || "Não foi possível excluir a empresa",
        variant: "destructive"
      });
    } finally {
      setDeleting(false);
    }
  };

  const getPlanBadge = (plan: string) => {
    switch (plan) {
      case "trial":
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Trial</Badge>;
      case "pro":
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Pro</Badge>;
      case "business":
        return <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">Business</Badge>;
      case "elite":
        return <Badge className="bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-400 border-amber-500/30">Elite</Badge>;
      default:
        return <Badge variant="outline">{plan}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestão de Empresas</h1>
          <p className="text-muted-foreground">Gerir clientes SaaS e suas configurações</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadCompanies} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nova Empresa
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Nova Empresa</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Nome da Empresa *</Label>
                  <Input
                    placeholder="Ex: Acme Marketing"
                    value={newCompanyName}
                    onChange={(e) => setNewCompanyName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Plano</Label>
                  <Select value={newCompanyPlan} onValueChange={setNewCompanyPlan}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="trial">Trial (10 créditos)</SelectItem>
                      <SelectItem value="pro">Pro (100 créditos/mês)</SelectItem>
                      <SelectItem value="business">Business (500 créditos/mês)</SelectItem>
                      <SelectItem value="elite">Elite (Ilimitado + IA Premium)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Créditos Iniciais</Label>
                  <Input
                    type="number"
                    placeholder="10"
                    value={newCompanyCredits}
                    onChange={(e) => setNewCompanyCredits(e.target.value)}
                  />
                </div>
                <Button onClick={createCompany} disabled={creating} className="w-full">
                  {creating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                  Criar Empresa
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-card border-border">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Empresas</p>
                <p className="text-2xl font-bold text-foreground">{companies.length}</p>
              </div>
              <Building2 className="h-8 w-8 text-primary/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ativas</p>
                <p className="text-2xl font-bold text-green-400">
                  {companies.filter(c => c.is_active).length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Com Meta Configurado</p>
                <p className="text-2xl font-bold text-blue-400">
                  {companies.filter(c => c.meta_configured).length}
                </p>
              </div>
              <Settings className="h-8 w-8 text-blue-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Utilizadores</p>
                <p className="text-2xl font-bold text-foreground">
                  {companies.reduce((acc, c) => acc + (c.user_count || 0), 0)}
                </p>
              </div>
              <Users className="h-8 w-8 text-primary/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Companies Table */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Empresas</CardTitle>
          <CardDescription>{companies.length} empresa(s) registrada(s)</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : companies.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma empresa criada</p>
              <p className="text-sm">Crie a primeira empresa para começar</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead>Créditos</TableHead>
                    <TableHead>Utilizadores</TableHead>
                    <TableHead>Meta API</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Criada</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {companies.map((company) => (
                    <TableRow key={company.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-foreground">{company.name}</p>
                          <p className="text-xs text-muted-foreground">{company.slug}</p>
                        </div>
                      </TableCell>
                      <TableCell>{getPlanBadge(company.plan)}</TableCell>
                      <TableCell>
                        <span className="font-medium">
                          {company.plan === 'business' ? '∞' : company.whatsapp_credits}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          {company.user_count || 0}
                        </div>
                      </TableCell>
                      <TableCell>
                        {company.meta_configured ? (
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Sim
                          </Badge>
                        ) : (
                          <Badge className="bg-muted text-muted-foreground">
                            <XCircle className="h-3 w-3 mr-1" />
                            Não
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {company.is_active ? (
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Ativa</Badge>
                        ) : (
                          <Badge className="bg-destructive/20 text-destructive border-destructive/30">Inativa</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(company.created_at), "dd/MM/yyyy", { locale: pt })}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(company)}
                            title="Editar empresa"
                          >
                            <Pencil className="h-4 w-4 text-primary" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleCompanyStatus(company.id, company.is_active)}
                            title={company.is_active ? "Desativar" : "Ativar"}
                          >
                            {company.is_active ? (
                              <XCircle className="h-4 w-4 text-orange-500" />
                            ) : (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDeleteDialog(company)}
                            title="Excluir empresa"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Empresa</DialogTitle>
            <DialogDescription>Altere as informações da empresa e configure a integração Meta</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Dados da Empresa */}
            <div className="space-y-2">
              <Label>Nome da Empresa</Label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Plano</Label>
                <Select value={editPlan} onValueChange={setEditPlan}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="trial">Trial</SelectItem>
                    <SelectItem value="pro">Pro</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                    <SelectItem value="elite">Elite</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Créditos</Label>
                <Input
                  type="number"
                  value={editCredits}
                  onChange={(e) => setEditCredits(e.target.value)}
                />
              </div>
            </div>

            <Separator className="my-4" />

            {/* Secção Meta WhatsApp */}
            <div>
              <p className="text-sm font-medium mb-3 flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-[#25D366]" />
                Configuração Meta WhatsApp
              </p>
              
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Phone Number ID *</Label>
                  <Input
                    placeholder="Ex: 123456789012345"
                    value={editPhoneNumberId}
                    onChange={(e) => setEditPhoneNumberId(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">WhatsApp Business Account ID (WABA)</Label>
                  <Input
                    placeholder="Ex: 987654321098765"
                    value={editWabaId}
                    onChange={(e) => setEditWabaId(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Access Token Permanente *</Label>
                  <div className="flex gap-2">
                    <Input
                      type={showToken ? "text" : "password"}
                      placeholder="EAAxxxxxxxx..."
                      value={editAccessToken}
                      onChange={(e) => setEditAccessToken(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setShowToken(!showToken)}
                    >
                      {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={testMetaConnection}
                  disabled={testingConnection || !editPhoneNumberId || !editAccessToken}
                  className="w-full"
                >
                  {testingConnection ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Testar Conexão Meta
                </Button>
              </div>
            </div>

            <Separator className="my-4" />

            <Button onClick={saveCompanyEdit} disabled={saving} className="w-full">
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Guardar Alterações
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem a certeza que deseja excluir a empresa <strong>{deletingCompany?.name}</strong>?
              Esta ação não pode ser revertida.
              {deletingCompany?.user_count && deletingCompany.user_count > 0 && (
                <span className="block mt-2 text-destructive">
                  ⚠️ Esta empresa tem {deletingCompany.user_count} utilizador(es) associado(s).
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteCompany}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CompaniesPage;
