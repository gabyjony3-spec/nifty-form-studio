import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface AdminLoginRouteProps {
  children: React.ReactNode;
}

export const AdminLoginRoute = ({ children }: AdminLoginRouteProps) => {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }

      setIsAuthenticated(true);

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .single();

      setIsAdmin(roles?.role === "admin");
      setLoading(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkAuth();
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-red-950/20 to-black">
        <Loader2 className="h-8 w-8 animate-spin text-red-500" />
      </div>
    );
  }

  // Se já está autenticado como admin, redireciona para o painel admin
  if (isAuthenticated && isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  // Se está autenticado como usuário comum, bloqueia acesso
  if (isAuthenticated && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  // Se não está autenticado, permite ver a página de login
  return <>{children}</>;
};