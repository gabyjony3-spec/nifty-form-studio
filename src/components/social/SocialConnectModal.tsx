import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Loader2, 
  CheckCircle2, 
  XCircle,
  AlertCircle,
  Check
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface SocialConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  platform: string;
  platformIcon: React.ReactNode;
  onSuccess: () => void;
}

type ConnectionStatus = "idle" | "scanning" | "connecting" | "success" | "error";

// URL validation patterns per platform
const platformPatterns: Record<string, { pattern: RegExp; example: string }> = {
  instagram: {
    pattern: /^https?:\/\/(www\.)?instagram\.com\/[a-zA-Z0-9_.]+\/?(\?.*)?$/,
    example: "https://instagram.com/seu_usuario"
  },
  facebook: {
    pattern: /^https?:\/\/(www\.)?(facebook\.com|fb\.com)\/[a-zA-Z0-9_.]+\/?(\?.*)?$/,
    example: "https://facebook.com/sua_pagina"
  },
  tiktok: {
    pattern: /^https?:\/\/(www\.)?tiktok\.com\/@[a-zA-Z0-9_.]+\/?(\?.*)?$/,
    example: "https://tiktok.com/@seu_usuario"
  },
  youtube: {
    pattern: /^https?:\/\/(www\.)?youtube\.com\/(@|channel\/|c\/|user\/)?[a-zA-Z0-9_-]+\/?(\?.*)?$/,
    example: "https://youtube.com/@seu_canal"
  },
  linkedin: {
    pattern: /^https?:\/\/(www\.)?linkedin\.com\/(in|company)\/[a-zA-Z0-9_-]+\/?(\?.*)?$/,
    example: "https://linkedin.com/in/seu_perfil"
  }
};

const validatePlatformUrl = (url: string, platform: string): { valid: boolean; message?: string } => {
  const config = platformPatterns[platform.toLowerCase()];
  if (!config) return { valid: true };
  
  if (!config.pattern.test(url)) {
    return { 
      valid: false, 
      message: `URL inválida para ${platform}. Exemplo: ${config.example}` 
    };
  }
  return { valid: true };
};

const extractUsernameFromUrl = (url: string, platform: string): string => {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname.replace(/\/$/, ""); // Remove trailing slash
    
    switch (platform.toLowerCase()) {
      case "instagram":
      case "facebook":
        return pathname.split("/").filter(Boolean).pop() || "";
      case "tiktok":
        return pathname.replace("/@", "").split("/").filter(Boolean).pop() || "";
      case "youtube":
        const ytPath = pathname.replace(/^\/(@|channel\/|c\/|user\/)/, "");
        return ytPath.split("/").filter(Boolean).pop() || "";
      case "linkedin":
        return pathname.replace(/^\/(in|company)\//, "").split("/").filter(Boolean).pop() || "";
      default:
        return pathname.split("/").filter(Boolean).pop() || "";
    }
  } catch {
    return url;
  }
};

