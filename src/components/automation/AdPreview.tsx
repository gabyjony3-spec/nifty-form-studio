import { motion } from "framer-motion";
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Instagram, Facebook, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdPreviewProps {
  headline: string;
  copy: string;
  imageUrl?: string;
  ctaText?: string;
  platform?: "instagram" | "facebook";
  isLoadingImage?: boolean;
  onRegenerateImage?: () => void;
}

const AdPreview = ({ 
  headline, 
  copy, 
  imageUrl, 
  ctaText = "Saber Mais",
  platform = "instagram",
  isLoadingImage = false,
  onRegenerateImage
}: AdPreviewProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative"
    >
      {/* Phone Frame */}
      <div className="relative mx-auto w-[280px] h-[560px] bg-background rounded-[40px] border-4 border-border shadow-2xl overflow-hidden">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-border rounded-b-2xl z-10" />
        
        {/* Screen Content */}
        <div className="absolute inset-2 bg-card rounded-[32px] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-cyan-500 flex items-center justify-center">
                {platform === "instagram" ? (
                  <Instagram className="h-4 w-4 text-white" />
                ) : (
                  <Facebook className="h-4 w-4 text-white" />
                )}
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">Sua Marca</p>
                <p className="text-[10px] text-muted-foreground">Patrocinado</p>
              </div>
            </div>
            <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
          </div>

          {/* Image Area */}
          <div className="relative aspect-square bg-gradient-to-br from-primary/20 to-cyan-500/20">
            {isLoadingImage ? (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center p-4">
                  <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto mb-3" />
                  <p className="text-xs text-muted-foreground">
                    A gerar imagem IA...
                  </p>
                </div>
              </div>
            ) : imageUrl ? (
              <>
                <img 
                  src={imageUrl} 
                  alt="Ad preview" 
                  className="w-full h-full object-cover"
                />
                {/* Regenerate button overlay */}
                {onRegenerateImage && (
                  <div className="absolute top-2 right-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={onRegenerateImage}
                      className="h-8 px-2 bg-background/80 backdrop-blur-sm hover:bg-background/90"
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      <span className="text-xs">Regerar</span>
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center p-4">
                  <div className="h-16 w-16 rounded-full bg-primary/30 flex items-center justify-center mx-auto mb-3">
                    <Instagram className="h-8 w-8 text-primary" />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Imagem do anúncio
                  </p>
                </div>
              </div>
            )}
            
            {/* CTA Button Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-background/80 to-transparent">
              <button className="w-full py-2 px-4 bg-primary text-primary-foreground text-sm font-medium rounded-lg">
                {ctaText}
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between p-3 border-b border-border">
            <div className="flex items-center gap-4">
              <Heart className="h-5 w-5 text-foreground" />
              <MessageCircle className="h-5 w-5 text-foreground" />
              <Send className="h-5 w-5 text-foreground" />
            </div>
            <Bookmark className="h-5 w-5 text-foreground" />
          </div>

          {/* Copy */}
          <div className="p-3 space-y-2 overflow-y-auto max-h-[150px]">
            <p className="text-xs font-semibold text-foreground">
              {headline || "Headline do anúncio"}
            </p>
            <p className="text-xs text-foreground leading-relaxed">
              {copy || "A copy do seu anúncio aparecerá aqui. Escreva algo persuasivo que capture a atenção do seu público-alvo."}
            </p>
            <p className="text-xs text-primary cursor-pointer">
              Ver mais
            </p>
          </div>
        </div>
      </div>

      {/* Glow Effect */}
      <div className="absolute inset-0 bg-primary/20 blur-3xl -z-10 rounded-full scale-75" />
    </motion.div>
  );
};

export default AdPreview;
