import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  UsersRound, 
  UserPlus, 
  Mail, 
  Copy, 
  Check,
  Shield,
  Eye,
  Edit,
  Trash2,
  Loader2
} from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface TeamInvite {
  id: string;
  email: string;
  role: string;
  status: string;
  token: string;
  created_at: string;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: "admin" | "editor" | "viewer";
  status: "active" | "pending";
}

const roleLabels: Record<string, string> = {
  admin: "Administrador",
  editor: "Editor",
  viewer: "Visualizador"
};

const roleColors: Record<string, string> = {
  admin: "bg-primary/20 text-primary border-primary/30",
  editor: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  viewer: "bg-muted text-muted-foreground border-border"
};

const roleIcons: Record<string, React.ElementType> = {
  admin: Shield,
  editor: Edit,
  viewer: Eye
};

const TeamPage = () => {
  const [inviteEmail, setInviteEmail] = useState("");
  const [copied, setCopied] = useState(false);
  const [invites, setInvites] = useState<TeamInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadInvites();
  }, []);

  const loadInvites = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    setUserId(user.id);

    const { data, error } = await supabase
      .from("team_invites")
      .select("*")
      .eq("team_owner_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading invites:", error);
    } else {
      setInvites(data || []);
    }
    setLoading(false);
  };

  const generateToken = () => {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  };

  const shareLink = userId ? `${window.location.origin}/invite/${generateToken()}` : "";

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    toast({
      title: "Link copiado!",
      description: "O link de partilha foi copiado para a área de transferência"
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInvite = async () => {
    if (!inviteEmail || !userId) return;
    
    setSending(true);
    const token = generateToken();

    const { error } = await supabase
      .from("team_invites")
      .insert({
        team_owner_id: userId,
        email: inviteEmail,
        role: "viewer",
        token: token,
        status: "pending"
      });

    if (error) {
      console.error("Error sending invite:", error);
      toast({
        title: "Erro ao enviar convite",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Convite enviado!",
        description: `Um convite foi enviado para ${inviteEmail}`
      });
      setInviteEmail("");
      loadInvites();
    }
    setSending(false);
  };

  const handleDeleteInvite = async (id: string) => {
    const { error } = await supabase
      .from("team_invites")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Erro ao remover convite",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Convite removido",
        description: "O convite foi removido com sucesso"
      });
      loadInvites();
    }
  };

  const teamMembers: TeamMember[] = [
    {
      id: "owner",
      name: "Você",
      email: "owner@example.com",
      role: "admin",
      status: "active"
    },
    ...invites.map((invite) => ({
      id: invite.id,
      name: invite.email.split("@")[0],
      email: invite.email,
      role: invite.role as "admin" | "editor" | "viewer",
      status: invite.status === "accepted" ? "active" as const : "pending" as const
    }))
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center">
          <UsersRound className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Equipa</h1>
          <p className="text-muted-foreground">Partilhe o dashboard com programadores ou colaboradores</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Convidar Membro */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="bg-card border-border panel-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <UserPlus className="h-5 w-5 text-primary" />
                Convidar Membro
              </CardTitle>
              <CardDescription>
                Adicione um programador ou colaborador à sua equipa
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground">Email do colaborador</Label>
                <div className="flex gap-2">
                  <Input
                    id="email"
                    type="email"
                    placeholder="programador@empresa.pt"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="bg-input border-border text-foreground"
                  />
                  <Button onClick={handleInvite} disabled={!inviteEmail || sending}>
                    {sending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Mail className="h-4 w-4 mr-2" />
                        Convidar
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">ou partilhe o link</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-foreground">Link de partilha</Label>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={shareLink}
                    className="bg-muted border-border text-muted-foreground"
                  />
                  <Button variant="outline" onClick={handleCopyLink}>
                    {copied ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Qualquer pessoa com este link pode ver o seu dashboard (apenas leitura)
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Lista de Membros */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-card border-border panel-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <UsersRound className="h-5 w-5 text-primary" />
                Membros da Equipa
              </CardTitle>
              <CardDescription>
                {teamMembers.length} membro{teamMembers.length !== 1 ? "s" : ""}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <div className="space-y-3">
                  {teamMembers.map((member, index) => {
                    const RoleIcon = roleIcons[member.role];
                    return (
                      <motion.div
                        key={member.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                            <span className="text-sm font-medium text-primary">
                              {member.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-foreground">{member.name}</p>
                              {member.status === "pending" && (
                                <Badge variant="outline" className="text-xs">Pendente</Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">{member.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={`${roleColors[member.role]} border flex items-center gap-1`}>
                            <RoleIcon className="h-3 w-3" />
                            {roleLabels[member.role]}
                          </Badge>
                          {member.id !== "owner" && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              onClick={() => handleDeleteInvite(member.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {!loading && teamMembers.length === 1 && (
                <div className="mt-6 p-4 bg-muted/20 rounded-lg border border-dashed border-border text-center">
                  <p className="text-sm text-muted-foreground">
                    Ainda não tem colaboradores. Convide um programador para ajudar com as melhorias técnicas.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Info Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="bg-card border-border panel-shadow">
          <CardContent className="p-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium text-foreground">Administrador</h4>
                  <p className="text-xs text-muted-foreground">Acesso total a todas as funcionalidades e configurações</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                  <Edit className="h-5 w-5 text-yellow-400" />
                </div>
                <div>
                  <h4 className="font-medium text-foreground">Editor</h4>
                  <p className="text-xs text-muted-foreground">Pode executar análises e ver resultados detalhados</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  <Eye className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <h4 className="font-medium text-foreground">Visualizador</h4>
                  <p className="text-xs text-muted-foreground">Apenas pode visualizar análises e relatórios</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default TeamPage;
