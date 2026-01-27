import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Shield, Eye, EyeOff, Loader2, Mail } from "lucide-react";

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showRecoveryForm, setShowRecoveryForm] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [recoveryLoading, setRecoveryLoading] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const { data: roles } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", session.user.id)
            .single();
          
          if (roles?.role === "admin") {
            navigate("/admin");
          }
        }
      } catch (error) {
        console.error("Error checking session:", error);
      } finally {
        setIsCheckingSession(false);
      }
    };
    checkSession();
  }, [navigate]);

  const handlePasswordRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(recoveryEmail, {
        redirectTo: `${window.location.origin}/admin/login`,
      });

      if (error) throw error;

      toast({
        title: "Email Enviado",
        description: "Verifique sua caixa de entrada para redefinir sua senha.",
      });
      setShowRecoveryForm(false);
      setRecoveryEmail("");
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setRecoveryLoading(false);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Login direto sem código
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Verificar se é admin
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id)
        .single();

      if (roles?.role !== "admin") {
        await supabase.auth.signOut();
        toast({
          title: "Acesso Negado",
          description: "Esta conta não possui privilégios de administrador.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Acesso Autorizado",
        description: "Bem-vindo ao painel administrativo.",
      });

      navigate("/admin");
    } catch (error: any) {
      toast({
        title: "Erro de Autenticação",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Loading screen while checking session
  if (isCheckingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 via-red-950/20 to-gray-950 p-4">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-red-700 blur-xl opacity-50 animate-pulse" />
            <Loader2 className="h-12 w-12 animate-spin text-red-400 mx-auto relative" />
          </div>
          <p className="text-red-300/70 text-sm animate-pulse">A verificar sessão...</p>
        </div>
      </div>
    );
  }

  // Password Recovery Form
  if (showRecoveryForm) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 via-red-950/20 to-gray-950 p-4">
        <Card className="w-full max-w-md bg-gradient-to-br from-red-950/50 to-gray-900/50 border-red-800/30">
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-red-600 to-red-900 flex items-center justify-center shadow-lg shadow-red-500/50">
                <Mail className="h-9 w-9 text-white" />
              </div>
            </div>
            <div>
              <CardTitle className="text-3xl font-bold text-red-400">
                Recuperar Senha
              </CardTitle>
              <CardDescription className="text-red-300/70 mt-2">
                Digite seu email para receber um link de recuperação
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordRecovery} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="recoveryEmail" className="text-red-300">Email</Label>
                <Input
                  id="recoveryEmail"
                  type="email"
                  value={recoveryEmail}
                  onChange={(e) => setRecoveryEmail(e.target.value)}
                  required
                  className="bg-red-950/30 border-red-800/50 text-red-100"
                  placeholder="seu@email.com"
                />
              </div>

              <Button
                type="submit"
                disabled={recoveryLoading}
                className="w-full bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 text-white font-semibold py-6"
              >
                {recoveryLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  "Enviar Link de Recuperação"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Button
                variant="ghost"
                onClick={() => setShowRecoveryForm(false)}
                className="text-red-400 hover:text-red-300 hover:bg-red-950/50"
              >
                Voltar ao Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 via-red-950/20 to-gray-950 p-4">
      <Card className="w-full max-w-md bg-gradient-to-br from-red-950/50 to-gray-900/50 border-red-800/30">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-red-600 to-red-900 flex items-center justify-center shadow-lg shadow-red-500/50">
              <Shield className="h-9 w-9 text-white" />
            </div>
          </div>
          <div>
            <CardTitle className="text-3xl font-bold text-red-400">
              Acesso Admin
            </CardTitle>
            <CardDescription className="text-red-300/70 mt-2">
              Entre com suas credenciais de administrador
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-red-300">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-red-950/30 border-red-800/50 text-red-100"
                placeholder="admin@exemplo.com"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-red-300">Senha</Label>
                <button
                  type="button"
                  onClick={() => setShowRecoveryForm(true)}
                  className="text-xs text-red-400 hover:text-red-300 transition-colors"
                >
                  Esqueceu a senha?
                </button>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-red-950/30 border-red-800/50 text-red-100 pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-red-400 hover:text-red-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 text-white font-semibold py-6"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Autenticando...
                </>
              ) : (
                "Entrar no Painel"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center space-y-3">
            <p className="text-red-300/70 text-sm">
              Não tem uma conta?{" "}
              <Link to="/admin/register" className="text-red-400 hover:text-red-300 underline">
                Criar conta de admin
              </Link>
            </p>
            <Button
              variant="outline"
              onClick={() => navigate("/")}
              className="border-red-800 text-red-400 hover:bg-red-950/50"
            >
              Voltar para Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
