import { useEffect, useCallback } from "react";
import confetti from "canvas-confetti";

interface ConfettiCelebrationProps {
  trigger: boolean;
  type?: "levelUp" | "scoreImproved" | "achievement";
  onComplete?: () => void;
}

export function ConfettiCelebration({ trigger, type = "levelUp", onComplete }: ConfettiCelebrationProps) {
  const fireConfetti = useCallback(() => {
    const count = 200;
    const defaults = {
      origin: { y: 0.7 },
      zIndex: 9999
    };

    function fire(particleRatio: number, opts: confetti.Options) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio)
      });
    }

    if (type === "levelUp" || type === "achievement") {
      // Golden confetti for level ups
      fire(0.25, {
        spread: 26,
        startVelocity: 55,
        colors: ['#FFD700', '#FFA500', '#DAA520']
      });
      fire(0.2, {
        spread: 60,
        colors: ['#FFD700', '#FFA500', '#DAA520']
      });
      fire(0.35, {
        spread: 100,
        decay: 0.91,
        scalar: 0.8,
        colors: ['#FFD700', '#FFA500', '#DAA520', '#FFFFFF']
      });
      fire(0.1, {
        spread: 120,
        startVelocity: 25,
        decay: 0.92,
        scalar: 1.2,
        colors: ['#FFD700', '#FFA500', '#DAA520']
      });
      fire(0.1, {
        spread: 120,
        startVelocity: 45,
        colors: ['#FFD700', '#FFA500', '#DAA520', '#FFFFFF']
      });
    } else {
      // Multi-color confetti for score improvements
      fire(0.25, {
        spread: 26,
        startVelocity: 55,
      });
      fire(0.2, {
        spread: 60,
      });
      fire(0.35, {
        spread: 100,
        decay: 0.91,
        scalar: 0.8
      });
      fire(0.1, {
        spread: 120,
        startVelocity: 25,
        decay: 0.92,
        scalar: 1.2
      });
      fire(0.1, {
        spread: 120,
        startVelocity: 45,
      });
    }

    // Side cannons for extra effect
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: type === "levelUp" ? ['#FFD700', '#FFA500', '#DAA520'] : undefined,
        zIndex: 9999
      });
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: type === "levelUp" ? ['#FFD700', '#FFA500', '#DAA520'] : undefined,
        zIndex: 9999
      });
    }, 200);

    // Cleanup and callback
    setTimeout(() => {
      onComplete?.();
    }, 3000);
  }, [type, onComplete]);

  useEffect(() => {
    if (trigger) {
      fireConfetti();
    }
  }, [trigger, fireConfetti]);

  return null;
}
