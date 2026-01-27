import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface SubscriptionState {
  isLoading: boolean;
  isPro: boolean;
  isLifetime: boolean;
  isElite: boolean;
  isTrial: boolean;
  trialEndsAt: Date | null;
  trialDaysRemaining: number;
  analysisCount: number;
  analysisLimit: number;
  canAnalyze: boolean;
  subscriptionEnd: Date | null;
  plan: "free" | "pro" | "lifetime" | "elite";
}

const FREE_ANALYSIS_LIMIT = 3;

export function useSubscription() {
  const [state, setState] = useState<SubscriptionState>({
    isLoading: true,
    isPro: false,
    isLifetime: false,
    isElite: false,
    isTrial: false,
    trialEndsAt: null,
    trialDaysRemaining: 0,
    analysisCount: 0,
    analysisLimit: FREE_ANALYSIS_LIMIT,
    canAnalyze: true,
    subscriptionEnd: null,
    plan: "free",
  });

  const checkSubscription = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setState(prev => ({ ...prev, isLoading: false }));
        return;
      }

      // Fetch profile data for trial, lifetime access, and plan override
      const { data: profile } = await supabase
        .from("profiles")
        .select("trial_ends_at, has_lifetime_access, plan_override")
        .eq("id", user.id)
        .single();

      // Fetch subscription status from Stripe
      const { data: subscriptionData, error: subError } = await supabase
        .functions.invoke("check-subscription");

      // Count website analyses
      const { count: analysisCount } = await supabase
        .from("website_analysis")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      const now = new Date();
      const trialEndsAt = profile?.trial_ends_at ? new Date(profile.trial_ends_at) : null;
      const isTrial = trialEndsAt ? trialEndsAt > now : false;
      const trialDaysRemaining = trialEndsAt 
        ? Math.max(0, Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
        : 0;

      // Check lifetime access OR plan_override for elite/vitalício
      const isLifetime = profile?.has_lifetime_access ?? false;
      const planOverride = profile?.plan_override?.toLowerCase() || "";
      const isElite = ["elite", "lifetime", "vitalicio", "vitacile"].includes(planOverride);
      
      const hasActiveSubscription = subscriptionData?.subscribed === true;
      const isPro = isLifetime || isElite || hasActiveSubscription;
      
      const currentAnalysisCount = analysisCount ?? 0;
      const canAnalyze = isPro || isTrial || currentAnalysisCount < FREE_ANALYSIS_LIMIT;

      // Determine plan type with priority: lifetime > elite > pro > free
      let plan: "free" | "pro" | "lifetime" | "elite" = "free";
      if (isLifetime || planOverride === "vitalicio" || planOverride === "vitacile") {
        plan = "lifetime";
      } else if (isElite) {
        plan = "elite";
      } else if (hasActiveSubscription) {
        plan = "pro";
      }

      setState({
        isLoading: false,
        isPro,
        isLifetime: isLifetime || plan === "lifetime",
        isElite,
        isTrial,
        trialEndsAt,
        trialDaysRemaining,
        analysisCount: currentAnalysisCount,
        analysisLimit: FREE_ANALYSIS_LIMIT,
        canAnalyze,
        subscriptionEnd: subscriptionData?.subscription_end 
          ? new Date(subscriptionData.subscription_end) 
          : null,
        plan,
      });

    } catch (error) {
      console.error("Error checking subscription:", error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  useEffect(() => {
    checkSubscription();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkSubscription();
    });

    // Refresh every 60 seconds
    const interval = setInterval(checkSubscription, 60000);

    return () => {
      subscription.unsubscribe();
      clearInterval(interval);
    };
  }, [checkSubscription]);

  return {
    ...state,
    refresh: checkSubscription,
  };
}
