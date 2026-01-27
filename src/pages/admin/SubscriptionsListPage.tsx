import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Crown, Users, Loader2, Zap, Calendar, Wrench, Search, History, Coins, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, differenceInDays } from "date-fns";
import { pt } from "date-fns/locale";
import SubscriptionFilters from "@/components/admin/SubscriptionFilters";
import RegistrationsChart from "@/components/admin/RegistrationsChart";

interface UserWithSubscription {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  trial_ends_at: string | null;
  has_lifetime_access: boolean | null;
  created_at: string | null;
  credits?: number | null;
  plan_override?: string | null;
  subscription?: {
    id: string;
    plan: string;
    status: string;
    current_period_end?: string | null;
  } | null;
  lastActivity?: string | null;
  hasCompany?: boolean;
}

interface ActivityLog {
  id: string;
  action: string;
  old_value: any;
  new_value: any;
  notes: string | null;
  created_at: string;
}

const PLAN_OPTIONS = [
  { value: "starter", label: "Starter (5 créditos)" },
  { value: "pro", label: "Pro (50 créditos)" },
  { value: "elite", label: "Elite (Ilimitado)" },
  { value: "vitacile", label: "Vitacile (Vitalício)" },
];

const SubscriptionsListPage = () => {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserWithSubscription[]>([]);
  const [dateFilter, setDateFilter] = useState<{ start: Date | null; end: Date | null }>({
    start: null,
    end: null,
  });
  const [upgradingUserId, setUpgradingUserId] = useState<string | null>(null);
  const [repairingUserId, setRepairingUserId] = useState<string | null>(null);
  const [creditsToAdd, setCreditsToAdd] = useState<{ [key: string]: string }>({});
  const [addingCredits, setAddingCredits] = useState<string | null>(null);
  const [searchEmail, setSearchEmail] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserWithSubscription | null>(null);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  useEffect(() => {
    fetchUsersWithSubscriptions();
  }, []);

  const fetchUsersWithSubscriptions = async () => {
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, email, avatar_url, trial_ends_at, has_lifetime_access, created_at, credits, plan_override")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      const { data: subscriptions, error: subsError } = await supabase
        .from("subscriptions")
        .select("id, user_id, plan, status, current_period_end");

      if (subsError) throw subsError;

      const { data: activities } = await supabase
        .from("website_analysis")
        .select("user_id, analyzed_at")
        .order("analyzed_at", { ascending: false });

      const { data: companyUsers } = await supabase
        .from("company_users")
        .select("user_id");

      const usersWithCompany = new Set(companyUsers?.map(cu => cu.user_id) || []);

      const usersWithSubs: UserWithSubscription[] = (profiles || []).map((profile) => {
        const subscription = subscriptions?.find((s) => s.user_id === profile.id);
        const lastAct = activities?.find((a) => a.user_id === profile.id);

        return {
          ...profile,
          subscription: subscription
            ? { id: subscription.id, plan: subscription.plan || "basic", status: subscription.status || "trial", current_period_end: subscription.current_period_end }
            : null,
          lastActivity: lastAct?.analyzed_at || null,
          hasCompany: usersWithCompany.has(profile.id),
        };
      });

      setUsers(usersWithSubs);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Erro ao carregar utilizadores");
    } finally {
      setLoading(false);
    }
  };

  const fetchActivityLogs = async (userId: string) => {
    setLoadingLogs(true);
    try {
      const { data } = await supabase
        .from("admin_activity_logs")
        .select("*")
        .eq("target_user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10);
      
      setActivityLogs(data || []);
    } catch (error) {
      console.error("Error fetching logs:", error);
    } finally {
      setLoadingLogs(false);
    }
  };

  const logAdminAction = async (targetUserId: string, action: string, oldValue: any, newValue: any, notes?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from("admin_activity_logs").insert({
        admin_id: user.id,
        target_user_id: targetUserId,
        action,
        old_value: oldValue,
        new_value: newValue,
        notes,
      });
    } catch (error) {
      console.error("Error logging action:", error);
    }
  };

  const openUserModal = (user: UserWithSubscription) => {
    setSelectedUser(user);
    fetchActivityLogs(user.id);
  };

  const filteredUsers = useMemo(() => {
    if (!dateFilter.start) return users;

    return users.filter((user) => {
      if (!user.created_at) return false;
      const createdAt = new Date(user.created_at);
      const isAfterStart = createdAt >= dateFilter.start!;
      const isBeforeEnd = !dateFilter.end || createdAt <= dateFilter.end;
      return isAfterStart && isBeforeEnd;
    });
  }, [users, dateFilter]);

  const searchFilteredUsers = useMemo(() => {
    if (!searchEmail.trim()) return filteredUsers;
    return filteredUsers.filter(u => 
      u.email?.toLowerCase().includes(searchEmail.toLowerCase()) ||
      u.full_name?.toLowerCase().includes(searchEmail.toLowerCase())
    );
  }, [filteredUsers, searchEmail]);

  const { proUsers, freeUsers } = useMemo(() => {
    const pro = searchFilteredUsers.filter((u) => {
      if (u.has_lifetime_access) return true;
      if (u.subscription?.status === "active" && (u.subscription.plan === "advanced" || u.subscription.plan === "pro_ai")) return true;
      return false;
    });

    const free = searchFilteredUsers.filter((u) => {
      if (u.has_lifetime_access) return false;
      if (u.subscription?.status === "active" && (u.subscription.plan === "advanced" || u.subscription.plan === "pro_ai")) return false;
      return true;
    });

    return { proUsers: pro, freeUsers: free };
  }, [searchFilteredUsers]);

  const chartData = useMemo(() => {
    return users.map((u) => ({
      id: u.id,
      created_at: u.created_at || new Date().toISOString(),
      isPro:
        u.has_lifetime_access ||
        (u.subscription?.status === "active" && (u.subscription.plan === "advanced" || u.subscription.plan === "pro_ai")),
    }));
  }, [users]);

  const handlePlanChange = async (userId: string, newPlan: string) => {
    setUpgradingUserId(userId);
    const user = users.find(u => u.id === userId);
    const oldPlan = user?.plan_override || user?.subscription?.plan || "starter";
    
    try {
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ 
          plan_override: newPlan,
          credits: newPlan === "elite" || newPlan === "vitacile" ? 9999 : newPlan === "pro" ? 50 : 5,
          has_lifetime_access: newPlan === "vitacile"
        })
        .eq("id", userId);

      if (profileError) throw profileError;

      await logAdminAction(userId, "change_plan", { plan: oldPlan }, { plan: newPlan }, `Plano alterado para ${newPlan}`);

      toast.success(`Plano atualizado para ${PLAN_OPTIONS.find(p => p.value === newPlan)?.label}!`);
      fetchUsersWithSubscriptions();
    } catch (error) {
      console.error("Error updating plan:", error);
      toast.error("Erro ao atualizar plano");
    } finally {
      setUpgradingUserId(null);
    }
  };

  const handleMakeLifetime = async (userId: string) => {
    setUpgradingUserId(userId);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ has_lifetime_access: true, plan_override: "vitacile", credits: 9999 })
        .eq("id", userId);

      if (error) throw error;

      await logAdminAction(userId, "grant_lifetime", { has_lifetime_access: false }, { has_lifetime_access: true });

      toast.success("Acesso Lifetime concedido!");
      fetchUsersWithSubscriptions();
    } catch (error) {
      console.error("Error granting lifetime:", error);
      toast.error("Erro ao conceder acesso lifetime");
    } finally {
      setUpgradingUserId(null);
    }
  };

  const handleRepairAccount = async (userId: string) => {
    setRepairingUserId(userId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const { error } = await supabase.functions.invoke('ensure-company-membership', {
        headers: { Authorization: `Bearer ${session?.access_token}` },
        body: { targetUserId: userId }
      });

      if (error) throw error;

      await logAdminAction(userId, "repair_account", null, { repaired: true });

      toast.success("Conta reparada! Empresa criada/vinculada.");
      fetchUsersWithSubscriptions();
    } catch (error) {
      console.error("Error repairing account:", error);
      toast.error("Erro ao reparar conta.");
    } finally {
      setRepairingUserId(null);
    }
  };

  const handleAddCredits = async (userId: string, amount?: number) => {
    const creditAmount = amount || parseInt(creditsToAdd[userId] || "0");
    if (!creditAmount) {
      toast.error("Insira um valor válido de créditos");
      return;
    }

    setAddingCredits(userId);
    const user = users.find(u => u.id === userId);
    const oldCredits = user?.credits || 0;
    
    try {
      const newBalance = oldCredits + creditAmount;

      const { error: creditError } = await supabase
        .from("profiles")
        .update({ credits: newBalance })
        .eq("id", userId);

      if (creditError) throw creditError;

      const { data: { user: adminUser } } = await supabase.auth.getUser();
      await supabase.from("credit_transactions").insert({
        user_id: userId,
        amount: creditAmount,
        type: creditAmount > 0 ? "add" : "remove",
        description: `${creditAmount > 0 ? "Adicionados" : "Removidos"} ${Math.abs(creditAmount)} créditos pelo admin`,
        created_by: adminUser?.id,
      });

      await logAdminAction(userId, creditAmount > 0 ? "add_credits" : "remove_credits", 
        { credits: oldCredits }, { credits: newBalance }, `${creditAmount} créditos`);

      toast.success(`${Math.abs(creditAmount)} créditos ${creditAmount > 0 ? "adicionados" : "removidos"}!`);
      setCreditsToAdd({ ...creditsToAdd, [userId]: "" });
      fetchUsersWithSubscriptions();
      
      if (selectedUser?.id === userId) {
        setSelectedUser({ ...selectedUser, credits: newBalance });
        fetchActivityLogs(userId);
      }
    } catch (error) {
      console.error("Error adding credits:", error);
      toast.error("Erro ao modificar créditos");
    } finally {
      setAddingCredits(null);
    }
  };

  const getUserBadge = (user: UserWithSubscription) => {
    if (user.has_lifetime_access) {
      return <Badge className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white">Lifetime</Badge>;
    }

    if (user.subscription?.status === "active" && (user.subscription.plan === "advanced" || user.subscription.plan === "pro_ai")) {
      return <Badge className="bg-gradient-to-r from-primary to-purple-500 text-white">{user.subscription.plan === "pro_ai" ? "Pro AI" : "Avançado"}</Badge>;
    }

    if (user.trial_ends_at) {
      const trialEnd = new Date(user.trial_ends_at);
      if (trialEnd > new Date()) {
        const daysLeft = differenceInDays(trialEnd, new Date());
        return <Badge variant="outline" className="border-amber-500 text-amber-500">Trial: {daysLeft}d</Badge>;
      }
    }

    return <Badge variant="secondary">Grátis</Badge>;
  };

  const getCurrentPlan = (user: UserWithSubscription) => {
    if (user.has_lifetime_access || user.plan_override === "vitacile") return "vitacile";
    if (user.plan_override) return user.plan_override;
    return user.subscription?.plan || "starter";
  };

  const UserCard = ({ user }: { user: UserWithSubscription }) => (
    <div 
      className="flex flex-col gap-4 p-4 rounded-lg bg-muted/30 border border-border hover:border-primary/50 cursor-pointer transition-colors"
      onClick={() => openUserModal(user)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Avatar className="h-10 w-10 shrink-0">
            <AvatarImage src={user.avatar_url || ""} />
            <AvatarFallback className="bg-primary/20 text-primary">
              {user.full_name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-foreground truncate">{user.full_name || "Sem nome"}</p>
            <p className="text-sm text-muted-foreground truncate">{user.email || "Email não disponível"}</p>
            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {user.created_at ? format(new Date(user.created_at), "dd/MM/yyyy", { locale: pt }) : "N/A"}
              </span>
              <span className="flex items-center gap-1">
                <Coins className="h-3 w-3" />
                {user.credits ?? 5} créditos
              </span>
              {!user.hasCompany && <Badge variant="destructive" className="text-xs">Sem Empresa</Badge>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">{getUserBadge(user)}</div>
      </div>
    </div>
  );

  const handleFilterChange = (start: Date | null, end: Date | null) => {
    setDateFilter({ start, end });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Lista de Assinaturas</h1>
        <p className="text-muted-foreground">Gestão completa de utilizadores, planos e créditos</p>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Pesquisar por email ou nome..."
          value={searchEmail}
          onChange={(e) => setSearchEmail(e.target.value)}
          className="pl-10"
        />
      </div>

      <Card className="bg-card border-border panel-shadow">
        <CardContent className="py-4">
          <SubscriptionFilters onFilterChange={handleFilterChange} />
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-card border-border panel-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-primary" />
              <CardTitle className="text-foreground">Planos Pro</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{loading ? <Loader2 className="h-6 w-6 animate-spin" /> : proUsers.length}</div>
            <p className="text-sm text-muted-foreground">Utilizadores com plano ativo</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border panel-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-foreground">Grátis / Trial</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{loading ? <Loader2 className="h-6 w-6 animate-spin" /> : freeUsers.length}</div>
            <p className="text-sm text-muted-foreground">Utilizadores em plano gratuito</p>
          </CardContent>
        </Card>
      </div>

      <RegistrationsChart users={chartData} days={14} />

      <Card className="bg-card border-border panel-shadow">
        <CardHeader>
          <CardTitle className="text-foreground">Utilizadores por Plano</CardTitle>
          <CardDescription>Clique num utilizador para gerir plano e créditos</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="free" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="pro" className="flex items-center gap-2">
                <Crown className="h-4 w-4" />Pro ({proUsers.length})
              </TabsTrigger>
              <TabsTrigger value="free" className="flex items-center gap-2">
                <Users className="h-4 w-4" />Grátis ({freeUsers.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pro" className="space-y-3">
              {loading ? (
                <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
              ) : proUsers.length > 0 ? (
                proUsers.map((user) => <UserCard key={user.id} user={user} />)
              ) : (
                <div className="text-center py-8 text-muted-foreground">Nenhum utilizador Pro encontrado</div>
              )}
            </TabsContent>

            <TabsContent value="free" className="space-y-3">
              {loading ? (
                <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
              ) : freeUsers.length > 0 ? (
                freeUsers.map((user) => <UserCard key={user.id} user={user} />)
              ) : (
                <div className="text-center py-8 text-muted-foreground">Nenhum utilizador gratuito encontrado</div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* User Management Modal */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Gestão: {selectedUser?.full_name || selectedUser?.email}
            </DialogTitle>
            <DialogDescription>{selectedUser?.email}</DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-6">
              {/* Credits Management */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium flex items-center gap-2">
                    <Coins className="h-4 w-4 text-primary" />
                    Saldo de Créditos
                  </span>
                  <Badge variant="outline" className="text-lg px-3">{selectedUser.credits ?? 5}</Badge>
                </div>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Quantidade"
                    value={creditsToAdd[selectedUser.id] || ""}
                    onChange={(e) => setCreditsToAdd({ ...creditsToAdd, [selectedUser.id]: e.target.value })}
                    className="flex-1"
                  />
                  <Button size="sm" onClick={() => handleAddCredits(selectedUser.id)} disabled={addingCredits === selectedUser.id}>
                    {addingCredits === selectedUser.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "+/-"}
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleAddCredits(selectedUser.id, 10)}>+10</Button>
                  <Button size="sm" variant="outline" onClick={() => handleAddCredits(selectedUser.id, 50)}>+50</Button>
                  <Button size="sm" variant="outline" onClick={() => handleAddCredits(selectedUser.id, -5)}>-5</Button>
                </div>
              </div>

              {/* Plan Management */}
              <div className="space-y-3">
                <span className="font-medium flex items-center gap-2">
                  <Crown className="h-4 w-4 text-primary" />
                  Plano Atual
                </span>
                <Select
                  value={getCurrentPlan(selectedUser)}
                  onValueChange={(value) => handlePlanChange(selectedUser.id, value)}
                  disabled={upgradingUserId === selectedUser.id}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PLAN_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="flex gap-2">
                  {!selectedUser.has_lifetime_access && (
                    <Button size="sm" variant="outline" onClick={() => handleMakeLifetime(selectedUser.id)} disabled={upgradingUserId === selectedUser.id}>
                      <Crown className="h-4 w-4 mr-1" />Conceder Lifetime
                    </Button>
                  )}
                  {!selectedUser.hasCompany && (
                    <Button size="sm" variant="destructive" onClick={() => handleRepairAccount(selectedUser.id)} disabled={repairingUserId === selectedUser.id}>
                      <Wrench className="h-4 w-4 mr-1" />Reparar Conta
                    </Button>
                  )}
                </div>
              </div>

              {/* Activity Logs */}
              <div className="space-y-3">
                <span className="font-medium flex items-center gap-2">
                  <History className="h-4 w-4 text-primary" />
                  Histórico de Alterações
                </span>
                <div className="max-h-40 overflow-y-auto space-y-2">
                  {loadingLogs ? (
                    <div className="flex justify-center py-4"><Loader2 className="h-4 w-4 animate-spin" /></div>
                  ) : activityLogs.length > 0 ? (
                    activityLogs.map((log) => (
                      <div key={log.id} className="text-xs p-2 rounded bg-muted/50 border border-border">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-xs">{log.action}</Badge>
                          <span className="text-muted-foreground">{format(new Date(log.created_at), "dd/MM HH:mm")}</span>
                        </div>
                        {log.notes && <p className="mt-1 text-muted-foreground">{log.notes}</p>}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-2">Nenhuma alteração registrada</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SubscriptionsListPage;
