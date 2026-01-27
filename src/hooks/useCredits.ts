import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface CreditsState {
  credits: number;
  plan: "starter" | "pro" | "elite" | "lifetime";
  isLoading: boolean;
  isVIP: boolean;
  canUseFeature: boolean;
}

const PLAN_CREDITS: Record<string, number> = {
  starter: 5,
  basic: 5,
  pro: 50,
  advanced: 50,
  elite: 9999,
  pro_ai: 9999,
  lifetime: 9999,
};

const VIP_EMAILS = ["adp.comunicacao2019@gmail.com", "cadp.comunicacao2019@gmail.com", "sweetwish493@gmail.com"];

export function useCredits() {
  const [state, setState] = useState<CreditsState>({
    credits: 0,
    plan: "starter",
    isLoading: true,
    isVIP: false,
    canUseFeature: false,
  });
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const fetchCredits = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setState(prev => ({ ...prev, isLoading: false }));
        return;
      }

      // Check if VIP
      const isVIP = VIP_EMAILS.includes(user.email || "");

      // Fetch profile with credits
      const { data: profile } = await supabase
        .from("profiles")
        .select("credits, plan_override, has_lifetime_access, last_credits_reset, email")
        .eq("id", user.id)
        .single();

      // Fetch subscription
      const { data: subscription } = await supabase
        .from("subscriptions")
        .select("plan, status")
        .eq("user_id", user.id)
        .maybeSingle();

      // Determine plan
      let plan: "starter" | "pro" | "elite" | "lifetime" = "starter";
      
      if (isVIP || profile?.has_lifetime_access) {
        plan = "lifetime";
      } else if (profile?.plan_override) {
        const normalizedOverride = profile.plan_override.toLowerCase();
        // Normalize all variations of elite/lifetime/vitalício
        if (normalizedOverride === "elite" || 
            normalizedOverride === "lifetime" || 
            normalizedOverride === "vitalicio" ||
            normalizedOverride === "vitacile") {
          plan = "elite";
        } else if (normalizedOverride === "pro") {
          plan = "pro";
        }
      } else if (subscription?.status === "active") {
        if (subscription.plan === "pro_ai" || subscription.plan === "advanced") {
          plan = "pro";
        }
      }

      // Check for monthly reset
      const now = new Date();
      const lastReset = profile?.last_credits_reset ? new Date(profile.last_credits_reset) : null;
      const needsReset = !lastReset || 
        (now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear());

      let credits = profile?.credits ?? PLAN_CREDITS[plan];

      // Reset credits if new month
      if (needsReset && plan !== "lifetime" && plan !== "elite") {
        credits = PLAN_CREDITS[plan];
        await supabase
          .from("profiles")
          .update({ 
            credits: credits,
            last_credits_reset: now.toISOString()
          })
          .eq("id", user.id);
      }

      // VIP and lifetime always have unlimited
      if (isVIP || plan === "lifetime" || plan === "elite") {
        credits = 9999;
      }

      setState({
        credits,
        plan,
        isLoading: false,
        isVIP,
        canUseFeature: credits > 0,
      });
    } catch (error) {
      console.error("Error fetching credits:", error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  useEffect(() => {
    fetchCredits();
  }, [fetchCredits]);

  const consumeCredit = useCallback(async (amount: number = 1): Promise<boolean> => {
    // VIP and unlimited plans don't consume credits
    if (state.isVIP || state.plan === "lifetime" || state.plan === "elite") {
      return true;
    }

    if (state.credits < amount) {
      setShowUpgradeModal(true);
      return false;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const newCredits = state.credits - amount;

      const { error } = await supabase
        .from("profiles")
        .update({ credits: newCredits })
        .eq("id", user.id);

      if (error) throw error;

      setState(prev => ({
        ...prev,
        credits: newCredits,
        canUseFeature: newCredits > 0,
      }));

      // Check if credits are exhausted
      if (newCredits <= 0) {
        setShowUpgradeModal(true);
      }

      return true;
    } catch (error) {
      console.error("Error consuming credit:", error);
      return false;
    }
  }, [state.credits, state.isVIP, state.plan]);

  const checkCredits = useCallback((amount: number = 1): boolean => {
    if (state.isVIP || state.plan === "lifetime" || state.plan === "elite") {
      return true;
    }
    
    if (state.credits < amount) {
      setShowUpgradeModal(true);
      return false;
    }
    
    return true;
  }, [state.credits, state.isVIP, state.plan]);

  return {
    ...state,
    showUpgradeModal,
    setShowUpgradeModal,
    consumeCredit,
    checkCredits,
    refresh: fetchCredits,
  };
}
