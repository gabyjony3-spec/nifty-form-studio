import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UserCompany {
  id: string;
  name: string;
  plan: string;
  whatsapp_credits: number;
  is_active: boolean;
  meta_configured: boolean;
  phone_number_id: string | null;
  waba_id: string | null;
  whatsapp_access_token: string | null;
  webhook_verify_token: string | null;
}

interface CompanyMembership {
  company_id: string;
  role: string;
  company: UserCompany;
}

export const useUserCompany = () => {
  const [companies, setCompanies] = useState<CompanyMembership[]>([]);
  const [activeCompany, setActiveCompany] = useState<UserCompany | null>(null);
  const [activeRole, setActiveRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const loadUserCompanies = useCallback(async (isRetry = false) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      
      setUserId(user.id);

      // Fetch user's company memberships
      const { data: memberships, error } = await supabase
        .from('company_users')
        .select(`
          company_id,
          role,
          company:companies(
            id,
            name,
            plan,
            whatsapp_credits,
            is_active,
            meta_configured,
            phone_number_id,
            waba_id,
            whatsapp_access_token,
            webhook_verify_token
          )
        `)
        .eq('user_id', user.id);

      if (error) {
        console.error("[useUserCompany] Error fetching companies:", error);
        setLoading(false);
        return;
      }

      if (memberships && memberships.length > 0) {
        const formattedMemberships = memberships.map(m => ({
          company_id: m.company_id,
          role: m.role,
          company: m.company as unknown as UserCompany
        }));
        
        setCompanies(formattedMemberships);
        
        // Set first company as active by default
        const firstMembership = formattedMemberships[0];
        setActiveCompany(firstMembership.company);
        setActiveRole(firstMembership.role);
      } else if (!isRetry) {
        // No memberships found - try to ensure company membership
        console.log("[useUserCompany] No memberships found, calling ensure-company-membership");
        try {
          const { error: fnError } = await supabase.functions.invoke('ensure-company-membership');
          if (fnError) {
            console.error("[useUserCompany] ensure-company-membership error:", fnError);
          } else {
            // Retry loading after ensuring membership
            return loadUserCompanies(true);
          }
        } catch (fnErr) {
          console.error("[useUserCompany] Failed to invoke ensure-company-membership:", fnErr);
        }
      }
    } catch (error) {
      console.error("[useUserCompany] Error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUserCompanies();
  }, [loadUserCompanies]);

  // Set up realtime subscriptions for company data
  useEffect(() => {
    if (!userId || !activeCompany?.id) return;

    console.log("[useUserCompany] Setting up realtime subscriptions");

    // Subscribe to company_users changes for this user
    const membershipChannel = supabase
      .channel('company-membership-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'company_users',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log("[useUserCompany] Membership changed:", payload);
          loadUserCompanies();
        }
      )
      .subscribe();

    // Subscribe to company updates for the active company
    const companyChannel = supabase
      .channel('company-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'companies',
          filter: `id=eq.${activeCompany.id}`
        },
        (payload) => {
          console.log("[useUserCompany] Company updated:", payload);
          const updatedCompany = payload.new as UserCompany;
          setActiveCompany(prev => prev ? { ...prev, ...updatedCompany } : null);
          
          // Update in the companies array too
          setCompanies(prev => prev.map(m => 
            m.company_id === updatedCompany.id 
              ? { ...m, company: { ...m.company, ...updatedCompany } }
              : m
          ));
        }
      )
      .subscribe();

    return () => {
      console.log("[useUserCompany] Cleaning up realtime subscriptions");
      supabase.removeChannel(membershipChannel);
      supabase.removeChannel(companyChannel);
    };
  }, [userId, activeCompany?.id, loadUserCompanies]);

  // Switch active company
  const switchCompany = useCallback((companyId: string) => {
    const membership = companies.find(c => c.company_id === companyId);
    if (membership) {
      setActiveCompany(membership.company);
      setActiveRole(membership.role);
    }
  }, [companies]);

  // Check if user can manage company (owner or admin)
  const canManage = activeRole === 'owner' || activeRole === 'admin';

  return {
    companies,
    activeCompany,
    activeRole,
    loading,
    userId,
    switchCompany,
    canManage,
    refetch: loadUserCompanies,
    hasCompany: companies.length > 0
  };
};
