import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Crown, Search, UserPlus, Check, X, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface UserWithLifetime {
  id: string;
  email: string;
  full_name: string | null;
  has_lifetime_access: boolean;
  created_at: string;
}

const LifetimeAccessPage = () => {
  const [users, setUsers] = useState<UserWithLifetime[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [addingEmail, setAddingEmail] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, full_name, has_lifetime_access, created_at")
        .order("has_lifetime_access", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Erro ao carregar usuários");
    } finally {
      setLoading(false);
    }
  };

  const toggleLifetimeAccess = async (userId: string, currentStatus: boolean) => {
    try {
      // 1. Atualizar profiles
      const { error } = await supabase
        .from("profiles")
        .update({ 
          has_lifetime_access: !currentStatus,
          credits: !currentStatus ? 9999 : 5
        })
        .eq("id", userId);

      if (error) throw error;

      // 2. Atualizar subscriptions
      if (!currentStatus) {
        await supabase
          .from("subscriptions")
          .upsert({
            user_id: userId,
            plan: "pro_ai",
            status: "active",
            is_lifetime: true,
            updated_at: new Date().toISOString()
          }, { onConflict: "user_id" });
      } else {
        await supabase
          .from("subscriptions")
          .update({
            status: "cancelled",
            is_lifetime: false,
            updated_at: new Date().toISOString()
          })
          .eq("user_id", userId);
      }

      // 3. Atualizar empresa do usuário
      const { data: companyUser } = await supabase
        .from("company_users")
        .select("company_id")
        .eq("user_id", userId)
        .maybeSingle();

      if (companyUser?.company_id) {
        await supabase
          .from("companies")
          .update({ plan: !currentStatus ? 'business' : 'trial' })
          .eq("id", companyUser.company_id);
      }

      // 4. Gerenciar role admin
      if (!currentStatus) {
        await supabase
          .from("user_roles")
          .upsert({ user_id: userId, role: 'admin' }, { onConflict: "user_id,role" });
      } else {
        await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", userId)
          .eq("role", 'admin');
      }

      setUsers(users.map(u => 
        u.id === userId ? { ...u, has_lifetime_access: !currentStatus } : u
      ));

      toast.success(
        !currentStatus 
          ? "Acesso vitalício completo concedido!" 
          : "Acesso vitalício removido"
      );
    } catch (error) {
      console.error("Error updating lifetime access:", error);
      toast.error("Erro ao atualizar acesso");
    }
  };

  const grantAccessByEmail = async () => {
    if (!addingEmail.trim()) {
      toast.error("Digite um e-mail válido");
      return;
    }

    try {
      const { data: profile, error: fetchError } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", addingEmail.trim().toLowerCase())
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (!profile) {
        toast.error("Usuário não encontrado com este e-mail");
        return;
      }

      await toggleLifetimeAccess(profile.id, false);
      setAddingEmail("");
      fetchUsers();
    } catch (error) {
      console.error("Error granting access:", error);
      toast.error("Erro ao conceder acesso");
    }
  };

  const filteredUsers = users.filter(user => 
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const lifetimeUsers = users.filter(u => u.has_lifetime_access);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Crown className="h-8 w-8 text-yellow-500" />
        <div>
          <h1 className="text-3xl font-bold">Acesso Vitalício</h1>
          <p className="text-muted-foreground">
            Gerencie usuários com acesso permanente ao plano Pro
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Conceder Acesso Vitalício
            </CardTitle>
            <CardDescription>
              Digite o e-mail do usuário para conceder acesso permanente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="email@exemplo.com"
                value={addingEmail}
                onChange={(e) => setAddingEmail(e.target.value)}
                type="email"
              />
              <Button onClick={grantAccessByEmail}>
                Conceder
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Estatísticas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-primary/10 rounded-lg">
                <div className="text-3xl font-bold text-primary">
                  {lifetimeUsers.length}
                </div>
                <div className="text-sm text-muted-foreground">
                  Usuários Vitalícios
                </div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-3xl font-bold">
                  {users.length}
                </div>
                <div className="text-sm text-muted-foreground">
                  Total de Usuários
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Todos os Usuários</CardTitle>
            <div className="flex gap-2">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar usuário..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button variant="outline" onClick={fetchUsers}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Cadastro</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    {user.full_name || "-"}
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    {format(new Date(user.created_at), "dd/MM/yyyy", { locale: ptBR })}
                  </TableCell>
                  <TableCell>
                    {user.has_lifetime_access ? (
                      <Badge className="bg-yellow-500">
                        <Crown className="h-3 w-3 mr-1" />
                        Vitalício
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Regular</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant={user.has_lifetime_access ? "destructive" : "default"}
                      size="sm"
                      onClick={() => toggleLifetimeAccess(user.id, user.has_lifetime_access)}
                    >
                      {user.has_lifetime_access ? (
                        <>
                          <X className="h-4 w-4 mr-1" />
                          Remover
                        </>
                      ) : (
                        <>
                          <Crown className="h-4 w-4 mr-1" />
                          Conceder
                        </>
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default LifetimeAccessPage;
