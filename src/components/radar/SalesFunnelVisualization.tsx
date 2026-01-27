import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Sparkles, Target, Users, MessageCircle, ShoppingCart, ArrowDown, ArrowRight } from "lucide-react";

interface FunnelStage {
  objective: string;
  content_types: string[];
}

interface SalesFunnel {
  top?: FunnelStage;
  middle?: FunnelStage;
  bottom?: FunnelStage;
  conversion_path?: string[];
}

interface SalesFunnelVisualizationProps {
  funnel?: SalesFunnel;
  niche?: string;
}

const defaultFunnel: SalesFunnel = {
  top: {
    objective: "Atração",
    content_types: ["Reels virais", "Carrosséis educativos", "Conteúdo de valor"]
  },
  middle: {
    objective: "Relacionamento",
    content_types: ["Stories interativos", "Lives Q&A", "Conteúdo de bastidores"]
  },
  bottom: {
    objective: "Conversão",
    content_types: ["Depoimentos", "Ofertas limitadas", "Chamadas para ação"]
  },
  conversion_path: ["Post", "Stories", "Link bio", "WhatsApp", "Venda"]
};

export function SalesFunnelVisualization({ funnel = defaultFunnel, niche }: SalesFunnelVisualizationProps) {
  const stages = [
    { 
      key: 'top', 
      icon: Users, 
      title: 'Topo do Funil',
      data: funnel.top || defaultFunnel.top,
      color: 'cyan',
      width: 'w-full'
    },
    { 
      key: 'middle', 
      icon: MessageCircle, 
      title: 'Meio do Funil',
      data: funnel.middle || defaultFunnel.middle,
      color: 'purple',
      width: 'w-[85%]'
    },
    { 
      key: 'bottom', 
      icon: ShoppingCart, 
      title: 'Fundo do Funil',
      data: funnel.bottom || defaultFunnel.bottom,
      color: 'green',
      width: 'w-[70%]'
    },
  ];

  const conversionPath = funnel.conversion_path || defaultFunnel.conversion_path || [];

  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-cyan-400" />
          Funil de Vendas no Instagram
          {niche && (
            <Badge variant="outline" className="ml-auto border-purple-500/50 text-purple-300 text-xs">
              {niche}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Funnel Visualization */}
        <div className="space-y-4">
          {stages.map((stage, index) => (
            <motion.div
              key={stage.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.15 }}
              className="flex flex-col items-center"
            >
              <div 
                className={`${stage.width} p-4 rounded-xl transition-all ${
                  stage.color === 'cyan' 
                    ? 'bg-gradient-to-r from-cyan-950/50 to-cyan-900/30 border border-cyan-500/30' 
                    : stage.color === 'purple'
                    ? 'bg-gradient-to-r from-purple-950/50 to-purple-900/30 border border-purple-500/30'
                    : 'bg-gradient-to-r from-green-950/50 to-green-900/30 border border-green-500/30'
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    stage.color === 'cyan' ? 'bg-cyan-500/20' :
                    stage.color === 'purple' ? 'bg-purple-500/20' : 'bg-green-500/20'
                  }`}>
                    <stage.icon className={`h-5 w-5 ${
                      stage.color === 'cyan' ? 'text-cyan-400' :
                      stage.color === 'purple' ? 'text-purple-400' : 'text-green-400'
                    }`} />
                  </div>
                  <div>
                    <p className="font-semibold text-white text-sm">{stage.title}</p>
                    <p className={`text-xs ${
                      stage.color === 'cyan' ? 'text-cyan-300' :
                      stage.color === 'purple' ? 'text-purple-300' : 'text-green-300'
                    }`}>
                      Objetivo: {stage.data?.objective}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {stage.data?.content_types.map((type, i) => (
                    <Badge 
                      key={i} 
                      variant="outline" 
                      className={`text-xs ${
                        stage.color === 'cyan' ? 'border-cyan-500/30 text-cyan-200' :
                        stage.color === 'purple' ? 'border-purple-500/30 text-purple-200' : 
                        'border-green-500/30 text-green-200'
                      }`}
                    >
                      {type}
                    </Badge>
                  ))}
                </div>
              </div>
              {index < stages.length - 1 && (
                <ArrowDown className="h-6 w-6 text-muted-foreground my-2" />
              )}
            </motion.div>
          ))}
        </div>

        {/* Conversion Path */}
        {conversionPath.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="pt-4 border-t border-muted/20"
          >
            <p className="text-xs font-medium text-muted-foreground mb-3 flex items-center gap-2">
              <Sparkles className="h-3 w-3 text-amber-400" />
              Caminho de Conversão:
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {conversionPath.map((step, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Badge 
                    variant="outline" 
                    className="border-amber-500/30 text-amber-200 bg-amber-500/10"
                  >
                    {step}
                  </Badge>
                  {index < conversionPath.length - 1 && (
                    <ArrowRight className="h-4 w-4 text-amber-400/50" />
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
