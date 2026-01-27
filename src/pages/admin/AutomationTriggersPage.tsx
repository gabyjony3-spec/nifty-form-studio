import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Zap, Trash2, Play, Pause } from "lucide-react";

interface Trigger {
  id: string;
  name: string;
  trigger_event: string;
  action_type: string;
  template_id: string | null;
  delay_minutes: number;
  is_active: boolean;
  executions_count: number;
  last_executed_at: string | null;
  company_id: string;
  created_at: string;
}

interface Template {
  id: string;
  template_name: string;
  status: string;
}

interface Company {
  id: string;
  name: string;
}

const TRIGGER_EVENTS = [
  { value: "new_lead", label: "Novo Lead" },
  { value: "new_analysis_lead", label: "Lead de Análise" },
  { value: "lead_status_change", label: "Mudança de Status" },
  { value: "meta_ad_conversion", label: "Conversão Meta Ads" },
  { value: "form_submission", label: "Submissão de Formulário" },
  { value: "manual", label: "Disparo Manual" }
];

const ACTION_TYPES = [
  { value: "send_template", label: "Enviar Template" },
  { value: "send_text", label: "Enviar Texto" },
  { value: "webhook", label: "Chamar Webhook" }
];

export default function AutomationTriggersPage() {
  const [triggers, setTriggers] = useState<Trigger[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const [newTrigger, setNewTrigger] = useState({
    name: "",
    trigger_event: "new_lead",
    action_type: "send_template",
    template_id: "",
    delay_minutes: 0
  });

  useEffect(() => {
    loadCompanies();
  }, []);

  useEffect(() => {
    if (selectedCompany) {
      loadTriggers();
      loadTemplates();
    }
  }, [selectedCompany]);

  const loadCompanies = async () => {
    const { data, error } = await supabase
      .from('companies')
      .select('id, name')
      .eq('is_active', true)
      .order('name');

    if (!error && data) {
      setCompanies(data);
      if (data.length > 0) {
        setSelectedCompany(data[0].id);
      }
    }
    setLoading(false);
  };

  const loadTriggers = async () => {
    const { data, error } = await supabase
      .from('automation_triggers')
      .select('*')
      .eq('company_id', selectedCompany)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setTriggers(data);
    }
  };

  const loadTemplates = async () => {
    const { data, error } = await supabase
      .from('whatsapp_templates')
      .select('id, template_name, status')
      .eq('company_id', selectedCompany);

    if (!error && data) {
      setTemplates(data);
    }
  };

  const handleCreateTrigger = async () => {
    if (!newTrigger.name || !newTrigger.trigger_event) {
      toast.error("Nome e evento são obrigatórios");
      return;
    }

    if (newTrigger.action_type === "send_template" && !newTrigger.template_id) {
      toast.error("Selecione um template");
      return;
    }

    const { error } = await supabase
      .from('automation_triggers')
      .insert({
        ...newTrigger,
        template_id: newTrigger.template_id || null,
        company_id: selectedCompany,
        is_active: true
      });

    if (error) {
      toast.error("Erro ao criar automação");
      return;
    }

    toast.success("Automação criada com sucesso");
    setDialogOpen(false);
    setNewTrigger({
      name: "",
      trigger_event: "new_lead",
      action_type: "send_template",
      template_id: "",
      delay_minutes: 0
    });
    loadTriggers();
  };

  const handleToggleActive = async (id: string, currentState: boolean) => {
    const { error } = await supabase
      .from('automation_triggers')
      .update({ is_active: !currentState })
      .eq('id', id);

    if (error) {
      toast.error("Erro ao atualizar automação");
      return;
    }

    toast.success(`Automação ${!currentState ? 'ativada' : 'desativada'}`);
    loadTriggers();
  };

  const handleDeleteTrigger = async (id: string) => {
    const { error } = await supabase
      .from('automation_triggers')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error("Erro ao eliminar automação");
      return;
    }

    toast.success("Automação eliminada");
    loadTriggers();
  };

  const getEventLabel = (event: string) => {
    return TRIGGER_EVENTS.find(e => e.value === event)?.label || event;
  };

  const getActionLabel = (action: string) => {
    return ACTION_TYPES.find(a => a.value === action)?.label || action;
  };

  const getTemplateName = (templateId: string | null) => {
    if (!templateId) return "-";
    return templates.find(t => t.id === templateId)?.template_name || "Template não encontrado";
  };

  if (loading) {
    return <div className="p-6">A carregar...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Automações</h1>
          <p className="text-muted-foreground">Configurar triggers automáticos por empresa</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedCompany} onValueChange={setSelectedCompany}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Selecionar empresa" />
            </SelectTrigger>
            <SelectContent>
              {companies.map(company => (
                <SelectItem key={company.id} value={company.id}>
                  {company.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nova Automação
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Criar Automação</DialogTitle>
                <DialogDescription>
                  Configure um trigger automático para envio de mensagens
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label>Nome da Automação</Label>
                  <Input
                    value={newTrigger.name}
                    onChange={(e) => setNewTrigger(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Boas-vindas a novos leads"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Evento Trigger</Label>
                  <Select
                    value={newTrigger.trigger_event}
                    onValueChange={(v) => setNewTrigger(prev => ({ ...prev, trigger_event: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TRIGGER_EVENTS.map(event => (
                        <SelectItem key={event.value} value={event.value}>
                          {event.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Tipo de Ação</Label>
                  <Select
                    value={newTrigger.action_type}
                    onValueChange={(v) => setNewTrigger(prev => ({ ...prev, action_type: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ACTION_TYPES.map(action => (
                        <SelectItem key={action.value} value={action.value}>
                          {action.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {newTrigger.action_type === "send_template" && (
                  <div className="space-y-2">
                    <Label>Template</Label>
                    <Select
                      value={newTrigger.template_id}
                      onValueChange={(v) => setNewTrigger(prev => ({ ...prev, template_id: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar template" />
                      </SelectTrigger>
                      <SelectContent>
                        {templates.map(template => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.template_name}
                            {template.status !== 'approved' && ` (${template.status})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {templates.length === 0 && (
                      <p className="text-xs text-muted-foreground">
                        Crie templates primeiro na página de Templates
                      </p>
                    )}
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label>Delay (minutos)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={newTrigger.delay_minutes}
                    onChange={(e) => setNewTrigger(prev => ({ ...prev, delay_minutes: parseInt(e.target.value) || 0 }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    0 = envio imediato
                  </p>
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateTrigger}>
                  Criar Automação
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total de Automações</CardDescription>
            <CardTitle className="text-3xl">{triggers.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Ativas</CardDescription>
            <CardTitle className="text-3xl text-green-600">
              {triggers.filter(t => t.is_active).length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total de Execuções</CardDescription>
            <CardTitle className="text-3xl">
              {triggers.reduce((sum, t) => sum + (t.executions_count || 0), 0)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Automações ({triggers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {triggers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma automação configurada para esta empresa
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Evento</TableHead>
                  <TableHead>Ação</TableHead>
                  <TableHead>Template</TableHead>
                  <TableHead>Delay</TableHead>
                  <TableHead>Execuções</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {triggers.map(trigger => (
                  <TableRow key={trigger.id}>
                    <TableCell className="font-medium">{trigger.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{getEventLabel(trigger.trigger_event)}</Badge>
                    </TableCell>
                    <TableCell>{getActionLabel(trigger.action_type || 'send_template')}</TableCell>
                    <TableCell className="max-w-[150px] truncate">
                      {getTemplateName(trigger.template_id)}
                    </TableCell>
                    <TableCell>{trigger.delay_minutes || 0} min</TableCell>
                    <TableCell>{trigger.executions_count || 0}</TableCell>
                    <TableCell>
                      <Badge variant={trigger.is_active ? "default" : "secondary"}>
                        {trigger.is_active ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleActive(trigger.id, trigger.is_active || false)}
                        >
                          {trigger.is_active ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteTrigger(trigger.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
