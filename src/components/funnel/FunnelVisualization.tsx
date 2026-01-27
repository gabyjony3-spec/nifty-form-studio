import { Eye, Filter, TrendingUp, CheckCircle, ArrowDown } from "lucide-react";
import { motion } from "framer-motion";

interface FunnelStage {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
}

interface FunnelVisualizationProps {
  stages: FunnelStage[];
}

export function FunnelVisualization({ stages }: FunnelVisualizationProps) {
  // Calculate conversion rates between stages
  const getConversionRate = (currentIndex: number) => {
    if (currentIndex === 0) return 100;
    const previousValue = stages[currentIndex - 1]?.value || 1;
    const currentValue = stages[currentIndex]?.value || 0;
    if (previousValue === 0) return 0;
    return ((currentValue / previousValue) * 100).toFixed(1);
  };

  // Calculate width percentage for visual funnel effect
  const getWidthPercent = (index: number) => {
    const maxWidth = 100;
    const minWidth = 40;
    const step = (maxWidth - minWidth) / (stages.length - 1 || 1);
    return maxWidth - (step * index);
  };

  return (
    <div className="relative py-4">
      {stages.map((stage, index) => {
        const widthPercent = getWidthPercent(index);
        const conversionRate = getConversionRate(index);
        const Icon = stage.icon;
        
        return (
          <div key={stage.label} className="flex flex-col items-center">
            {/* Conversion arrow between stages */}
            {index > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.15 }}
                className="flex items-center gap-2 py-2 text-muted-foreground"
              >
                <ArrowDown className="h-4 w-4 animate-bounce" />
                <span className={`text-sm font-bold ${Number(conversionRate) >= 50 ? 'text-emerald-400' : Number(conversionRate) >= 20 ? 'text-amber-400' : 'text-red-400'}`}>
                  {conversionRate}%
                </span>
              </motion.div>
            )}
            
            {/* Funnel stage */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1, duration: 0.3 }}
              className="relative w-full flex justify-center"
              style={{ maxWidth: `${widthPercent}%` }}
            >
              <div 
                className={`
                  relative w-full py-4 px-6 rounded-xl 
                  bg-gradient-to-r ${stage.color}
                  border border-white/10 
                  shadow-lg backdrop-blur-sm
                  transition-all duration-300 hover:scale-[1.02]
                  cursor-default
                `}
                style={{
                  boxShadow: `0 4px 30px ${index === 0 ? 'rgba(59, 130, 246, 0.3)' : index === stages.length - 1 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(139, 92, 246, 0.2)'}`
                }}
              >
                {/* Glow effect */}
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-50" />
                
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-white/10">
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-white/70 uppercase tracking-wide">{stage.label}</p>
                      <p className="text-2xl font-bold text-white">
                        {stage.value.toLocaleString("pt-PT")}
                      </p>
                    </div>
                  </div>
                  
                  {/* Percentage of total */}
                  <div className="text-right">
                    <p className="text-sm font-medium text-white/90">
                      {stages[0]?.value > 0 
                        ? `${((stage.value / stages[0].value) * 100).toFixed(0)}%`
                        : "0%"
                      }
                    </p>
                    <p className="text-xs text-white/60">do total</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        );
      })}
    </div>
  );
}

// Default stages configuration
export const defaultFunnelStages = (data: {
  visitors: number;
  leads: number;
  qualified: number;
  conversions: number;
}): FunnelStage[] => [
  {
    label: "Visitantes (Análises)",
    value: data.visitors,
    icon: Eye,
    color: "from-blue-600 to-blue-500",
  },
  {
    label: "Leads Capturados",
    value: data.leads,
    icon: Filter,
    color: "from-violet-600 to-purple-500",
  },
  {
    label: "Leads Qualificados",
    value: data.qualified,
    icon: TrendingUp,
    color: "from-cyan-600 to-cyan-500",
  },
  {
    label: "Conversões",
    value: data.conversions,
    icon: CheckCircle,
    color: "from-emerald-600 to-green-500",
  },
];
