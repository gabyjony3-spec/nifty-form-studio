import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useEffect, useState } from "react";

interface MetricCardProps {
  title: string;
  score: number;
  icon: LucideIcon;
  color: string;
  delay?: number;
}

const MetricCard = ({ title, score, icon: Icon, color, delay = 0 }: MetricCardProps) => {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedScore(score);
    }, delay * 1000 + 300);
    return () => clearTimeout(timer);
  }, [score, delay]);

  const getScoreStatus = (value: number) => {
    if (value >= 80) return { label: "Excelente", className: "text-green-500" };
    if (value >= 60) return { label: "Bom", className: "text-yellow-500" };
    if (value >= 40) return { label: "Regular", className: "text-orange-500" };
    return { label: "Crítico", className: "text-red-500" };
  };

  const status = getScoreStatus(score);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      <Card className="bg-card border-border hover:shadow-lg transition-shadow duration-300">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div 
              className="p-2 rounded-lg"
              style={{ backgroundColor: `${color}20` }}
            >
              <Icon 
                className="h-5 w-5" 
                style={{ color }}
              />
            </div>
            <span className={`text-xs font-medium ${status.className}`}>
              {status.label}
            </span>
          </div>
          
          <h3 className="text-sm font-medium text-muted-foreground mb-1">
            {title}
          </h3>
          
          <div className="flex items-baseline gap-1 mb-3">
            <motion.span
              className="text-2xl font-bold text-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: delay + 0.3 }}
            >
              {animatedScore}
            </motion.span>
            <span className="text-sm text-muted-foreground">/100</span>
          </div>
          
          <Progress 
            value={animatedScore} 
            className="h-2"
            style={{ 
              // @ts-ignore - custom CSS variable
              "--progress-background": color 
            }}
          />
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default MetricCard;
