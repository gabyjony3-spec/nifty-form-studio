import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Mail, Calendar, Users, UserPlus } from "lucide-react";

interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  company_name: string | null;
  created_at: string | null;
}

const UsersPage = () => {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (!error && data) {
        setUsers(data);
      }
      setLoading(false);
    };

    fetchUsers();

    // Setup realtime subscription for new users
    const channel = supabase
      .channel('profiles-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'profiles'
        },
        (payload) => {
          console.log('New user registered:', payload.new);
          const newProfile = payload.new as Profile;
          setUsers(prev => [newProfile, ...prev]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles'
        },
        (payload) => {
          console.log('User updated:', payload.new);
          const updatedProfile = payload.new as Profile;
          setUsers(prev => prev.map(u => u.id === updatedProfile.id ? updatedProfile : u));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Gestão de Usuários</h1>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              Tempo real ativo
            </p>
          </div>
        </div>
        <Badge variant="outline" className="border-primary text-primary">
          {users.length} usuários
        </Badge>
      </div>

      <div className="grid gap-4">
        {users.length === 0 ? (
          <Card className="bg-card border-border panel-shadow">
            <CardContent className="py-8">
              <p className="text-center text-muted-foreground">
                Nenhum usuário encontrado no sistema.
              </p>
            </CardContent>
          </Card>
        ) : (
          users.map((user, index) => (
            <Card 
              key={user.id} 
              className={`bg-card border-border panel-shadow hover:glow-soft transition-smooth ${
                index === 0 ? 'ring-2 ring-primary/50 animate-pulse' : ''
              }`}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg text-foreground flex items-center gap-2">
                    {user.full_name || "Nome não definido"}
                    {index === 0 && (
                      <Badge className="bg-primary/20 text-primary text-xs">
                        <UserPlus className="h-3 w-3 mr-1" />
                        Mais recente
                      </Badge>
                    )}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span>{user.email || "Email não definido"}</span>
                  </div>
                  {user.company_name && (
                    <p className="text-muted-foreground">
                      <span className="font-medium text-foreground">Empresa:</span> {user.company_name}
                    </p>
                  )}
                  {user.created_at && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>
                        Registrado em: {new Date(user.created_at).toLocaleDateString("pt-PT")}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default UsersPage;
