import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const GoogleIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const FacebookIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="white">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

interface SocialAuthButtonsProps {
  mode?: 'login' | 'signup';
}

const SocialAuthButtons = ({ mode = 'login' }: SocialAuthButtonsProps) => {
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
  const { toast } = useToast();

  const handleGoogleAuth = async () => {
    setLoadingProvider('google');
    try {
      const redirectUrl = `${window.location.origin}/auth`;
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        if (error.message.includes('provider')) {
          toast({
            title: "Google não configurado",
            description: "Configure o Google OAuth nas definições do painel administrativo para ativar esta opção.",
            variant: "destructive",
          });
        } else {
          throw error;
        }
        setLoadingProvider(null);
      }
    } catch (error: any) {
      toast({
        title: "Erro de Autenticação",
        description: error.message || "Falha ao conectar com Google. Tente novamente.",
        variant: "destructive",
      });
      setLoadingProvider(null);
    }
  };

  const handleFacebookAuth = async () => {
    toast({
      title: "Em breve",
      description: "Login com Facebook estará disponível numa próxima atualização.",
    });
  };

  return (
    <div className="space-y-4">
      {/* Separator */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-white/10" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-transparent px-3 text-cyan-400/60">
            ou continue com
          </span>
        </div>
      </div>

      {/* Social Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={handleGoogleAuth}
          disabled={loadingProvider !== null}
          className="h-12 bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20
                     text-white transition-all duration-300 rounded-xl
                     flex items-center justify-center gap-2"
        >
          {loadingProvider === 'google' ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <GoogleIcon className="h-5 w-5" />
              <span className="text-sm font-medium">Google</span>
            </>
          )}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={handleFacebookAuth}
          disabled={loadingProvider !== null}
          className="h-12 bg-[#1877F2]/20 border-[#1877F2]/30 hover:bg-[#1877F2]/30 hover:border-[#1877F2]/50
                     text-white transition-all duration-300 rounded-xl
                     flex items-center justify-center gap-2"
        >
          {loadingProvider === 'facebook' ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <FacebookIcon className="h-5 w-5" />
              <span className="text-sm font-medium">Facebook</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default SocialAuthButtons;
