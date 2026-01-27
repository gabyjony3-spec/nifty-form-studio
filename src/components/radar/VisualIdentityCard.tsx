import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Palette, Type, LayoutGrid } from "lucide-react";

interface VisualIdentity {
  color_palette?: string[];
  font_recommendations?: string[];
  feed_style?: string;
}

interface VisualIdentityCardProps {
  visualIdentity?: VisualIdentity;
  niche?: string;
}

const defaultVisualIdentity: VisualIdentity = {
  color_palette: ["#1E3A8A", "#3B82F6", "#FBBF24", "#F8FAFC"],
  font_recommendations: ["Montserrat para títulos", "Open Sans para corpo de texto"],
  feed_style: "Clean e profissional com cores consistentes"
};

export function VisualIdentityCard({ visualIdentity, niche }: VisualIdentityCardProps) {
  const identity = visualIdentity || defaultVisualIdentity;

  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5 text-pink-400" />
          Identidade Visual Recomendada
          {niche && (
            <Badge variant="outline" className="ml-auto border-pink-500/50 text-pink-300 text-xs">
              Para {niche}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Color Palette */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-medium text-muted-foreground">Paleta de Cores Estratégica</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            {identity.color_palette?.map((color, index) => (
              <motion.div
                key={index}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="group relative"
              >
                <div 
                  className="w-14 h-14 rounded-xl shadow-lg border-2 border-white/20 cursor-pointer hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }}
                  onClick={() => {
                    navigator.clipboard.writeText(color);
                  }}
                />
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-[10px] text-muted-foreground whitespace-nowrap">{color}</p>
                </div>
              </motion.div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">Clique numa cor para copiar o código</p>
        </motion.div>

        {/* Typography */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-3"
        >
          <div className="flex items-center gap-2">
            <Type className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-medium text-muted-foreground">Tipografia Recomendada</p>
          </div>
          <div className="space-y-2">
            {identity.font_recommendations?.map((font, index) => (
              <div 
                key={index}
                className="p-3 rounded-lg bg-muted/10 border border-muted/20"
              >
                <p className="text-sm text-white">{font}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Feed Style */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-3"
        >
          <div className="flex items-center gap-2">
            <LayoutGrid className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-medium text-muted-foreground">Estilo Visual do Feed</p>
          </div>
          <div className="p-4 rounded-lg bg-gradient-to-br from-pink-950/30 to-purple-950/30 border border-pink-500/20">
            <p className="text-sm text-white">{identity.feed_style}</p>
          </div>
        </motion.div>
      </CardContent>
    </Card>
  );
}