const SocialConnectModal = ({ 
  isOpen, 
  onClose, 
  platform, 
  platformIcon,
  onSuccess 
}: SocialConnectModalProps) => {
  const [username, setUsername] = useState("");
  const [profileUrl, setProfileUrl] = useState("");
  const [status, setStatus] = useState<ConnectionStatus>("idle");
  const [urlValidation, setUrlValidation] = useState<{ valid: boolean; message?: string } | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setStatus("idle");
      setUsername("");
      setProfileUrl("");
      setUrlValidation(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (profileUrl.trim()) {
      const validation = validatePlatformUrl(profileUrl, platform);
      setUrlValidation(validation);
      
      // Auto-extract username when URL is valid
      if (validation.valid) {
        const extracted = extractUsernameFromUrl(profileUrl, platform);
        if (extracted && !username) {
          setUsername(extracted);
        }
      }
    } else {
      setUrlValidation(null);
    }
  }, [profileUrl, platform]);

  const getUrlPlaceholder = () => {
    return platformPatterns[platform.toLowerCase()]?.example || "https://...";
  };

  const getUrlHint = () => {
    const config = platformPatterns[platform.toLowerCase()];
    if (!config) return "";
    
    switch (platform.toLowerCase()) {
      case "instagram":
        return "Cole a URL do seu perfil do Instagram (ex: instagram.com/usuario)";
      case "facebook":
        return "Cole a URL da sua página do Facebook (ex: facebook.com/pagina)";
      case "tiktok":
        return "Cole a URL do seu perfil TikTok (ex: tiktok.com/@usuario)";
      case "youtube":
        return "Cole a URL do seu canal YouTube (ex: youtube.com/@canal)";
      case "linkedin":
        return "Cole a URL do seu perfil LinkedIn (ex: linkedin.com/in/usuario)";
      default:
        return "Cole a URL completa do seu perfil";
    }
  };

  const handleManualConnect = async () => {
    if (!profileUrl.trim()) {
      toast({
        title: "URL obrigatória",
        description: "Por favor, insira a URL do seu perfil",
        variant: "destructive",
      });
      return;
    }

    // Validate URL format
    if (!profileUrl.startsWith("http")) {
      toast({
        title: "URL inválida",
        description: "A URL deve começar com http:// ou https://",
        variant: "destructive",
      });
      return;
    }

    // Validate platform-specific URL
    const validation = validatePlatformUrl(profileUrl, platform);
    if (!validation.valid) {
      toast({
        title: "URL inválida",
        description: validation.message,
        variant: "destructive",
      });
      return;
    }

    setStatus("connecting");
    
    // Extract username from URL for display
    const extractedUsername = username || extractUsernameFromUrl(profileUrl, platform);
    
    setTimeout(() => {
      handleConnectionComplete(extractedUsername, profileUrl);
    }, 2000);
  };

  const handleConnectionComplete = async (accountName: string, url?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setStatus("error");
        return;
      }

      // Save connection to database with the profile URL
      const { error } = await supabase
        .from("social_accounts")
        .upsert({
          user_id: user.id,
          platform: platform.toLowerCase(),
          account_name: accountName,
          account_id: url || profileUrl, // Store the URL in account_id for analysis
          is_connected: true,
          connected_at: new Date().toISOString(),
        }, {
          onConflict: "user_id,platform"
        });

      if (error) {
        console.error("Error saving connection:", error);
        setStatus("error");
        return;
      }

      // Detect niche using AI
      try {
        const { data: nicheData } = await supabase.functions.invoke("detect-niche", {
          body: {
            profileUrl: url || profileUrl,
            platform: platform.toLowerCase(),
            username: accountName,
          },
        });

        if (nicheData?.niche) {
          // Save detected niche to localStorage for calendar to use
          localStorage.setItem("detected_niche", nicheData.niche);
          console.log("Detected niche:", nicheData.niche);
        }
      } catch (nicheError) {
        console.error("Error detecting niche:", nicheError);
        // Non-blocking - continue even if niche detection fails
      }

      setStatus("success");
      
      setTimeout(() => {
        onSuccess();
        onClose();
        toast({
          title: "Conta conectada!",
          description: `${platform} conectado com sucesso como @${accountName}`,
        });
      }, 1500);
    } catch (error) {
      console.error("Connection error:", error);
      setStatus("error");
    }
  };

  const renderContent = () => {
    switch (status) {
      case "scanning":
        return (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-8"
          >
            <div className="relative mx-auto w-48 h-48 mb-6">
              <div className="absolute inset-0 border-4 border-primary/30 rounded-2xl animate-pulse" />
              <div className="absolute inset-4 border-2 border-primary rounded-xl flex items-center justify-center">
                <Loader2 className="h-16 w-16 text-primary animate-spin" />
              </div>
            </div>
            <h3 className="text-lg font-semibold mb-2">A preparar conexão...</h3>
            <p className="text-muted-foreground text-sm">
              Aguarde um momento
            </p>
          </motion.div>
        );

      case "connecting":
        return (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <Loader2 className="h-16 w-16 text-primary mx-auto mb-6 animate-spin" />
            <h3 className="text-lg font-semibold mb-2">A conectar...</h3>
            <p className="text-muted-foreground text-sm">
              A verificar as suas credenciais
            </p>
          </motion.div>
        );

      case "success":
        return (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-12"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", bounce: 0.5 }}
            >
              <CheckCircle2 className="h-20 w-20 text-green-500 mx-auto mb-6" />
            </motion.div>
            <h3 className="text-xl font-semibold mb-2">Conectado com sucesso!</h3>
            <p className="text-muted-foreground">
              A sua conta {platform} foi conectada
            </p>
          </motion.div>
        );

      case "error":
        return (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <XCircle className="h-20 w-20 text-destructive mx-auto mb-6" />
            <h3 className="text-xl font-semibold mb-2">Erro na conexão</h3>
            <p className="text-muted-foreground mb-6">
              Não foi possível conectar a sua conta
            </p>
            <Button 
              variant="outline" 
              onClick={() => setStatus("idle")}
            >
              Tentar novamente
            </Button>
          </motion.div>
        );

      default:
        return (
          <div className="space-y-6">
            {/* URL Input Section - Always show */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  {platformIcon}
                </div>
                <h3 className="text-lg font-semibold">Conectar {platform}</h3>
                <p className="text-muted-foreground text-sm">
                  Insira a URL do seu perfil do {platform} para análise
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="profileUrl">URL do Perfil *</Label>
                <div className="relative">
                  <Input
                    id="profileUrl"
                    placeholder={getUrlPlaceholder()}
                    value={profileUrl}
                    onChange={(e) => setProfileUrl(e.target.value)}
                    className={`bg-background/50 border-border/50 pr-10 ${
                      urlValidation?.valid === false ? "border-destructive" : 
                      urlValidation?.valid === true ? "border-green-500" : ""
                    }`}
                  />
                  {urlValidation && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {urlValidation.valid ? (
                        <Check className="h-5 w-5 text-green-500" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-destructive" />
                      )}
                    </div>
                  )}
                </div>
                {urlValidation?.valid === false ? (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {urlValidation.message}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    {getUrlHint()}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Nome de exibição (opcional)</Label>
                <Input
                  id="username"
                  placeholder={`@seu_${platform.toLowerCase()}`}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="bg-background/50 border-border/50"
                />
                {urlValidation?.valid && username && (
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <Check className="h-3 w-3" />
                    Username detectado: @{username}
                  </p>
                )}
              </div>

              <Button 
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                onClick={handleManualConnect}
                disabled={!profileUrl.trim() || urlValidation?.valid === false}
              >
                Conectar e Analisar
              </Button>
            </motion.div>
          </div>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md glass-card border-border/50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              {platformIcon}
            </div>
            Conectar {platform}
          </DialogTitle>
        </DialogHeader>
        
        <AnimatePresence mode="wait">
          {renderContent()}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default SocialConnectModal;
