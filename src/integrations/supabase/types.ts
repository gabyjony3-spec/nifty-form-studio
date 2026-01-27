export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      ad_campaigns: {
        Row: {
          ad_variations: Json | null
          ai_copy: string | null
          ai_description: string | null
          ai_headline: string | null
          created_at: string
          creative_url: string | null
          daily_budget: number | null
          id: string
          meta_ad_id: string | null
          meta_adset_id: string | null
          meta_campaign_id: string | null
          name: string
          objective: string | null
          source_analysis_id: string | null
          status: string | null
          target_audience: Json | null
          updated_at: string
          user_id: string
          website_url: string
        }
        Insert: {
          ad_variations?: Json | null
          ai_copy?: string | null
          ai_description?: string | null
          ai_headline?: string | null
          created_at?: string
          creative_url?: string | null
          daily_budget?: number | null
          id?: string
          meta_ad_id?: string | null
          meta_adset_id?: string | null
          meta_campaign_id?: string | null
          name: string
          objective?: string | null
          source_analysis_id?: string | null
          status?: string | null
          target_audience?: Json | null
          updated_at?: string
          user_id: string
          website_url: string
        }
        Update: {
          ad_variations?: Json | null
          ai_copy?: string | null
          ai_description?: string | null
          ai_headline?: string | null
          created_at?: string
          creative_url?: string | null
          daily_budget?: number | null
          id?: string
          meta_ad_id?: string | null
          meta_adset_id?: string | null
          meta_campaign_id?: string | null
          name?: string
          objective?: string | null
          source_analysis_id?: string | null
          status?: string | null
          target_audience?: Json | null
          updated_at?: string
          user_id?: string
          website_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "ad_campaigns_source_analysis_id_fkey"
            columns: ["source_analysis_id"]
            isOneToOne: false
            referencedRelation: "website_analysis"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_access_codes: {
        Row: {
          code: string
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
        }
        Insert: {
          code: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
        }
        Update: {
          code?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
        }
        Relationships: []
      }
      admin_activity_logs: {
        Row: {
          action: string
          admin_id: string
          created_at: string | null
          id: string
          new_value: Json | null
          notes: string | null
          old_value: Json | null
          target_user_id: string
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string | null
          id?: string
          new_value?: Json | null
          notes?: string | null
          old_value?: Json | null
          target_user_id: string
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string | null
          id?: string
          new_value?: Json | null
          notes?: string | null
          old_value?: Json | null
          target_user_id?: string
        }
        Relationships: []
      }
      admin_alerts: {
        Row: {
          created_at: string | null
          data: Json | null
          id: string
          message: string | null
          read: boolean | null
          title: string
          type: string
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          id?: string
          message?: string | null
          read?: boolean | null
          title: string
          type: string
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          id?: string
          message?: string | null
          read?: boolean | null
          title?: string
          type?: string
        }
        Relationships: []
      }
      admin_twilio_config: {
        Row: {
          account_sid: string
          auth_token: string
          created_at: string | null
          id: string
          is_active: boolean | null
          phone_number: string
          updated_at: string | null
        }
        Insert: {
          account_sid: string
          auth_token: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          phone_number: string
          updated_at?: string | null
        }
        Update: {
          account_sid?: string
          auth_token?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          phone_number?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      admin_whatsapp_config: {
        Row: {
          created_at: string
          default_provider: string
          id: string
          infobip_api_key: string | null
          infobip_base_url: string | null
          infobip_sender_number: string | null
          is_active: boolean | null
          meta_access_token: string | null
          meta_phone_number_id: string | null
          meta_waba_id: string | null
          provider_type: string
          updated_at: string
          wallet_balance: number | null
        }
        Insert: {
          created_at?: string
          default_provider?: string
          id?: string
          infobip_api_key?: string | null
          infobip_base_url?: string | null
          infobip_sender_number?: string | null
          is_active?: boolean | null
          meta_access_token?: string | null
          meta_phone_number_id?: string | null
          meta_waba_id?: string | null
          provider_type?: string
          updated_at?: string
          wallet_balance?: number | null
        }
        Update: {
          created_at?: string
          default_provider?: string
          id?: string
          infobip_api_key?: string | null
          infobip_base_url?: string | null
          infobip_sender_number?: string | null
          is_active?: boolean | null
          meta_access_token?: string | null
          meta_phone_number_id?: string | null
          meta_waba_id?: string | null
          provider_type?: string
          updated_at?: string
          wallet_balance?: number | null
        }
        Relationships: []
      }
      audit_cache: {
        Row: {
          cached_at: string | null
          conversion_score: number | null
          copywriting_score: number | null
          expires_at: string | null
          full_report: Json | null
          id: string
          overall_score: number | null
          seo_score: number | null
          speed_score: number | null
          structure_score: number | null
          url: string
          url_hash: string
        }
        Insert: {
          cached_at?: string | null
          conversion_score?: number | null
          copywriting_score?: number | null
          expires_at?: string | null
          full_report?: Json | null
          id?: string
          overall_score?: number | null
          seo_score?: number | null
          speed_score?: number | null
          structure_score?: number | null
          url: string
          url_hash: string
        }
        Update: {
          cached_at?: string | null
          conversion_score?: number | null
          copywriting_score?: number | null
          expires_at?: string | null
          full_report?: Json | null
          id?: string
          overall_score?: number | null
          seo_score?: number | null
          speed_score?: number | null
          structure_score?: number | null
          url?: string
          url_hash?: string
        }
        Relationships: []
      }
      automation_logs: {
        Row: {
          automation_id: string | null
          company_id: string | null
          content: string | null
          created_at: string | null
          error_message: string | null
          external_message_id: string | null
          id: string
          lead_id: string | null
          meta_message_id: string | null
          metadata: Json | null
          recipient_phone: string | null
          status: string | null
          template_name: string | null
          trigger_id: string | null
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          automation_id?: string | null
          company_id?: string | null
          content?: string | null
          created_at?: string | null
          error_message?: string | null
          external_message_id?: string | null
          id?: string
          lead_id?: string | null
          meta_message_id?: string | null
          metadata?: Json | null
          recipient_phone?: string | null
          status?: string | null
          template_name?: string | null
          trigger_id?: string | null
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          automation_id?: string | null
          company_id?: string | null
          content?: string | null
          created_at?: string | null
          error_message?: string | null
          external_message_id?: string | null
          id?: string
          lead_id?: string | null
          meta_message_id?: string | null
          metadata?: Json | null
          recipient_phone?: string | null
          status?: string | null
          template_name?: string | null
          trigger_id?: string | null
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_logs_automation_id_fkey"
            columns: ["automation_id"]
            isOneToOne: false
            referencedRelation: "automations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_logs_trigger_id_fkey"
            columns: ["trigger_id"]
            isOneToOne: false
            referencedRelation: "automation_triggers"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_triggers: {
        Row: {
          action_params: Json | null
          action_type: string | null
          company_id: string
          created_at: string | null
          delay_minutes: number | null
          executions_count: number | null
          id: string
          is_active: boolean | null
          last_executed_at: string | null
          name: string
          template_id: string | null
          trigger_event: string
          updated_at: string | null
        }
        Insert: {
          action_params?: Json | null
          action_type?: string | null
          company_id: string
          created_at?: string | null
          delay_minutes?: number | null
          executions_count?: number | null
          id?: string
          is_active?: boolean | null
          last_executed_at?: string | null
          name: string
          template_id?: string | null
          trigger_event: string
          updated_at?: string | null
        }
        Update: {
          action_params?: Json | null
          action_type?: string | null
          company_id?: string
          created_at?: string | null
          delay_minutes?: number | null
          executions_count?: number | null
          id?: string
          is_active?: boolean | null
          last_executed_at?: string | null
          name?: string
          template_id?: string | null
          trigger_event?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "automation_triggers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_triggers_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      automations: {
        Row: {
          action_type: string
          action_value: string | null
          conversions: number | null
          created_at: string | null
          id: string
          is_active: boolean | null
          messages_sent: number | null
          name: string
          response_rate: number | null
          trigger_type: string
          trigger_value: string | null
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          action_type: string
          action_value?: string | null
          conversions?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          messages_sent?: number | null
          name: string
          response_rate?: number | null
          trigger_type: string
          trigger_value?: string | null
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          action_type?: string
          action_value?: string | null
          conversions?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          messages_sent?: number | null
          name?: string
          response_rate?: number | null
          trigger_type?: string
          trigger_value?: string | null
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      communication_logs: {
        Row: {
          admin_id: string | null
          created_at: string | null
          error_message: string | null
          external_id: string | null
          id: string
          message_content: string
          metadata: Json | null
          provider: string
          recipient_name: string | null
          recipient_phone: string
          status: string | null
          user_id: string | null
        }
        Insert: {
          admin_id?: string | null
          created_at?: string | null
          error_message?: string | null
          external_id?: string | null
          id?: string
          message_content: string
          metadata?: Json | null
          provider: string
          recipient_name?: string | null
          recipient_phone: string
          status?: string | null
          user_id?: string | null
        }
        Update: {
          admin_id?: string | null
          created_at?: string | null
          error_message?: string | null
          external_id?: string | null
          id?: string
          message_content?: string
          metadata?: Json | null
          provider?: string
          recipient_name?: string | null
          recipient_phone?: string
          status?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      companies: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          meta_configured: boolean | null
          name: string
          phone_number_id: string | null
          plan: string | null
          slug: string | null
          updated_at: string | null
          waba_id: string | null
          webhook_verify_token: string | null
          whatsapp_access_token: string | null
          whatsapp_credits: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          meta_configured?: boolean | null
          name: string
          phone_number_id?: string | null
          plan?: string | null
          slug?: string | null
          updated_at?: string | null
          waba_id?: string | null
          webhook_verify_token?: string | null
          whatsapp_access_token?: string | null
          whatsapp_credits?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          meta_configured?: boolean | null
          name?: string
          phone_number_id?: string | null
          plan?: string | null
          slug?: string | null
          updated_at?: string | null
          waba_id?: string | null
          webhook_verify_token?: string | null
          whatsapp_access_token?: string | null
          whatsapp_credits?: number | null
        }
        Relationships: []
      }
      company_users: {
        Row: {
          company_id: string
          created_at: string | null
          id: string
          role: string | null
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string | null
          id?: string
          role?: string | null
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string | null
          id?: string
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_users_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_transactions: {
        Row: {
          amount: number
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      history_analysis: {
        Row: {
          action_plan: Json | null
          best_posting_times: Json | null
          bio_analysis: Json | null
          calendar_data: Json | null
          checklist_data: Json | null
          content_pillars: Json | null
          content_suggestions: Json | null
          created_at: string | null
          current_followers: number | null
          follower_goal: number | null
          following_count: number | null
          full_report_json: Json | null
          highlight_suggestions: string[] | null
          id: string
          monthly_content_plan: Json | null
          niche_detected: string | null
          pdf_url: string | null
          performance_metrics: Json | null
          photo_analysis: Json | null
          platform: string | null
          posts_count: number | null
          profile_data: Json | null
          profile_score_breakdown: Json | null
          sales_funnel: Json | null
          score: number | null
          strategic_adjustments: Json | null
          strengths: string | null
          suggestions: string | null
          target_url: string | null
          updated_at: string | null
          urgent_improvements: string[] | null
          user_id: string
          visual_identity: Json | null
          weaknesses: string | null
        }
        Insert: {
          action_plan?: Json | null
          best_posting_times?: Json | null
          bio_analysis?: Json | null
          calendar_data?: Json | null
          checklist_data?: Json | null
          content_pillars?: Json | null
          content_suggestions?: Json | null
          created_at?: string | null
          current_followers?: number | null
          follower_goal?: number | null
          following_count?: number | null
          full_report_json?: Json | null
          highlight_suggestions?: string[] | null
          id?: string
          monthly_content_plan?: Json | null
          niche_detected?: string | null
          pdf_url?: string | null
          performance_metrics?: Json | null
          photo_analysis?: Json | null
          platform?: string | null
          posts_count?: number | null
          profile_data?: Json | null
          profile_score_breakdown?: Json | null
          sales_funnel?: Json | null
          score?: number | null
          strategic_adjustments?: Json | null
          strengths?: string | null
          suggestions?: string | null
          target_url?: string | null
          updated_at?: string | null
          urgent_improvements?: string[] | null
          user_id: string
          visual_identity?: Json | null
          weaknesses?: string | null
        }
        Update: {
          action_plan?: Json | null
          best_posting_times?: Json | null
          bio_analysis?: Json | null
          calendar_data?: Json | null
          checklist_data?: Json | null
          content_pillars?: Json | null
          content_suggestions?: Json | null
          created_at?: string | null
          current_followers?: number | null
          follower_goal?: number | null
          following_count?: number | null
          full_report_json?: Json | null
          highlight_suggestions?: string[] | null
          id?: string
          monthly_content_plan?: Json | null
          niche_detected?: string | null
          pdf_url?: string | null
          performance_metrics?: Json | null
          photo_analysis?: Json | null
          platform?: string | null
          posts_count?: number | null
          profile_data?: Json | null
          profile_score_breakdown?: Json | null
          sales_funnel?: Json | null
          score?: number | null
          strategic_adjustments?: Json | null
          strengths?: string | null
          suggestions?: string | null
          target_url?: string | null
          updated_at?: string | null
          urgent_improvements?: string[] | null
          user_id?: string
          visual_identity?: Json | null
          weaknesses?: string | null
        }
        Relationships: []
      }
      lead_scores: {
        Row: {
          calculated_at: string | null
          id: string
          justification: string | null
          lead_id: string
          score: number | null
        }
        Insert: {
          calculated_at?: string | null
          id?: string
          justification?: string | null
          lead_id: string
          score?: number | null
        }
        Update: {
          calculated_at?: string | null
          id?: string
          justification?: string | null
          lead_id?: string
          score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_scores_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          amount_invested: number | null
          budget_to_invest: number | null
          business_area: string | null
          company_id: string | null
          company_name: string | null
          created_at: string | null
          email: string
          full_name: string
          id: string
          notes: string | null
          revenue_earned: number | null
          source: string | null
          status: string | null
          user_id: string | null
          whatsapp: string | null
        }
        Insert: {
          amount_invested?: number | null
          budget_to_invest?: number | null
          business_area?: string | null
          company_id?: string | null
          company_name?: string | null
          created_at?: string | null
          email: string
          full_name: string
          id?: string
          notes?: string | null
          revenue_earned?: number | null
          source?: string | null
          status?: string | null
          user_id?: string | null
          whatsapp?: string | null
        }
        Update: {
          amount_invested?: number | null
          budget_to_invest?: number | null
          business_area?: string | null
          company_id?: string | null
          company_name?: string | null
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          notes?: string | null
          revenue_earned?: number | null
          source?: string | null
          status?: string | null
          user_id?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      leads_analysis: {
        Row: {
          conversion_score: number | null
          copywriting_score: number | null
          created_at: string | null
          email: string | null
          full_name: string
          id: string
          message_sent: boolean | null
          message_sent_at: string | null
          overall_score: number | null
          seo_score: number | null
          speed_score: number | null
          status: string | null
          structure_score: number | null
          updated_at: string | null
          user_id: string | null
          website_url: string
          whatsapp: string
        }
        Insert: {
          conversion_score?: number | null
          copywriting_score?: number | null
          created_at?: string | null
          email?: string | null
          full_name: string
          id?: string
          message_sent?: boolean | null
          message_sent_at?: string | null
          overall_score?: number | null
          seo_score?: number | null
          speed_score?: number | null
          status?: string | null
          structure_score?: number | null
          updated_at?: string | null
          user_id?: string | null
          website_url: string
          whatsapp: string
        }
        Update: {
          conversion_score?: number | null
          copywriting_score?: number | null
          created_at?: string | null
          email?: string | null
          full_name?: string
          id?: string
          message_sent?: boolean | null
          message_sent_at?: string | null
          overall_score?: number | null
          seo_score?: number | null
          speed_score?: number | null
          status?: string | null
          structure_score?: number | null
          updated_at?: string | null
          user_id?: string | null
          website_url?: string
          whatsapp?: string
        }
        Relationships: []
      }
      leads_servicos: {
        Row: {
          data_criacao: string
          email: string
          id: string
          nome: string
          origem: string
          servico: string
          status: string
          telefone: string | null
          user_id: string
        }
        Insert: {
          data_criacao?: string
          email: string
          id?: string
          nome: string
          origem: string
          servico: string
          status?: string
          telefone?: string | null
          user_id: string
        }
        Update: {
          data_criacao?: string
          email?: string
          id?: string
          nome?: string
          origem?: string
          servico?: string
          status?: string
          telefone?: string | null
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          data: Json | null
          id: string
          message: string | null
          read: boolean | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          id?: string
          message?: string | null
          read?: boolean | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          id?: string
          message?: string | null
          read?: boolean | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          amount_invested: number | null
          avatar_url: string | null
          budget_to_invest: number | null
          business_area: string | null
          company_name: string | null
          created_at: string | null
          credits: number | null
          email: string | null
          full_name: string | null
          has_lifetime_access: boolean | null
          id: string
          last_credits_reset: string | null
          plan_override: string | null
          revenue_earned: number | null
          role: string | null
          trial_ends_at: string | null
          updated_at: string | null
          website: string | null
          whatsapp: string | null
          whatsapp_credits: number | null
          whatsapp_receive_leads: string | null
        }
        Insert: {
          amount_invested?: number | null
          avatar_url?: string | null
          budget_to_invest?: number | null
          business_area?: string | null
          company_name?: string | null
          created_at?: string | null
          credits?: number | null
          email?: string | null
          full_name?: string | null
          has_lifetime_access?: boolean | null
          id: string
          last_credits_reset?: string | null
          plan_override?: string | null
          revenue_earned?: number | null
          role?: string | null
          trial_ends_at?: string | null
          updated_at?: string | null
          website?: string | null
          whatsapp?: string | null
          whatsapp_credits?: number | null
          whatsapp_receive_leads?: string | null
        }
        Update: {
          amount_invested?: number | null
          avatar_url?: string | null
          budget_to_invest?: number | null
          business_area?: string | null
          company_name?: string | null
          created_at?: string | null
          credits?: number | null
          email?: string | null
          full_name?: string | null
          has_lifetime_access?: boolean | null
          id?: string
          last_credits_reset?: string | null
          plan_override?: string | null
          revenue_earned?: number | null
          role?: string | null
          trial_ends_at?: string | null
          updated_at?: string | null
          website?: string | null
          whatsapp?: string | null
          whatsapp_credits?: number | null
          whatsapp_receive_leads?: string | null
        }
        Relationships: []
      }
      scheduled_whatsapp_messages: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          lead_email: string | null
          lead_name: string | null
          lead_phone: string
          message_preview: string | null
          message_template: string
          metadata: Json | null
          scheduled_at: string | null
          sent_at: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          lead_email?: string | null
          lead_name?: string | null
          lead_phone: string
          message_preview?: string | null
          message_template: string
          metadata?: Json | null
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          lead_email?: string | null
          lead_name?: string | null
          lead_phone?: string
          message_preview?: string | null
          message_template?: string
          metadata?: Json | null
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      service_leads: {
        Row: {
          aula_atual: number | null
          created_at: string
          id: string
          investimento: string | null
          nome: string | null
          objetivo: string | null
          status: string | null
          whatsapp: string | null
        }
        Insert: {
          aula_atual?: number | null
          created_at?: string
          id?: string
          investimento?: string | null
          nome?: string | null
          objetivo?: string | null
          status?: string | null
          whatsapp?: string | null
        }
        Update: {
          aula_atual?: number | null
          created_at?: string
          id?: string
          investimento?: string | null
          nome?: string | null
          objetivo?: string | null
          status?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      social_accounts: {
        Row: {
          access_token: string | null
          account_id: string | null
          account_name: string | null
          connected_at: string | null
          followers_count: number | null
          id: string
          is_connected: boolean | null
          platform: string
          user_id: string
        }
        Insert: {
          access_token?: string | null
          account_id?: string | null
          account_name?: string | null
          connected_at?: string | null
          followers_count?: number | null
          id?: string
          is_connected?: boolean | null
          platform: string
          user_id: string
        }
        Update: {
          access_token?: string | null
          account_id?: string | null
          account_name?: string | null
          connected_at?: string | null
          followers_count?: number | null
          id?: string
          is_connected?: boolean | null
          platform?: string
          user_id?: string
        }
        Relationships: []
      }
      social_analysis_cache: {
        Row: {
          analysis_count: number | null
          best_posting_times: Json | null
          breakdown: Json | null
          cached_at: string | null
          created_at: string | null
          engagement_rate: number | null
          expires_at: string
          followers: number | null
          id: string
          niche_detected: string | null
          platform: string
          post_frequency: string | null
          score: number | null
          strengths: string | null
          suggestions: string | null
          url_hash: string
          username: string
          weaknesses: string | null
        }
        Insert: {
          analysis_count?: number | null
          best_posting_times?: Json | null
          breakdown?: Json | null
          cached_at?: string | null
          created_at?: string | null
          engagement_rate?: number | null
          expires_at: string
          followers?: number | null
          id?: string
          niche_detected?: string | null
          platform: string
          post_frequency?: string | null
          score?: number | null
          strengths?: string | null
          suggestions?: string | null
          url_hash: string
          username: string
          weaknesses?: string | null
        }
        Update: {
          analysis_count?: number | null
          best_posting_times?: Json | null
          breakdown?: Json | null
          cached_at?: string | null
          created_at?: string | null
          engagement_rate?: number | null
          expires_at?: string
          followers?: number | null
          id?: string
          niche_detected?: string | null
          platform?: string
          post_frequency?: string | null
          score?: number | null
          strengths?: string | null
          suggestions?: string | null
          url_hash?: string
          username?: string
          weaknesses?: string | null
        }
        Relationships: []
      }
      social_media_analysis: {
        Row: {
          analyzed_at: string | null
          engagement_rate: number | null
          followers: number | null
          id: string
          platform: string
          post_frequency: string | null
          score: number | null
          social_account_id: string | null
          strengths: string | null
          suggestions: string | null
          user_id: string
          weaknesses: string | null
        }
        Insert: {
          analyzed_at?: string | null
          engagement_rate?: number | null
          followers?: number | null
          id?: string
          platform: string
          post_frequency?: string | null
          score?: number | null
          social_account_id?: string | null
          strengths?: string | null
          suggestions?: string | null
          user_id: string
          weaknesses?: string | null
        }
        Update: {
          analyzed_at?: string | null
          engagement_rate?: number | null
          followers?: number | null
          id?: string
          platform?: string
          post_frequency?: string | null
          score?: number | null
          social_account_id?: string | null
          strengths?: string | null
          suggestions?: string | null
          user_id?: string
          weaknesses?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "social_media_analysis_social_account_id_fkey"
            columns: ["social_account_id"]
            isOneToOne: false
            referencedRelation: "social_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          is_lifetime: boolean | null
          plan: Database["public"]["Enums"]["subscription_plan"] | null
          status: Database["public"]["Enums"]["subscription_status"] | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          is_lifetime?: boolean | null
          plan?: Database["public"]["Enums"]["subscription_plan"] | null
          status?: Database["public"]["Enums"]["subscription_status"] | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          is_lifetime?: boolean | null
          plan?: Database["public"]["Enums"]["subscription_plan"] | null
          status?: Database["public"]["Enums"]["subscription_status"] | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      team_invites: {
        Row: {
          accepted_at: string | null
          created_at: string | null
          email: string
          id: string
          role: string | null
          status: string | null
          team_owner_id: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string | null
          email: string
          id?: string
          role?: string | null
          status?: string | null
          team_owner_id: string
          token: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string | null
          email?: string
          id?: string
          role?: string | null
          status?: string | null
          team_owner_id?: string
          token?: string
        }
        Relationships: []
      }
      user_credits: {
        Row: {
          created_at: string | null
          current_balance: number | null
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_balance?: number | null
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_balance?: number | null
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_presence: {
        Row: {
          created_at: string | null
          current_page: string | null
          device_info: Json | null
          id: string
          last_seen_at: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_page?: string | null
          device_info?: Json | null
          id?: string
          last_seen_at?: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_page?: string | null
          device_info?: Json | null
          id?: string
          last_seen_at?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          created_at: string | null
          id: string
          infobip_sender_id: string | null
          updated_at: string | null
          user_id: string
          whatsapp_configured: boolean | null
          whatsapp_phone_number: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          infobip_sender_id?: string | null
          updated_at?: string | null
          user_id: string
          whatsapp_configured?: boolean | null
          whatsapp_phone_number?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          infobip_sender_id?: string | null
          updated_at?: string | null
          user_id?: string
          whatsapp_configured?: boolean | null
          whatsapp_phone_number?: string | null
        }
        Relationships: []
      }
      webhook_configs: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          last_test_at: string | null
          last_test_status: string | null
          secret_key: string | null
          updated_at: string
          user_id: string | null
          webhook_type: string
          webhook_url: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_test_at?: string | null
          last_test_status?: string | null
          secret_key?: string | null
          updated_at?: string
          user_id?: string | null
          webhook_type?: string
          webhook_url?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_test_at?: string | null
          last_test_status?: string | null
          secret_key?: string | null
          updated_at?: string
          user_id?: string | null
          webhook_type?: string
          webhook_url?: string | null
        }
        Relationships: []
      }
      website_analysis: {
        Row: {
          analyzed_at: string | null
          conversion_score: number | null
          copywriting_score: number | null
          full_report: Json | null
          id: string
          overall_score: number | null
          recommendations: string | null
          seo_score: number | null
          speed_score: number | null
          structure_score: number | null
          url: string
          user_id: string
        }
        Insert: {
          analyzed_at?: string | null
          conversion_score?: number | null
          copywriting_score?: number | null
          full_report?: Json | null
          id?: string
          overall_score?: number | null
          recommendations?: string | null
          seo_score?: number | null
          speed_score?: number | null
          structure_score?: number | null
          url: string
          user_id: string
        }
        Update: {
          analyzed_at?: string | null
          conversion_score?: number | null
          copywriting_score?: number | null
          full_report?: Json | null
          id?: string
          overall_score?: number | null
          recommendations?: string | null
          seo_score?: number | null
          speed_score?: number | null
          structure_score?: number | null
          url?: string
          user_id?: string
        }
        Relationships: []
      }
      whatsapp_templates: {
        Row: {
          body_text: string | null
          buttons: Json | null
          category: string | null
          company_id: string
          components: Json | null
          created_at: string | null
          footer_text: string | null
          header_text: string | null
          id: string
          language_code: string | null
          status: string | null
          template_id: string | null
          template_name: string
          updated_at: string | null
        }
        Insert: {
          body_text?: string | null
          buttons?: Json | null
          category?: string | null
          company_id: string
          components?: Json | null
          created_at?: string | null
          footer_text?: string | null
          header_text?: string | null
          id?: string
          language_code?: string | null
          status?: string | null
          template_id?: string | null
          template_name: string
          updated_at?: string | null
        }
        Update: {
          body_text?: string | null
          buttons?: Json | null
          category?: string | null
          company_id?: string
          components?: Json | null
          created_at?: string | null
          footer_text?: string | null
          header_text?: string | null
          id?: string
          language_code?: string | null
          status?: string | null
          template_id?: string | null
          template_name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_templates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_company_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_company_admin: {
        Args: { _company_id: string; _user_id: string }
        Returns: boolean
      }
      is_company_member: {
        Args: { _company_id: string; _user_id: string }
        Returns: boolean
      }
      setup_vip_admins: { Args: never; Returns: undefined }
      update_user_presence: {
        Args: { _current_page?: string; _device_info?: Json; _status?: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "user"
      subscription_plan: "basic" | "advanced" | "pro_ai"
      subscription_status: "active" | "cancelled" | "expired" | "trial"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
      subscription_plan: ["basic", "advanced", "pro_ai"],
      subscription_status: ["active", "cancelled", "expired", "trial"],
    },
  },
} as const
