import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Shield, UserPlus, Eye, EyeOff, Loader2 } from "lucide-react";
import { z } from "zod";

const registerSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
  confirmPassword: z.string(),
  accessCode: z.string().min(1, "Código de acesso é obrigatório"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

export default function AdminRegisterPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const { data: roles } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", session.user.id)
            .maybeSingle();
          
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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    try {
      // Validate form
      const result = registerSchema.safeParse({ email, password, confirmPassword, accessCode });
      if (!result.success) {
        const fieldErrors: Record<string, string> = {};
        result.error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
        setLoading(false);
        return;
      }

      // Validate access code
      const { data: codeData, error: codeError } = await supabase
        .from("admin_access_codes")
        .select("id, code")
        .eq("code", accessCode)
        .eq("is_active", true)
        .maybeSingle();

      if (codeError || !codeData) {
        toast({
          title: "Código Inválido",
          description: "O código de acesso informado é inválido ou expirado.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Create user account
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/admin`,
        },
      });

      if (signUpError) throw signUpError;

      if (!signUpData.user) {
        throw new Error("Erro ao criar conta");
      }

      // Upsert user role to admin (handles race condition with trigger)
      const { error: roleError } = await supabase
        .from("user_roles")
        .upsert(
          { user_id: signUpData.user.id, role: "admin" },
          { onConflict: "user_id,role" }
        );

      if (roleError) {
        console.error("Error setting admin role:", roleError);
        // Try delete existing and insert new
        await supabase.from("user_roles").delete().eq("user_id", signUpData.user.id);
        await supabase.from("user_roles").insert({ user_id: signUpData.user.id, role: "admin" });
      }

      toast({
        title: "Conta Criada!",
        description: "Sua conta de administrador foi criada com sucesso.",
      });

      navigate("/admin");
    } catch (error: any) {
      console.error("Registration error:", error);
      toast({
        title: "Erro no Cadastro",
        description: error.message || "Ocorreu um erro ao criar a conta.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 via-red-950/20 to-gray-950 p-4">
      <Card className="w-full max-w-md bg-gradient-to-br from-red-950/50 to-gray-900/50 border-red-800/30">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-red-600 to-red-900 flex items-center justify-center shadow-lg shadow-red-500/50">
              <UserPlus className="h-9 w-9 text-white" />
            </div>
          </div>
          <div>
            <CardTitle className="text-3xl font-bold text-red-400">
              Cadastro Admin
            </CardTitle>
            <CardDescription className="text-red-300/70 mt-2">
              Crie sua conta de administrador com código de acesso
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
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
              {errors.email && <p className="text-red-400 text-sm">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-red-300">Senha</Label>
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
              {errors.password && <p className="text-red-400 text-sm">{errors.password}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-red-300">Confirmar Senha</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="bg-red-950/30 border-red-800/50 text-red-100 pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-red-400 hover:text-red-300 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-red-400 text-sm">{errors.confirmPassword}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="accessCode" className="text-red-300 flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Código de Acesso
              </Label>
              <Input
                id="accessCode"
                type="text"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                required
                className="bg-red-950/30 border-red-800/50 text-red-100"
                placeholder="Insira o código de acesso"
              />
              {errors.accessCode && <p className="text-red-400 text-sm">{errors.accessCode}</p>}
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 text-white font-semibold py-6"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando conta...
                </>
              ) : (
                "Criar Conta Admin"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center space-y-3">
            <p className="text-red-300/70 text-sm">
              Já tem uma conta?{" "}
              <Link to="/admin/login" className="text-red-400 hover:text-red-300 underline">
                Fazer login
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
