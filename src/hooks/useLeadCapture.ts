import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface LeadFormData {
  full_name: string;
  email: string;
  whatsapp: string;
  company_name?: string;
  business_area?: string;
  revenue_earned?: number;
  amount_invested?: number;
  budget_to_invest?: number;
}

export const useLeadCapture = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitLead = async (formData: LeadFormData) => {
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('leads')
        .insert([
          {
            full_name: formData.full_name,
            email: formData.email,
            whatsapp: formData.whatsapp,
            company_name: formData.company_name,
            business_area: formData.business_area,
            revenue_earned: formData.revenue_earned || null,
            amount_invested: formData.amount_invested || null,
            budget_to_invest: formData.budget_to_invest || null,
            source: 'landing_page',
            status: 'new',
          },
        ]);

      if (error) {
        console.error('Error submitting lead:', error);
        toast({
          title: 'Erro ao cadastrar',
          description: 'Ocorreu um erro ao processar seu cadastro. Por favor, tente novamente.',
          variant: 'destructive',
        });
        return false;
      }

      toast({
        title: 'Cadastro realizado!',
        description: 'Seus dados foram enviados com sucesso. Em breve entraremos em contato.',
      });

      return true;
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: 'Erro inesperado',
        description: 'Ocorreu um erro inesperado. Por favor, tente novamente.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return { submitLead, isSubmitting };
};
