import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, MessageCircle, Send, Users, UserPlus, ListChecks } from "lucide-react";
import { useWhatsAppSend } from "@/hooks/useWhatsAppSend";
import { SendTemplateModal } from "@/components/whatsapp/SendTemplateModal";
import { useUserCompany } from "@/hooks/useUserCompany";
import LeadCaptureSection from "@/components/leads/LeadCaptureSection";
import ScheduledMessagesList from "@/components/leads/ScheduledMessagesList";

interface Lead {
  id: string;
  full_name: string;
  email: string;
  whatsapp: string | null;
  company_name: string | null;
  status: string | null;
  created_at: string;
  company_id: string | null;
}

const LeadsPage = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  
  const { openWhatsAppWeb } = useWhatsAppSend();
  const { activeCompany, loading: companyLoading } = useUserCompany();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserId(user.id);
    }
  };

  const fetchLeads = async () => {
    if (!activeCompany?.id) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .eq("company_id", activeCompany.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setLeads(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!companyLoading && activeCompany?.id) {
      fetchLeads();
    } else if (!companyLoading && !activeCompany) {
      setLoading(false);
    }
  }, [activeCompany?.id, companyLoading]);

  // Realtime subscription for leads
  useEffect(() => {
    if (!activeCompany?.id) return;

    console.log("[LeadsPage] Setting up realtime subscription for company:", activeCompany.id);

    const channel = supabase
      .channel('leads-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leads',
          filter: `company_id=eq.${activeCompany.id}`
        },
        (payload) => {
          console.log("[LeadsPage] Lead changed:", payload);
          
          if (payload.eventType === 'INSERT') {
            setLeads(prev => [payload.new as Lead, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setLeads(prev => prev.map(lead => 
              lead.id === (payload.new as Lead).id ? payload.new as Lead : lead
            ));
          } else if (payload.eventType === 'DELETE') {
            setLeads(prev => prev.filter(lead => lead.id !== (payload.old as Lead).id));
          }
        }
      )
      .subscribe();

    return () => {
      console.log("[LeadsPage] Cleaning up realtime subscription");
      supabase.removeChannel(channel);
    };
  }, [activeCompany?.id]);

  const handleSendWhatsApp = (lead: Lead) => {
    if (!lead.whatsapp) return;
    
    // Se a empresa tem Meta configurado, abre o modal de templates
    if (activeCompany?.meta_configured) {
      setSelectedLead(lead);
      setTemplateModalOpen(true);
    } else {
      // Fallback para WhatsApp Web
      const message = `Olá ${lead.full_name}! Obrigado pelo seu interesse. Como posso ajudá-lo hoje?`;
      openWhatsAppWeb(lead.whatsapp, message);
    }
  };

  const handleOpenWhatsAppWeb = (lead: Lead) => {
    if (!lead.whatsapp) return;
    
    const message = `Olá ${lead.full_name}! Obrigado pelo seu interesse. Como posso ajudá-lo hoje?`;
    openWhatsAppWeb(lead.whatsapp, message);
  };

  if (loading || companyLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!activeCompany) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-foreground">Gestão de Leads</h1>
        <Card className="bg-card border-border panel-shadow">
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">
              Empresa não configurada. Entre em contacto com o administrador.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestão de Leads</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Empresa: {activeCompany.name}
          </p>
        </div>
        {activeCompany?.meta_configured && (
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
            Meta API Conectada
          </Badge>
        )}
      </div>

      <Tabs defaultValue="leads" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="leads" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Leads ({leads.length})
          </TabsTrigger>
          <TabsTrigger value="capture" className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Capturar
          </TabsTrigger>
          <TabsTrigger value="scheduled" className="flex items-center gap-2">
            <ListChecks className="h-4 w-4" />
            Agendadas
          </TabsTrigger>
        </TabsList>

        {/* Leads List Tab */}
        <TabsContent value="leads" className="space-y-4">
          {leads.length === 0 ? (
            <Card className="bg-card border-border panel-shadow">
              <CardContent className="py-8">
                <p className="text-center text-muted-foreground">
                  Nenhum lead encontrado. Os leads capturados aparecerão aqui.
                </p>
              </CardContent>
            </Card>
          ) : (
            leads.map((lead) => (
              <Card key={lead.id} className="bg-card border-border panel-shadow hover:glow-soft transition-smooth">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg text-foreground">{lead.full_name}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="border-primary text-primary">
                        {lead.status || "novo"}
                      </Badge>
                      {lead.whatsapp && (
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleSendWhatsApp(lead)}
                            className="text-green-500 hover:text-green-400 hover:bg-green-500/10"
                            title={activeCompany?.meta_configured ? "Enviar Template via Meta API" : "Abrir WhatsApp Web"}
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleOpenWhatsAppWeb(lead)}
                            className="text-green-500 hover:text-green-400 hover:bg-green-500/10"
                            title="Abrir WhatsApp Web"
                          >
                            <MessageCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <p className="text-muted-foreground">
                      <span className="font-medium text-foreground">Email:</span> {lead.email}
                    </p>
                    {lead.whatsapp && (
                      <p className="text-muted-foreground">
                        <span className="font-medium text-foreground">WhatsApp:</span> {lead.whatsapp}
                      </p>
                    )}
                    {lead.company_name && (
                      <p className="text-muted-foreground">
                        <span className="font-medium text-foreground">Empresa:</span> {lead.company_name}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Capturado em: {new Date(lead.created_at).toLocaleDateString("pt-PT")}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Capture Tab */}
        <TabsContent value="capture">
          {userId && (
            <LeadCaptureSection 
              userId={userId} 
              companyName={activeCompany.name}
            />
          )}
        </TabsContent>

        {/* Scheduled Messages Tab */}
        <TabsContent value="scheduled">
          {userId && (
            <ScheduledMessagesList userId={userId} />
          )}
        </TabsContent>
      </Tabs>

      {/* Modal de Seleção de Template */}
      {selectedLead && (
        <SendTemplateModal
          open={templateModalOpen}
          onOpenChange={setTemplateModalOpen}
          recipientPhone={selectedLead.whatsapp || ""}
          recipientName={selectedLead.full_name}
          leadId={selectedLead.id}
          onSuccess={() => {
            setSelectedLead(null);
          }}
        />
      )}
    </div>
  );
};

export default LeadsPage;