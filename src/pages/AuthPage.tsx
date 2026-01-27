import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sparkles, Rocket, Mail, Lock, User, ArrowLeft, Eye, EyeOff } from "lucide-react";
import SocialAuthButtons from "@/components/SocialAuthButtons";

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showRecoveryForm, setShowRecoveryForm] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handlePasswordRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(recoveryEmail, {
        redirectTo: `${window.location.origin}/auth`,
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

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session) {
          // User login on /auth always goes to user dashboard
          navigate("/dashboard");
        }
      }
    );

    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          // User already logged in - go to user dashboard
          navigate("/dashboard");
        }
      } catch (error) {
        console.error("Error checking session:", error);
      } finally {
        setIsCheckingSession(false);
      }
    };
    checkSession();

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        toast({
          title: "Login realizado com sucesso!",
          description: "Bem-vindo de volta.",
        });

        // Always navigate to user dashboard from /auth
        navigate("/dashboard");
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              full_name: fullName,
            },
          },
        });

        if (error) throw error;

        toast({
          title: "Conta criada com sucesso!",
          description: "Você já pode fazer login.",
        });

        setIsLogin(true);
        setPassword("");
      }
    } catch (error: any) {
      toast({
        title: "Erro",
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
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-black" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(6,182,212,0.15)_0%,_transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_rgba(59,130,246,0.1)_0%,_transparent_50%)]" />
        
        <div className="relative z-10 text-center space-y-4">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-500 blur-xl opacity-50 animate-pulse" />
            <Loader2 className="h-12 w-12 animate-spin text-cyan-400 mx-auto relative" />
          </div>
          <p className="text-cyan-300/70 text-sm animate-pulse">A verificar sessão...</p>
        </div>
      </div>
    );
  }

  // Password Recovery Form
  if (showRecoveryForm) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-black" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(6,182,212,0.15)_0%,_transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_rgba(59,130,246,0.1)_0%,_transparent_50%)]" />
        
        <div className="relative z-10 w-full max-w-md px-4">
          <Card className="backdrop-blur-xl bg-white/5 border border-white/10 shadow-[0_0_60px_rgba(6,182,212,0.15)] rounded-2xl overflow-hidden">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <div className="flex items-center justify-center mb-6">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-500 blur-xl opacity-50 animate-pulse" />
                    <div className="relative flex items-center gap-2 px-4 py-2">
                      <Mail className="h-8 w-8 text-cyan-400" />
                    </div>
                  </div>
                </div>
                
                <h1 className="text-2xl font-bold text-white mb-2">
                  Recuperar Senha
                </h1>
                <p className="text-cyan-300/70 text-sm">
                  Digite seu email para receber um link de recuperação
                </p>
              </div>

              <form onSubmit={handlePasswordRecovery} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="recoveryEmail" className="text-cyan-300/90 text-sm font-medium">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-cyan-500/50" />
                    <Input
                      id="recoveryEmail"
                      type="email"
                      placeholder="seu@email.com"
                      value={recoveryEmail}
                      onChange={(e) => setRecoveryEmail(e.target.value)}
                      required
                      className="pl-11 h-12 bg-white/5 border-white/10 text-white placeholder:text-white/30 
                                 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 
                                 transition-all duration-300 rounded-xl"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={recoveryLoading}
                  className="w-full h-12 bg-gradient-to-r from-cyan-500 to-blue-600 
                             hover:from-cyan-400 hover:to-blue-500
                             text-white font-semibold rounded-xl
                             shadow-[0_0_30px_rgba(6,182,212,0.4)]
                             hover:shadow-[0_0_40px_rgba(6,182,212,0.6)]
                             transition-all duration-300"
                >
                  {recoveryLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    "Enviar Link de Recuperação"
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={() => setShowRecoveryForm(false)}
                  className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  Voltar ao Login
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Dark Background with Radial Gradient */}
      <div className="absolute inset-0 bg-black" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(6,182,212,0.15)_0%,_transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_rgba(59,130,246,0.1)_0%,_transparent_50%)]" />
      
      {/* Subtle Grid Pattern */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
        backgroundSize: '50px 50px'
      }} />

      {/* Floating Particles */}
      <div className="absolute top-20 left-20 w-2 h-2 bg-cyan-400 rounded-full animate-pulse opacity-60" />
      <div className="absolute top-40 right-40 w-1 h-1 bg-blue-400 rounded-full animate-pulse opacity-40" style={{ animationDelay: '0.5s' }} />
      <div className="absolute bottom-40 left-1/4 w-1.5 h-1.5 bg-cyan-300 rounded-full animate-pulse opacity-50" style={{ animationDelay: '1s' }} />
      <div className="absolute bottom-20 right-1/4 w-1 h-1 bg-blue-300 rounded-full animate-pulse opacity-30" style={{ animationDelay: '1.5s' }} />

      <div className="relative z-10 w-full max-w-md px-4">
        {/* Glassmorphism Card */}
        <Card className="backdrop-blur-xl bg-white/5 border border-white/10 shadow-[0_0_60px_rgba(6,182,212,0.15)] rounded-2xl overflow-hidden">
          <CardContent className="p-8">
            {/* Logo and Title Section */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center mb-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-500 blur-xl opacity-50 animate-pulse" />
                  <div className="relative flex items-center gap-2 px-4 py-2">
                    <Sparkles className="h-8 w-8 text-cyan-400" />
                    <span className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                      AI INsight
                    </span>
                  </div>
                </div>
              </div>
              
              <h1 className="text-2xl font-bold text-white mb-2">
                {isLogin ? "Bem-vindo de volta à sua Agência de IA" : "Junte-se à sua Agência de IA"}
              </h1>
              <p className="text-cyan-300/70 text-sm">
                {isLogin 
                  ? "Aceda às suas automações e escale os seus anúncios num clique."
                  : "Comece a automatizar o seu marketing com inteligência artificial."}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleAuth} className="space-y-5">
              {/* Full Name Field - Only for Signup */}
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-cyan-300/90 text-sm font-medium">
                    Nome Completo
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-cyan-500/50" />
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="Seu nome completo"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required={!isLogin}
                      className="pl-11 h-12 bg-white/5 border-white/10 text-white placeholder:text-white/30 
                                 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 
                                 transition-all duration-300 rounded-xl"
                    />
                  </div>
                </div>
              )}

              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-cyan-300/90 text-sm font-medium">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-cyan-500/50" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-11 h-12 bg-white/5 border-white/10 text-white placeholder:text-white/30 
                               focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 
                               transition-all duration-300 rounded-xl"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-cyan-300/90 text-sm font-medium">
                    Senha
                  </Label>
                  {isLogin && (
                    <button
                      type="button"
                      onClick={() => setShowRecoveryForm(true)}
                      className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                    >
                      Esqueceu a senha?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-cyan-500/50" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="pl-11 pr-11 h-12 bg-white/5 border-white/10 text-white placeholder:text-white/30 
                               focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 
                               transition-all duration-300 rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-cyan-500/50 hover:text-cyan-400 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Submit Button with Gradient */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-gradient-to-r from-cyan-500 to-blue-600 
                           hover:from-cyan-400 hover:to-blue-500
                           text-white font-semibold rounded-xl
                           shadow-[0_0_30px_rgba(6,182,212,0.4)]
                           hover:shadow-[0_0_40px_rgba(6,182,212,0.6)]
                           transition-all duration-300"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Aguarde...
                  </>
                ) : (
                  <>
                    <Rocket className="mr-2 h-5 w-5" />
                    {isLogin ? "Entrar na Agência" : "Criar Conta"}
                  </>
                )}
              </Button>
            </form>

            {/* Social Auth Buttons */}
            <div className="mt-6">
              <SocialAuthButtons mode={isLogin ? 'login' : 'signup'} />
            </div>

            {/* Toggle Login/Signup */}
            <div className="mt-8 text-center space-y-3">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                {isLogin
                  ? "Não tem uma conta? Criar conta"
                  : "Já tem uma conta? Fazer login"}
              </button>
              
              <div>
                <button
                  type="button"
                  onClick={() => navigate("/")}
                  className="inline-flex items-center gap-1 text-sm text-cyan-500/60 hover:text-cyan-400 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Voltar à página inicial
                </button>
              </div>

              <div className="pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => navigate("/admin/login")}
                  className="text-xs text-cyan-500/40 hover:text-cyan-400 transition-colors"
                >
                  Administrador? Acesse aqui
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bottom Glow */}
        <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-96 h-32 bg-cyan-500/20 blur-3xl rounded-full" />
      </div>
    </div>
  );
};

export default AuthPage;
