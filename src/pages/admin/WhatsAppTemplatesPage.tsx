import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, MessageSquare, RefreshCw, Trash2, Eye, Sparkles, Loader2, AlertTriangle } from "lucide-react";

interface Template {
  id: string;
  template_name: string;
  template_id: string | null;
  category: string;
  language_code: string;
  header_text: string | null;
  body_text: string | null;
  footer_text: string | null;
  status: string;
  company_id: string;
  created_at: string;
}

interface Company {
  id: string;
  name: string;
  meta_configured: boolean;
}

// Validação do nome do template segundo as regras do Meta
const validateTemplateName = (name: string): string | null => {
  if (!name) return "Nome do template é obrigatório";
  if (name.length < 1 || name.length > 512) return "Nome deve ter entre 1 e 512 caracteres";
  const regex = /^[a-z][a-z0-9_]*$/;
  if (!regex.test(name)) {
    return "Nome deve começar com letra minúscula e usar apenas letras minúsculas, números e underscores (ex: welcome_message)";
  }
  return null;
};

// Sanitizar nome do template para formato Meta
const sanitizeTemplateName = (name: string): string => {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9_]/g, '_') // Substitui caracteres inválidos
    .replace(/_+/g, '_') // Remove underscores duplicados
    .replace(/^_|_$/g, '') // Remove underscores no início/fim
    .replace(/^[0-9]+/, ''); // Remove números do início
};

