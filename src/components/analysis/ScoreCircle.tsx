import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface ScoreCircleProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
}

const ScoreCircle = ({ score, size = 180, strokeWidth = 12, label = "Score Geral" }: ScoreCircleProps) => {
  const [animatedScore, setAnimatedScore] = useState(0);
  
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (animatedScore / 100) * circumference;

  const getScoreColor = (value: number) => {
    if (value >= 80) return "hsl(142, 76%, 36%)"; // Green
    if (value >= 50) return "hsl(38, 92%, 50%)"; // Yellow/Orange
    return "hsl(0, 84%, 60%)"; // Red
  };

  const getScoreLabel = (value: number) => {
    if (value >= 80) return "Excelente";
    if (value >= 60) return "Bom";
    if (value >= 50) return "Regular";
    return "Precisa Melhorar";
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedScore(score);
    }, 100);
    return () => clearTimeout(timer);
  }, [score]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="flex flex-col items-center"
    >
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth={strokeWidth}
          />
          {/* Animated progress circle */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={getScoreColor(score)}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
          />
        </svg>
        
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className="text-4xl font-bold text-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <Counter from={0} to={score} duration={1.5} />
          </motion.span>
          <span className="text-sm text-muted-foreground mt-1">de 100</span>
        </div>
      </div>
      
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="mt-3 text-center"
      >
        <p className="text-lg font-semibold text-foreground">{label}</p>
        <p 
          className="text-sm font-medium"
          style={{ color: getScoreColor(score) }}
        >
          {getScoreLabel(score)}
        </p>
      </motion.div>
    </motion.div>
  );
};

// Counter component for animated number
const Counter = ({ from, to, duration }: { from: number; to: number; duration: number }) => {
  const [count, setCount] = useState(from);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      
      setCount(Math.round(from + (to - from) * easeOutCubic(progress)));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    const timer = setTimeout(() => {
      animationFrame = requestAnimationFrame(animate);
    }, 200);

    return () => {
      clearTimeout(timer);
      if (animationFrame) cancelAnimationFrame(animationFrame);
    };
  }, [from, to, duration]);

  return <>{count}</>;
};

const easeOutCubic = (x: number): number => {
  return 1 - Math.pow(1 - x, 3);
};

export default ScoreCircle;
