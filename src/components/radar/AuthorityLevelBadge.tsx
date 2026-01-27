import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Crown, Medal, Award, Star, Sparkles } from "lucide-react";

interface AuthorityLevelBadgeProps {
  score: number;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
}

export type AuthorityLevel = "bronze" | "prata" | "ouro" | "diamante";

export const getAuthorityLevel = (score: number): AuthorityLevel => {
  if (score >= 91) return "diamante";
  if (score >= 61) return "ouro";
  if (score >= 31) return "prata";
  return "bronze";
};

export const levelConfig = {
  bronze: {
    label: "Bronze",
    icon: Medal,
    gradient: "from-orange-700 to-orange-900",
    borderColor: "border-orange-500/50",
    textColor: "text-orange-300",
    bgColor: "bg-orange-500/20",
    range: "0-30"
  },
  prata: {
    label: "Prata",
    icon: Award,
    gradient: "from-gray-400 to-gray-600",
    borderColor: "border-gray-400/50",
    textColor: "text-gray-300",
    bgColor: "bg-gray-500/20",
    range: "31-60"
  },
  ouro: {
    label: "Ouro",
    icon: Crown,
    gradient: "from-yellow-500 to-amber-600",
    borderColor: "border-yellow-500/50",
    textColor: "text-yellow-300",
    bgColor: "bg-yellow-500/20",
    range: "61-90"
  },
  diamante: {
    label: "Diamante",
    icon: Sparkles,
    gradient: "from-cyan-400 to-blue-500",
    borderColor: "border-cyan-400/50",
    textColor: "text-cyan-300",
    bgColor: "bg-cyan-500/20",
    range: "91-100"
  }
};

export function AuthorityLevelBadge({ score, showLabel = true, size = "md" }: AuthorityLevelBadgeProps) {
  const level = getAuthorityLevel(score);
  const config = levelConfig[level];
  const Icon = config.icon;

  const sizeClasses = {
    sm: "px-2 py-1 text-xs gap-1",
    md: "px-3 py-1.5 text-sm gap-2",
    lg: "px-4 py-2 text-base gap-2"
  };

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5"
  };

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
    >
      <Badge 
        className={`
          ${sizeClasses[size]}
          ${config.bgColor}
          ${config.borderColor}
          ${config.textColor}
          border font-semibold flex items-center
        `}
      >
        <Icon className={`${iconSizes[size]} ${level === "diamante" ? "animate-pulse" : ""}`} />
        {showLabel && (
          <span>Nível {config.label}</span>
        )}
        {level === "diamante" && (
          <Star className={`${iconSizes[size]} ml-1 fill-current`} />
        )}
      </Badge>
    </motion.div>
  );
}