export default function WhatsAppTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  
  // AI Generation states
  const [showAIInput, setShowAIInput] = useState(false);
  const [aiObjective, setAiObjective] = useState("");
  const [generatingAI, setGeneratingAI] = useState(false);
  
  const [newTemplate, setNewTemplate] = useState({
    template_name: "",
    category: "MARKETING",
    language_code: "pt_PT",
    header_text: "",
    body_text: "",
    footer_text: ""
  });

  useEffect(() => {
    loadCompanies();
  }, []);

  useEffect(() => {
    if (selectedCompany) {
      loadTemplates();

      // Setup Realtime subscription for templates
      const channel = supabase
        .channel('whatsapp-templates-realtime')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'whatsapp_templates',
          filter: `company_id=eq.${selectedCompany}`
        }, () => {
          loadTemplates();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedCompany]);

  // Validate template name on change
  useEffect(() => {
    if (newTemplate.template_name) {
      setNameError(validateTemplateName(newTemplate.template_name));
    } else {
      setNameError(null);
    }
  }, [newTemplate.template_name]);

  const loadCompanies = async () => {
    const { data, error } = await supabase
      .from('companies')
      .select('id, name, meta_configured')
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

  const loadTemplates = async () => {
    const { data, error } = await supabase
      .from('whatsapp_templates')
      .select('*')
      .eq('company_id', selectedCompany)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setTemplates(data);
    }
  };

  const handleGenerateWithAI = async () => {
    if (!aiObjective.trim()) {
      toast.error("Descreva o objetivo do template");
      return;
    }

    setGeneratingAI(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-template-ai', {
        body: { 
          objective: aiObjective,
          language: newTemplate.language_code
        }
      });

      if (error) {
        console.error("Erro na função AI:", error);
        throw new Error(error.message || "Erro de rede ao contactar o servidor");
      }
      
      if (data?.error) {
        console.error("Erro retornado pela AI:", data.error);
        throw new Error(data.error);
      }

      // Sanitizar o nome sugerido pela IA
      const sanitizedName = data.suggested_name ? sanitizeTemplateName(data.suggested_name) : "";

      // Preencher campos automaticamente
      setNewTemplate(prev => ({
        ...prev,
        template_name: sanitizedName || prev.template_name,
        category: data.suggested_category || prev.category,
        header_text: data.header_text || "",
        body_text: data.body_text || "",
        footer_text: data.footer_text || ""
      }));

      // Mostrar avisos se houver
      if (data.warnings && data.warnings.length > 0) {
        toast.warning(`Avisos: ${data.warnings.join('. ')}`);
      } else {
        toast.success("Template gerado com sucesso! Revise e ajuste se necessário.");
      }

      setShowAIInput(false);
      setAiObjective("");

    } catch (error: unknown) {
      console.error("Erro completo:", error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao gerar template';
      toast.error(`Erro ao gerar com IA: ${errorMessage}`);
    } finally {
      setGeneratingAI(false);
    }
  };

  const handleCreateTemplate = async () => {
    // Validate required fields
    if (!newTemplate.template_name || !newTemplate.body_text) {
      toast.error("Nome e corpo do template são obrigatórios");
      return;
    }

    // Validate template name format
    const nameValidationError = validateTemplateName(newTemplate.template_name);
    if (nameValidationError) {
      toast.error(nameValidationError);
      return;
    }

    try {
        const { error } = await supabase
        .from('whatsapp_templates')
        .insert({
          ...newTemplate,
          company_id: selectedCompany,
          status: 'pending'
        });

      if (error) {
        console.error("Erro detalhado ao criar template:", error);
        
        // Parse specific error messages
        let errorMessage = "Erro ao criar template";
        
        if (error.code === '23505') {
          errorMessage = "Já existe um template com este nome para esta empresa";
        } else if (error.message?.includes('template_name')) {
          errorMessage = "Nome do template inválido. Use apenas letras minúsculas, números e underscores";
        } else if (error.message) {
          errorMessage = `Erro: ${error.message}`;
        }
        
        toast.error(errorMessage);
        return;
      }

      toast.success("Template criado com sucesso!");
      setDialogOpen(false);
      setNewTemplate({
        template_name: "",
        category: "MARKETING",
        language_code: "pt_PT",
        header_text: "",
        body_text: "",
        footer_text: ""
      });
      setShowAIInput(false);
      setAiObjective("");
      loadTemplates();
    } catch (error: unknown) {
      console.error("Erro inesperado:", error);
      const errorMessage = error instanceof Error ? error.message : 'Erro de rede';
      toast.error(`Falha ao criar template: ${errorMessage}`);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    const { error } = await supabase
      .from('whatsapp_templates')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error("Erro ao eliminar template");
      return;
    }

    toast.success("Template eliminado");
    loadTemplates();
  };

  const handleSyncTemplates = async () => {
    const company = companies.find(c => c.id === selectedCompany);
    if (!company?.meta_configured) {
      toast.error("Empresa não tem Meta configurado. Configure WABA ID e Access Token primeiro.");
      return;
    }

    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-whatsapp-templates', {
        body: { companyId: selectedCompany }
      });

      if (error) {
        console.error("Erro na sincronização:", error);
        throw new Error(error.message || "Erro de rede");
      }

      if (data?.error) {
        console.error("Erro retornado:", data.error);
        throw new Error(data.error);
      }

      toast.success(
        `Sincronização concluída: ${data.total} templates (${data.added} novos, ${data.updated} actualizados)`
      );
      loadTemplates();
    } catch (error: unknown) {
      console.error("Erro completo na sincronização:", error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast.error(`Erro na sincronização: ${errorMessage}`);
    } finally {
      setSyncing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      approved: "default",
      pending: "secondary",
      rejected: "destructive",
      draft: "outline",
      deleted_remotely: "destructive"
    };
    const labels: Record<string, string> = {
      approved: "Aprovado",
      pending: "Pendente",
      rejected: "Rejeitado",
      draft: "Rascunho",
      deleted_remotely: "Removido"
    };
    return <Badge variant={variants[status] || "outline"}>{labels[status] || status}</Badge>;
  };

  if (loading) {
    return <div className="p-6">A carregar...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Templates WhatsApp</h1>
          <p className="text-muted-foreground">Gerir templates de mensagens por empresa</p>
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
          
          <Button variant="outline" onClick={handleSyncTemplates} disabled={syncing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
            Sincronizar Meta
          </Button>
          
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) {
              setShowAIInput(false);
              setAiObjective("");
              setNameError(null);
            }
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Criar Template</DialogTitle>
                <DialogDescription>
                  Crie um novo template de mensagem WhatsApp
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                {/* AI Generation Section */}
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      <span className="font-medium">Assistente IA</span>
                    </div>
                    {!showAIInput && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setShowAIInput(true)}
                      >
                        <Sparkles className="h-4 w-4 mr-2" />
                        Gerar com IA
                      </Button>
                    )}
                  </div>
                  
                  {showAIInput && (
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label>Descreva o objetivo do template</Label>
                        <Input
                          value={aiObjective}
                          onChange={(e) => setAiObjective(e.target.value)}
                          placeholder="Ex: Boas-vindas após análise de site, Lembrete de reunião, Follow-up de proposta..."
                          disabled={generatingAI}
                        />
                        <p className="text-xs text-muted-foreground">
                          A IA vai criar o texto, sugerir nome e categoria, e validar para aprovação Meta
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          onClick={handleGenerateWithAI}
                          disabled={generatingAI || !aiObjective.trim()}
                          size="sm"
                        >
                          {generatingAI ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              A gerar...
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-4 w-4 mr-2" />
                              Gerar Template
                            </>
                          )}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setShowAIInput(false);
                            setAiObjective("");
                          }}
                          disabled={generatingAI}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nome do Template</Label>
                    <Input
                      value={newTemplate.template_name}
                      onChange={(e) => setNewTemplate(prev => ({ ...prev, template_name: e.target.value.toLowerCase() }))}
                      placeholder="welcome_message"
                      className={nameError ? "border-destructive" : ""}
                    />
                    {nameError && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        {nameError}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Apenas letras minúsculas, números e underscores
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Categoria</Label>
                    <Select
                      value={newTemplate.category}
                      onValueChange={(v) => setNewTemplate(prev => ({ ...prev, category: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MARKETING">Marketing</SelectItem>
                        <SelectItem value="UTILITY">Utility</SelectItem>
                        <SelectItem value="AUTHENTICATION">Authentication</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Idioma</Label>
                  <Select
                    value={newTemplate.language_code}
                    onValueChange={(v) => setNewTemplate(prev => ({ ...prev, language_code: v }))}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pt_PT">Português (PT)</SelectItem>
                      <SelectItem value="pt_BR">Português (BR)</SelectItem>
                      <SelectItem value="en_US">English (US)</SelectItem>
                      <SelectItem value="es_ES">Español</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Cabeçalho (opcional)</Label>
                  <Input
                    value={newTemplate.header_text}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, header_text: e.target.value }))}
                    placeholder="Título da mensagem"
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Corpo da Mensagem *</Label>
                    {!showAIInput && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => setShowAIInput(true)}
                      >
                        <Sparkles className="h-3 w-3 mr-1" />
                        Gerar com IA
                      </Button>
                    )}
                  </div>
                  <Textarea
                    value={newTemplate.body_text}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, body_text: e.target.value }))}
                    placeholder="Olá {{1}}, bem-vindo à nossa plataforma!"
                    rows={5}
                  />
                  <p className="text-xs text-muted-foreground">
                    Use {"{{1}}"}, {"{{2}}"}, etc. para variáveis. Formatação: *negrito*, _itálico_
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label>Rodapé (opcional)</Label>
                  <Input
                    value={newTemplate.footer_text}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, footer_text: e.target.value }))}
                    placeholder="Responda STOP para cancelar"
                  />
                </div>

                {/* Preview */}
                {newTemplate.body_text && (
                  <div className="space-y-2">
                    <Label>Pré-visualização</Label>
                    <div className="bg-muted rounded-lg p-4 space-y-2">
                      {newTemplate.header_text && (
                        <p className="font-bold text-sm">{newTemplate.header_text}</p>
                      )}
                      <p className="whitespace-pre-wrap text-sm">
                        {newTemplate.body_text
                          .replace(/\*([^*]+)\*/g, '**$1**')
                          .replace(/\{\{1\}\}/g, 'João')
                          .replace(/\{\{2\}\}/g, 'Empresa XYZ')
                          .replace(/\{\{3\}\}/g, '[Valor]')}
                      </p>
                      {newTemplate.footer_text && (
                        <p className="text-xs text-muted-foreground">{newTemplate.footer_text}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateTemplate} disabled={!!nameError}>
                  Criar Template
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Templates ({templates.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {templates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum template encontrado</p>
              <p className="text-sm">Crie um novo template ou sincronize com o Meta</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Idioma</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell className="font-medium">{template.template_name}</TableCell>
                    <TableCell>{template.category}</TableCell>
                    <TableCell>{template.language_code}</TableCell>
                    <TableCell>{getStatusBadge(template.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setPreviewTemplate(template)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteTemplate(template.id)}
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

      {/* Preview Dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{previewTemplate?.template_name}</DialogTitle>
            <DialogDescription>
              {previewTemplate?.category} • {previewTemplate?.language_code}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {previewTemplate?.header_text && (
              <div>
                <Label className="text-xs text-muted-foreground">Cabeçalho</Label>
                <p className="font-medium">{previewTemplate.header_text}</p>
              </div>
            )}
            <div>
              <Label className="text-xs text-muted-foreground">Corpo</Label>
              <p className="whitespace-pre-wrap">{previewTemplate?.body_text}</p>
            </div>
            {previewTemplate?.footer_text && (
              <div>
                <Label className="text-xs text-muted-foreground">Rodapé</Label>
                <p className="text-sm text-muted-foreground">{previewTemplate.footer_text}</p>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground">Status:</Label>
              {previewTemplate && getStatusBadge(previewTemplate.status)}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
