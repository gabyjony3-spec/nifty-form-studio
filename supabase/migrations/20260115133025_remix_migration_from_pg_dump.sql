CREATE EXTENSION IF NOT EXISTS "pg_graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "plpgsql";
CREATE EXTENSION IF NOT EXISTS "supabase_vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";
BEGIN;

--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'admin',
    'user'
);


--
-- Name: subscription_plan; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.subscription_plan AS ENUM (
    'basic',
    'advanced',
    'pro_ai'
);


--
-- Name: subscription_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.subscription_status AS ENUM (
    'active',
    'cancelled',
    'expired',
    'trial'
);


--
-- Name: auto_configure_vip_on_signup(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.auto_configure_vip_on_signup() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  -- Admin dsweetwish493@gmail.com
  IF NEW.email = 'dsweetwish493@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  -- VIP adp.comunicacao2019@gmail.com
  IF NEW.email = 'adp.comunicacao2019@gmail.com' THEN
    UPDATE public.profiles SET has_lifetime_access = true WHERE id = NEW.id;
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;


--
-- Name: get_user_company_id(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_user_company_id(_user_id uuid) RETURNS uuid
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT company_id
  FROM public.company_users
  WHERE user_id = _user_id
  LIMIT 1
$$;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, trial_ends_at)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NOW() + INTERVAL '7 days'
  );
  
  -- Adicionar role padrão de 'user'
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;


--
-- Name: has_role(uuid, public.app_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;


--
-- Name: is_company_admin(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_company_admin(_user_id uuid, _company_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.company_users
    WHERE user_id = _user_id
      AND company_id = _company_id
      AND role IN ('owner', 'admin')
  )
$$;


--
-- Name: is_company_member(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_company_member(_user_id uuid, _company_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.company_users
    WHERE user_id = _user_id
      AND company_id = _company_id
  )
$$;


--
-- Name: setup_vip_admins(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.setup_vip_admins() RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  admin_user_id uuid;
  vip_user_id uuid;
BEGIN
  -- Configurar dsweetwish493@gmail.com como admin
  SELECT id INTO admin_user_id FROM auth.users WHERE email = 'dsweetwish493@gmail.com';
  IF admin_user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (admin_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  -- Configurar adp.comunicacao2019@gmail.com com lifetime access
  SELECT id INTO vip_user_id FROM auth.users WHERE email = 'adp.comunicacao2019@gmail.com';
  IF vip_user_id IS NOT NULL THEN
    UPDATE public.profiles SET has_lifetime_access = true WHERE id = vip_user_id;
    INSERT INTO public.user_roles (user_id, role)
    VALUES (vip_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END;
$$;


--
-- Name: update_history_analysis_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_history_analysis_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: ad_campaigns; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ad_campaigns (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    website_url text NOT NULL,
    source_analysis_id uuid,
    ai_headline text,
    ai_copy text,
    ai_description text,
    ad_variations jsonb DEFAULT '[]'::jsonb,
    target_audience jsonb DEFAULT '{}'::jsonb,
    daily_budget numeric DEFAULT 0,
    objective text DEFAULT 'REACH'::text,
    creative_url text,
    status text DEFAULT 'draft'::text,
    meta_campaign_id text,
    meta_adset_id text,
    meta_ad_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: admin_access_codes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admin_access_codes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code text NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    created_by uuid
);


--
-- Name: admin_activity_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admin_activity_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    admin_id uuid NOT NULL,
    target_user_id uuid NOT NULL,
    action text NOT NULL,
    old_value jsonb,
    new_value jsonb,
    notes text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: admin_alerts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admin_alerts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    type text NOT NULL,
    title text NOT NULL,
    message text,
    data jsonb,
    read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: audit_cache; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_cache (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    url text NOT NULL,
    url_hash text NOT NULL,
    seo_score integer,
    speed_score integer,
    structure_score integer,
    conversion_score integer,
    copywriting_score integer,
    overall_score integer,
    full_report jsonb,
    cached_at timestamp with time zone DEFAULT now(),
    expires_at timestamp with time zone DEFAULT (now() + '24:00:00'::interval)
);


--
-- Name: automation_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.automation_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    lead_id uuid,
    automation_id uuid,
    type text NOT NULL,
    status text DEFAULT 'pending'::text,
    content text,
    error_message text,
    external_message_id text,
    recipient_phone text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    company_id uuid,
    meta_message_id text,
    template_name text,
    trigger_id uuid,
    CONSTRAINT automation_logs_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'sent'::text, 'delivered'::text, 'read'::text, 'failed'::text]))),
    CONSTRAINT automation_logs_type_check CHECK ((type = ANY (ARRAY['whatsapp'::text, 'instagram'::text, 'meta_ads'::text, 'sms'::text, 'email'::text])))
);


--
-- Name: automation_triggers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.automation_triggers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid NOT NULL,
    name text NOT NULL,
    trigger_event text NOT NULL,
    action_type text DEFAULT 'send_template'::text,
    template_id uuid,
    action_params jsonb DEFAULT '{}'::jsonb,
    delay_minutes integer DEFAULT 0,
    is_active boolean DEFAULT true,
    executions_count integer DEFAULT 0,
    last_executed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT automation_triggers_action_type_check CHECK ((action_type = ANY (ARRAY['send_template'::text, 'send_text'::text]))),
    CONSTRAINT automation_triggers_trigger_event_check CHECK ((trigger_event = ANY (ARRAY['new_lead'::text, 'meta_ads_lead'::text, 'instagram_dm'::text, 'form_submit'::text, 'manual'::text])))
);


--
-- Name: automations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.automations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    type text NOT NULL,
    trigger_type text NOT NULL,
    trigger_value text,
    action_type text NOT NULL,
    action_value text,
    is_active boolean DEFAULT true,
    messages_sent integer DEFAULT 0,
    response_rate numeric(5,2) DEFAULT 0,
    conversions integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT automations_type_check CHECK ((type = ANY (ARRAY['instagram'::text, 'whatsapp'::text, 'email'::text])))
);


--
-- Name: companies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.companies (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    slug text,
    phone_number_id text,
    whatsapp_access_token text,
    waba_id text,
    webhook_verify_token text DEFAULT (gen_random_uuid())::text,
    whatsapp_credits integer DEFAULT 10,
    plan text DEFAULT 'trial'::text,
    is_active boolean DEFAULT true,
    meta_configured boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT companies_plan_check CHECK ((plan = ANY (ARRAY['trial'::text, 'pro'::text, 'business'::text])))
);


--
-- Name: company_users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.company_users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid NOT NULL,
    user_id uuid NOT NULL,
    role text DEFAULT 'member'::text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT company_users_role_check CHECK ((role = ANY (ARRAY['owner'::text, 'admin'::text, 'member'::text])))
);


--
-- Name: credit_transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.credit_transactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    amount integer NOT NULL,
    type text NOT NULL,
    description text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT credit_transactions_type_check CHECK ((type = ANY (ARRAY['add'::text, 'consume'::text, 'refund'::text])))
);


--
-- Name: history_analysis; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.history_analysis (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    target_url text,
    platform text,
    score integer,
    niche_detected text,
    profile_score_breakdown jsonb DEFAULT '{}'::jsonb,
    full_report_json jsonb DEFAULT '{}'::jsonb,
    calendar_data jsonb DEFAULT '[]'::jsonb,
    checklist_data jsonb DEFAULT '{}'::jsonb,
    follower_goal integer,
    current_followers integer,
    best_posting_times jsonb DEFAULT '[]'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    weaknesses text,
    strengths text,
    suggestions text
);


--
-- Name: lead_scores; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lead_scores (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    lead_id uuid NOT NULL,
    score integer,
    justification text,
    calculated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT lead_scores_score_check CHECK (((score >= 0) AND (score <= 100)))
);


--
-- Name: leads; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.leads (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    full_name text NOT NULL,
    email text NOT NULL,
    whatsapp text,
    company_name text,
    business_area text,
    revenue_earned numeric(10,2),
    amount_invested numeric(10,2),
    budget_to_invest numeric(10,2),
    source text DEFAULT 'landing_page'::text,
    status text DEFAULT 'new'::text,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    company_id uuid
);

ALTER TABLE ONLY public.leads REPLICA IDENTITY FULL;


--
-- Name: leads_analysis; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.leads_analysis (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    full_name text NOT NULL,
    whatsapp text NOT NULL,
    email text,
    website_url text NOT NULL,
    overall_score integer,
    seo_score integer,
    speed_score integer,
    conversion_score integer,
    structure_score integer,
    copywriting_score integer,
    message_sent boolean DEFAULT false,
    message_sent_at timestamp with time zone,
    status text DEFAULT 'new'::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: leads_servicos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.leads_servicos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nome text NOT NULL,
    email text NOT NULL,
    telefone text,
    servico text NOT NULL,
    status text DEFAULT 'Novo'::text NOT NULL,
    origem text NOT NULL,
    user_id text NOT NULL,
    data_criacao timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    type text NOT NULL,
    title text NOT NULL,
    message text,
    read boolean DEFAULT false,
    data jsonb,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    full_name text,
    email text,
    whatsapp text,
    company_name text,
    business_area text,
    revenue_earned numeric(10,2),
    amount_invested numeric(10,2),
    budget_to_invest numeric(10,2),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    avatar_url text,
    role text,
    website text,
    trial_ends_at timestamp with time zone,
    has_lifetime_access boolean DEFAULT false,
    whatsapp_credits integer DEFAULT 10,
    credits integer DEFAULT 5,
    plan_override text,
    last_credits_reset timestamp with time zone DEFAULT now()
);


--
-- Name: service_leads; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.service_leads (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    nome text,
    whatsapp text,
    objetivo text,
    investimento text,
    status text DEFAULT 'Novo'::text,
    aula_atual integer DEFAULT 1
);


--
-- Name: social_accounts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.social_accounts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    platform text NOT NULL,
    account_id text,
    account_name text,
    access_token text,
    followers_count integer DEFAULT 0,
    is_connected boolean DEFAULT true,
    connected_at timestamp with time zone DEFAULT now(),
    CONSTRAINT social_accounts_platform_check CHECK ((platform = ANY (ARRAY['instagram'::text, 'facebook'::text, 'whatsapp'::text])))
);


--
-- Name: social_analysis_cache; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.social_analysis_cache (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    platform text NOT NULL,
    username text NOT NULL,
    url_hash text NOT NULL,
    score integer,
    breakdown jsonb DEFAULT '{}'::jsonb,
    followers integer,
    engagement_rate numeric,
    post_frequency text,
    strengths text,
    weaknesses text,
    suggestions text,
    niche_detected text,
    best_posting_times jsonb DEFAULT '[]'::jsonb,
    analysis_count integer DEFAULT 1,
    cached_at timestamp with time zone DEFAULT now(),
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: social_media_analysis; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.social_media_analysis (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    social_account_id uuid,
    platform text NOT NULL,
    followers integer,
    engagement_rate numeric(5,2),
    post_frequency text,
    strengths text,
    weaknesses text,
    suggestions text,
    score integer,
    analyzed_at timestamp with time zone DEFAULT now(),
    CONSTRAINT social_media_analysis_score_check CHECK (((score >= 0) AND (score <= 100)))
);


--
-- Name: subscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subscriptions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    plan public.subscription_plan DEFAULT 'basic'::public.subscription_plan,
    status public.subscription_status DEFAULT 'trial'::public.subscription_status,
    stripe_customer_id text,
    stripe_subscription_id text,
    current_period_start timestamp with time zone,
    current_period_end timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    is_lifetime boolean DEFAULT false
);


--
-- Name: team_invites; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.team_invites (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    team_owner_id uuid NOT NULL,
    email text NOT NULL,
    role text DEFAULT 'viewer'::text,
    token text NOT NULL,
    status text DEFAULT 'pending'::text,
    created_at timestamp with time zone DEFAULT now(),
    accepted_at timestamp with time zone
);


--
-- Name: user_credits; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_credits (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    current_balance integer DEFAULT 10,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role NOT NULL
);


--
-- Name: user_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    whatsapp_configured boolean DEFAULT false,
    whatsapp_phone_number text,
    infobip_sender_id text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: webhook_configs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.webhook_configs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    webhook_type text DEFAULT 'ticto'::text NOT NULL,
    webhook_url text,
    secret_key text,
    is_active boolean DEFAULT true,
    last_test_at timestamp with time zone,
    last_test_status text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: website_analysis; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.website_analysis (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    url text NOT NULL,
    seo_score integer,
    speed_score integer,
    conversion_score integer,
    structure_score integer,
    copywriting_score integer,
    overall_score integer,
    recommendations text,
    full_report jsonb,
    analyzed_at timestamp with time zone DEFAULT now(),
    CONSTRAINT website_analysis_conversion_score_check CHECK (((conversion_score >= 0) AND (conversion_score <= 100))),
    CONSTRAINT website_analysis_copywriting_score_check CHECK (((copywriting_score >= 0) AND (copywriting_score <= 100))),
    CONSTRAINT website_analysis_overall_score_check CHECK (((overall_score >= 0) AND (overall_score <= 100))),
    CONSTRAINT website_analysis_seo_score_check CHECK (((seo_score >= 0) AND (seo_score <= 100))),
    CONSTRAINT website_analysis_speed_score_check CHECK (((speed_score >= 0) AND (speed_score <= 100))),
    CONSTRAINT website_analysis_structure_score_check CHECK (((structure_score >= 0) AND (structure_score <= 100)))
);


--
-- Name: whatsapp_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.whatsapp_templates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid NOT NULL,
    template_name text NOT NULL,
    template_id text,
    language_code text DEFAULT 'pt_PT'::text,
    category text DEFAULT 'MARKETING'::text,
    status text DEFAULT 'pending'::text,
    components jsonb DEFAULT '[]'::jsonb,
    header_text text,
    body_text text,
    footer_text text,
    buttons jsonb DEFAULT '[]'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT whatsapp_templates_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])))
);


--
-- Name: ad_campaigns ad_campaigns_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ad_campaigns
    ADD CONSTRAINT ad_campaigns_pkey PRIMARY KEY (id);


--
-- Name: admin_access_codes admin_access_codes_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_access_codes
    ADD CONSTRAINT admin_access_codes_code_key UNIQUE (code);


--
-- Name: admin_access_codes admin_access_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_access_codes
    ADD CONSTRAINT admin_access_codes_pkey PRIMARY KEY (id);


--
-- Name: admin_activity_logs admin_activity_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_activity_logs
    ADD CONSTRAINT admin_activity_logs_pkey PRIMARY KEY (id);


--
-- Name: admin_alerts admin_alerts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_alerts
    ADD CONSTRAINT admin_alerts_pkey PRIMARY KEY (id);


--
-- Name: audit_cache audit_cache_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_cache
    ADD CONSTRAINT audit_cache_pkey PRIMARY KEY (id);


--
-- Name: audit_cache audit_cache_url_hash_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_cache
    ADD CONSTRAINT audit_cache_url_hash_key UNIQUE (url_hash);


--
-- Name: automation_logs automation_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.automation_logs
    ADD CONSTRAINT automation_logs_pkey PRIMARY KEY (id);


--
-- Name: automation_triggers automation_triggers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.automation_triggers
    ADD CONSTRAINT automation_triggers_pkey PRIMARY KEY (id);


--
-- Name: automations automations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.automations
    ADD CONSTRAINT automations_pkey PRIMARY KEY (id);


--
-- Name: companies companies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_pkey PRIMARY KEY (id);


--
-- Name: companies companies_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_slug_key UNIQUE (slug);


--
-- Name: company_users company_users_company_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.company_users
    ADD CONSTRAINT company_users_company_id_user_id_key UNIQUE (company_id, user_id);


--
-- Name: company_users company_users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.company_users
    ADD CONSTRAINT company_users_pkey PRIMARY KEY (id);


--
-- Name: credit_transactions credit_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.credit_transactions
    ADD CONSTRAINT credit_transactions_pkey PRIMARY KEY (id);


--
-- Name: history_analysis history_analysis_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.history_analysis
    ADD CONSTRAINT history_analysis_pkey PRIMARY KEY (id);


--
-- Name: lead_scores lead_scores_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lead_scores
    ADD CONSTRAINT lead_scores_pkey PRIMARY KEY (id);


--
-- Name: leads_analysis leads_analysis_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leads_analysis
    ADD CONSTRAINT leads_analysis_pkey PRIMARY KEY (id);


--
-- Name: leads leads_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_pkey PRIMARY KEY (id);


--
-- Name: leads_servicos leads_servicos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leads_servicos
    ADD CONSTRAINT leads_servicos_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: service_leads service_leads_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_leads
    ADD CONSTRAINT service_leads_pkey PRIMARY KEY (id);


--
-- Name: social_accounts social_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.social_accounts
    ADD CONSTRAINT social_accounts_pkey PRIMARY KEY (id);


--
-- Name: social_accounts social_accounts_user_id_platform_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.social_accounts
    ADD CONSTRAINT social_accounts_user_id_platform_key UNIQUE (user_id, platform);


--
-- Name: social_analysis_cache social_analysis_cache_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.social_analysis_cache
    ADD CONSTRAINT social_analysis_cache_pkey PRIMARY KEY (id);


--
-- Name: social_analysis_cache social_analysis_cache_url_hash_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.social_analysis_cache
    ADD CONSTRAINT social_analysis_cache_url_hash_key UNIQUE (url_hash);


--
-- Name: social_media_analysis social_media_analysis_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.social_media_analysis
    ADD CONSTRAINT social_media_analysis_pkey PRIMARY KEY (id);


--
-- Name: subscriptions subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_pkey PRIMARY KEY (id);


--
-- Name: subscriptions subscriptions_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_user_id_key UNIQUE (user_id);


--
-- Name: team_invites team_invites_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_invites
    ADD CONSTRAINT team_invites_pkey PRIMARY KEY (id);


--
-- Name: team_invites team_invites_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_invites
    ADD CONSTRAINT team_invites_token_key UNIQUE (token);


--
-- Name: user_credits user_credits_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_credits
    ADD CONSTRAINT user_credits_pkey PRIMARY KEY (id);


--
-- Name: user_credits user_credits_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_credits
    ADD CONSTRAINT user_credits_user_id_key UNIQUE (user_id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


--
-- Name: user_settings user_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_settings
    ADD CONSTRAINT user_settings_pkey PRIMARY KEY (id);


--
-- Name: user_settings user_settings_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_settings
    ADD CONSTRAINT user_settings_user_id_key UNIQUE (user_id);


--
-- Name: webhook_configs webhook_configs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.webhook_configs
    ADD CONSTRAINT webhook_configs_pkey PRIMARY KEY (id);


--
-- Name: webhook_configs webhook_configs_user_id_webhook_type_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.webhook_configs
    ADD CONSTRAINT webhook_configs_user_id_webhook_type_key UNIQUE (user_id, webhook_type);


--
-- Name: website_analysis website_analysis_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.website_analysis
    ADD CONSTRAINT website_analysis_pkey PRIMARY KEY (id);


--
-- Name: whatsapp_templates whatsapp_templates_company_id_template_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.whatsapp_templates
    ADD CONSTRAINT whatsapp_templates_company_id_template_name_key UNIQUE (company_id, template_name);


--
-- Name: whatsapp_templates whatsapp_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.whatsapp_templates
    ADD CONSTRAINT whatsapp_templates_pkey PRIMARY KEY (id);


--
-- Name: idx_audit_cache_expires; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_cache_expires ON public.audit_cache USING btree (expires_at);


--
-- Name: idx_audit_cache_url_hash; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_cache_url_hash ON public.audit_cache USING btree (url_hash);


--
-- Name: idx_automation_logs_automation_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_automation_logs_automation_id ON public.automation_logs USING btree (automation_id);


--
-- Name: idx_automation_logs_company_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_automation_logs_company_id ON public.automation_logs USING btree (company_id);


--
-- Name: idx_automation_logs_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_automation_logs_created_at ON public.automation_logs USING btree (created_at DESC);


--
-- Name: idx_automation_logs_meta_message_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_automation_logs_meta_message_id ON public.automation_logs USING btree (meta_message_id);


--
-- Name: idx_automation_logs_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_automation_logs_status ON public.automation_logs USING btree (status);


--
-- Name: idx_automation_logs_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_automation_logs_user_id ON public.automation_logs USING btree (user_id);


--
-- Name: idx_automation_triggers_company_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_automation_triggers_company_id ON public.automation_triggers USING btree (company_id);


--
-- Name: idx_company_users_company_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_company_users_company_id ON public.company_users USING btree (company_id);


--
-- Name: idx_company_users_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_company_users_user_id ON public.company_users USING btree (user_id);


--
-- Name: idx_leads_company_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_leads_company_id ON public.leads USING btree (company_id);


--
-- Name: idx_social_cache_expires; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_social_cache_expires ON public.social_analysis_cache USING btree (expires_at);


--
-- Name: idx_social_cache_hash; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_social_cache_hash ON public.social_analysis_cache USING btree (url_hash);


--
-- Name: idx_social_cache_platform_username; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_social_cache_platform_username ON public.social_analysis_cache USING btree (platform, username);


--
-- Name: idx_whatsapp_templates_company_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_whatsapp_templates_company_id ON public.whatsapp_templates USING btree (company_id);


--
-- Name: ad_campaigns update_ad_campaigns_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_ad_campaigns_updated_at BEFORE UPDATE ON public.ad_campaigns FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: automation_logs update_automation_logs_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_automation_logs_updated_at BEFORE UPDATE ON public.automation_logs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: automation_triggers update_automation_triggers_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_automation_triggers_updated_at BEFORE UPDATE ON public.automation_triggers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: automations update_automations_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_automations_updated_at BEFORE UPDATE ON public.automations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: companies update_companies_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: history_analysis update_history_analysis_timestamp; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_history_analysis_timestamp BEFORE UPDATE ON public.history_analysis FOR EACH ROW EXECUTE FUNCTION public.update_history_analysis_updated_at();


--
-- Name: leads_analysis update_leads_analysis_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_leads_analysis_updated_at BEFORE UPDATE ON public.leads_analysis FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: subscriptions update_subscriptions_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: user_credits update_user_credits_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_user_credits_updated_at BEFORE UPDATE ON public.user_credits FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: user_settings update_user_settings_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON public.user_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: webhook_configs update_webhook_configs_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_webhook_configs_updated_at BEFORE UPDATE ON public.webhook_configs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: whatsapp_templates update_whatsapp_templates_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_whatsapp_templates_updated_at BEFORE UPDATE ON public.whatsapp_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: ad_campaigns ad_campaigns_source_analysis_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ad_campaigns
    ADD CONSTRAINT ad_campaigns_source_analysis_id_fkey FOREIGN KEY (source_analysis_id) REFERENCES public.website_analysis(id) ON DELETE SET NULL;


--
-- Name: ad_campaigns ad_campaigns_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ad_campaigns
    ADD CONSTRAINT ad_campaigns_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: admin_access_codes admin_access_codes_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_access_codes
    ADD CONSTRAINT admin_access_codes_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: automation_logs automation_logs_automation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.automation_logs
    ADD CONSTRAINT automation_logs_automation_id_fkey FOREIGN KEY (automation_id) REFERENCES public.automations(id) ON DELETE SET NULL;


--
-- Name: automation_logs automation_logs_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.automation_logs
    ADD CONSTRAINT automation_logs_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE SET NULL;


--
-- Name: automation_logs automation_logs_trigger_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.automation_logs
    ADD CONSTRAINT automation_logs_trigger_id_fkey FOREIGN KEY (trigger_id) REFERENCES public.automation_triggers(id) ON DELETE SET NULL;


--
-- Name: automation_triggers automation_triggers_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.automation_triggers
    ADD CONSTRAINT automation_triggers_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: automation_triggers automation_triggers_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.automation_triggers
    ADD CONSTRAINT automation_triggers_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.whatsapp_templates(id) ON DELETE SET NULL;


--
-- Name: automations automations_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.automations
    ADD CONSTRAINT automations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: company_users company_users_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.company_users
    ADD CONSTRAINT company_users_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: history_analysis history_analysis_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.history_analysis
    ADD CONSTRAINT history_analysis_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: lead_scores lead_scores_lead_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lead_scores
    ADD CONSTRAINT lead_scores_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE CASCADE;


--
-- Name: leads_analysis leads_analysis_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leads_analysis
    ADD CONSTRAINT leads_analysis_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: leads leads_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: leads leads_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: social_accounts social_accounts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.social_accounts
    ADD CONSTRAINT social_accounts_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: social_media_analysis social_media_analysis_social_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.social_media_analysis
    ADD CONSTRAINT social_media_analysis_social_account_id_fkey FOREIGN KEY (social_account_id) REFERENCES public.social_accounts(id) ON DELETE CASCADE;


--
-- Name: social_media_analysis social_media_analysis_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.social_media_analysis
    ADD CONSTRAINT social_media_analysis_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: subscriptions subscriptions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: webhook_configs webhook_configs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.webhook_configs
    ADD CONSTRAINT webhook_configs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: website_analysis website_analysis_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.website_analysis
    ADD CONSTRAINT website_analysis_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: whatsapp_templates whatsapp_templates_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.whatsapp_templates
    ADD CONSTRAINT whatsapp_templates_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: admin_access_codes Admins can delete codes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete codes" ON public.admin_access_codes FOR DELETE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: leads_analysis Admins can delete leads_analysis; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete leads_analysis" ON public.leads_analysis FOR DELETE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: admin_activity_logs Admins can insert activity logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert activity logs" ON public.admin_activity_logs FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: admin_access_codes Admins can insert codes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert codes" ON public.admin_access_codes FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_credits Admins can insert credits; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert credits" ON public.user_credits FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: subscriptions Admins can insert subscriptions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert subscriptions" ON public.subscriptions FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: credit_transactions Admins can insert transactions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert transactions" ON public.credit_transactions FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: admin_alerts Admins can manage alerts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage alerts" ON public.admin_alerts USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: history_analysis Admins can manage all history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all history" ON public.history_analysis USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_roles Admins can manage all roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all roles" ON public.user_roles USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: webhook_configs Admins can manage all webhook configs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all webhook configs" ON public.webhook_configs USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: profiles Admins can update all profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update all profiles" ON public.profiles FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: admin_access_codes Admins can update codes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update codes" ON public.admin_access_codes FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_credits Admins can update credits; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update credits" ON public.user_credits FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: leads_analysis Admins can update leads_analysis; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update leads_analysis" ON public.leads_analysis FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: admin_activity_logs Admins can view activity logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view activity logs" ON public.admin_activity_logs FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: history_analysis Admins can view all history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all history" ON public.history_analysis FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: profiles Admins can view all profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_settings Admins can view all settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all settings" ON public.user_settings FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: service_leads Admins podem atualizar leads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins podem atualizar leads" ON public.service_leads FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: leads_servicos Admins podem atualizar leads_servicos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins podem atualizar leads_servicos" ON public.leads_servicos FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: service_leads Admins podem deletar leads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins podem deletar leads" ON public.service_leads FOR DELETE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: leads_servicos Admins podem deletar leads_servicos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins podem deletar leads_servicos" ON public.leads_servicos FOR DELETE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: service_leads Admins podem ler leads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins podem ler leads" ON public.service_leads FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: leads_servicos Admins podem ver leads_servicos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins podem ver leads_servicos" ON public.leads_servicos FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: admin_access_codes Anyone can read active codes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can read active codes" ON public.admin_access_codes FOR SELECT USING ((is_active = true));


--
-- Name: audit_cache Anyone can read audit cache; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can read audit cache" ON public.audit_cache FOR SELECT USING (true);


--
-- Name: social_analysis_cache Anyone can read cache; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can read cache" ON public.social_analysis_cache FOR SELECT USING (true);


--
-- Name: whatsapp_templates Company admins can create templates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Company admins can create templates" ON public.whatsapp_templates FOR INSERT WITH CHECK ((public.is_company_admin(auth.uid(), company_id) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: automation_triggers Company admins can create triggers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Company admins can create triggers" ON public.automation_triggers FOR INSERT WITH CHECK ((public.is_company_admin(auth.uid(), company_id) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: leads Company admins can delete leads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Company admins can delete leads" ON public.leads FOR DELETE USING ((((company_id IS NOT NULL) AND public.is_company_admin(auth.uid(), company_id)) OR (auth.uid() = user_id) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: whatsapp_templates Company admins can delete templates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Company admins can delete templates" ON public.whatsapp_templates FOR DELETE USING ((public.is_company_admin(auth.uid(), company_id) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: automation_triggers Company admins can delete triggers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Company admins can delete triggers" ON public.automation_triggers FOR DELETE USING ((public.is_company_admin(auth.uid(), company_id) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: company_users Company admins can manage team; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Company admins can manage team" ON public.company_users FOR INSERT WITH CHECK ((public.is_company_admin(auth.uid(), company_id) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: company_users Company admins can remove team members; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Company admins can remove team members" ON public.company_users FOR DELETE USING ((public.is_company_admin(auth.uid(), company_id) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: leads Company admins can update leads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Company admins can update leads" ON public.leads FOR UPDATE USING ((((company_id IS NOT NULL) AND public.is_company_admin(auth.uid(), company_id)) OR (auth.uid() = user_id) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: company_users Company admins can update team; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Company admins can update team" ON public.company_users FOR UPDATE USING ((public.is_company_admin(auth.uid(), company_id) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: whatsapp_templates Company admins can update templates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Company admins can update templates" ON public.whatsapp_templates FOR UPDATE USING ((public.is_company_admin(auth.uid(), company_id) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: companies Company admins can update their company; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Company admins can update their company" ON public.companies FOR UPDATE USING ((public.is_company_admin(auth.uid(), id) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: automation_triggers Company admins can update triggers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Company admins can update triggers" ON public.automation_triggers FOR UPDATE USING ((public.is_company_admin(auth.uid(), company_id) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: leads Company members can view leads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Company members can view leads" ON public.leads FOR SELECT USING ((((company_id IS NOT NULL) AND public.is_company_member(auth.uid(), company_id)) OR (auth.uid() = user_id) OR public.has_role(auth.uid(), 'admin'::public.app_role) OR ((user_id IS NULL) AND (company_id IS NULL))));


--
-- Name: company_users Company members can view team members; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Company members can view team members" ON public.company_users FOR SELECT USING ((public.is_company_member(auth.uid(), company_id) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: whatsapp_templates Company members can view templates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Company members can view templates" ON public.whatsapp_templates FOR SELECT USING ((public.is_company_member(auth.uid(), company_id) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: companies Company members can view their company; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Company members can view their company" ON public.companies FOR SELECT USING ((public.is_company_member(auth.uid(), id) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: automation_triggers Company members can view triggers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Company members can view triggers" ON public.automation_triggers FOR SELECT USING ((public.is_company_member(auth.uid(), company_id) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: companies Only super admins can delete companies; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Only super admins can delete companies" ON public.companies FOR DELETE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: companies Only super admins can insert companies; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Only super admins can insert companies" ON public.companies FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: service_leads Permitir inserção pública; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permitir inserção pública" ON public.service_leads FOR INSERT WITH CHECK (true);


--
-- Name: leads Public can insert landing page leads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can insert landing page leads" ON public.leads FOR INSERT WITH CHECK ((((source = 'landing_page'::text) AND (user_id IS NULL)) OR ((auth.uid() IS NOT NULL) AND ((auth.uid() = user_id) OR public.has_role(auth.uid(), 'admin'::public.app_role)))));


--
-- Name: leads_analysis Public can insert leads_analysis; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can insert leads_analysis" ON public.leads_analysis FOR INSERT WITH CHECK (true);


--
-- Name: audit_cache Service can insert audit cache; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service can insert audit cache" ON public.audit_cache FOR INSERT WITH CHECK (true);


--
-- Name: social_analysis_cache Service can insert cache; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service can insert cache" ON public.social_analysis_cache FOR INSERT WITH CHECK (true);


--
-- Name: automation_logs Service can insert logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service can insert logs" ON public.automation_logs FOR INSERT WITH CHECK (true);


--
-- Name: audit_cache Service can update audit cache; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service can update audit cache" ON public.audit_cache FOR UPDATE USING (true);


--
-- Name: social_analysis_cache Service can update cache; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service can update cache" ON public.social_analysis_cache FOR UPDATE USING (true);


--
-- Name: automation_logs Service can update logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service can update logs" ON public.automation_logs FOR UPDATE USING (true);


--
-- Name: leads_servicos Service pode inserir leads_servicos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service pode inserir leads_servicos" ON public.leads_servicos FOR INSERT WITH CHECK (true);


--
-- Name: admin_alerts Service role can insert alerts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role can insert alerts" ON public.admin_alerts FOR INSERT WITH CHECK (true);


--
-- Name: team_invites Users can create invites; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create invites" ON public.team_invites FOR INSERT WITH CHECK ((auth.uid() = team_owner_id));


--
-- Name: history_analysis Users can delete own history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own history" ON public.history_analysis FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: team_invites Users can delete their own invites; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own invites" ON public.team_invites FOR DELETE USING ((auth.uid() = team_owner_id));


--
-- Name: notifications Users can delete their own notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own notifications" ON public.notifications FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: social_media_analysis Users can insert own analysis; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own analysis" ON public.social_media_analysis FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: history_analysis Users can insert own history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own history" ON public.history_analysis FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: profiles Users can insert own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK ((auth.uid() = id));


--
-- Name: user_roles Users can insert own role during signup; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own role during signup" ON public.user_roles FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: user_settings Users can insert own settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own settings" ON public.user_settings FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: ad_campaigns Users can manage own ad campaigns; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage own ad campaigns" ON public.ad_campaigns USING (((auth.uid() = user_id) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: automations Users can manage own automations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage own automations" ON public.automations USING (((auth.uid() = user_id) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: social_accounts Users can manage own social accounts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage own social accounts" ON public.social_accounts USING (((auth.uid() = user_id) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: webhook_configs Users can manage own webhook configs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage own webhook configs" ON public.webhook_configs USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: website_analysis Users can manage own website analysis; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage own website analysis" ON public.website_analysis USING (((auth.uid() = user_id) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: history_analysis Users can update own history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own history" ON public.history_analysis FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: profiles Users can update own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = id));


--
-- Name: user_settings Users can update own settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own settings" ON public.user_settings FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: subscriptions Users can update own subscription; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own subscription" ON public.subscriptions FOR UPDATE USING (((auth.uid() = user_id) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: team_invites Users can update their own invites; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own invites" ON public.team_invites FOR UPDATE USING (((auth.uid() = team_owner_id) OR (email = (( SELECT users.email
   FROM auth.users
  WHERE (users.id = auth.uid())))::text)));


--
-- Name: notifications Users can update their own notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: social_media_analysis Users can view own analysis; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own analysis" ON public.social_media_analysis FOR SELECT USING (((auth.uid() = user_id) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: user_credits Users can view own credits; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own credits" ON public.user_credits FOR SELECT USING (((auth.uid() = user_id) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: history_analysis Users can view own history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own history" ON public.history_analysis FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: leads_analysis Users can view own leads_analysis; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own leads_analysis" ON public.leads_analysis FOR SELECT USING (((auth.uid() = user_id) OR public.has_role(auth.uid(), 'admin'::public.app_role) OR (user_id IS NULL)));


--
-- Name: automation_logs Users can view own logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own logs" ON public.automation_logs FOR SELECT USING (((auth.uid() = user_id) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: profiles Users can view own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING ((auth.uid() = id));


--
-- Name: user_roles Users can view own role; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own role" ON public.user_roles FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_settings Users can view own settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own settings" ON public.user_settings FOR SELECT USING (((auth.uid() = user_id) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: subscriptions Users can view own subscription; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own subscription" ON public.subscriptions FOR SELECT USING (((auth.uid() = user_id) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: credit_transactions Users can view own transactions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own transactions" ON public.credit_transactions FOR SELECT USING (((auth.uid() = user_id) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: lead_scores Users can view scores for own leads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view scores for own leads" ON public.lead_scores FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.leads
  WHERE ((leads.id = lead_scores.lead_id) AND ((leads.user_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'::public.app_role))))));


--
-- Name: team_invites Users can view their own invites; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own invites" ON public.team_invites FOR SELECT USING (((auth.uid() = team_owner_id) OR (email = (( SELECT users.email
   FROM auth.users
  WHERE (users.id = auth.uid())))::text)));


--
-- Name: notifications Users can view their own notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: ad_campaigns; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ad_campaigns ENABLE ROW LEVEL SECURITY;

--
-- Name: admin_access_codes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.admin_access_codes ENABLE ROW LEVEL SECURITY;

--
-- Name: admin_activity_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.admin_activity_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: admin_alerts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.admin_alerts ENABLE ROW LEVEL SECURITY;

--
-- Name: audit_cache; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.audit_cache ENABLE ROW LEVEL SECURITY;

--
-- Name: automation_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.automation_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: automation_triggers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.automation_triggers ENABLE ROW LEVEL SECURITY;

--
-- Name: automations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.automations ENABLE ROW LEVEL SECURITY;

--
-- Name: companies; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

--
-- Name: company_users; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.company_users ENABLE ROW LEVEL SECURITY;

--
-- Name: credit_transactions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

--
-- Name: history_analysis; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.history_analysis ENABLE ROW LEVEL SECURITY;

--
-- Name: lead_scores; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.lead_scores ENABLE ROW LEVEL SECURITY;

--
-- Name: leads; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

--
-- Name: leads_analysis; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.leads_analysis ENABLE ROW LEVEL SECURITY;

--
-- Name: leads_servicos; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.leads_servicos ENABLE ROW LEVEL SECURITY;

--
-- Name: notifications; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: service_leads; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.service_leads ENABLE ROW LEVEL SECURITY;

--
-- Name: social_accounts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.social_accounts ENABLE ROW LEVEL SECURITY;

--
-- Name: social_analysis_cache; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.social_analysis_cache ENABLE ROW LEVEL SECURITY;

--
-- Name: social_media_analysis; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.social_media_analysis ENABLE ROW LEVEL SECURITY;

--
-- Name: subscriptions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

--
-- Name: team_invites; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.team_invites ENABLE ROW LEVEL SECURITY;

--
-- Name: user_credits; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- Name: user_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: webhook_configs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.webhook_configs ENABLE ROW LEVEL SECURITY;

--
-- Name: website_analysis; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.website_analysis ENABLE ROW LEVEL SECURITY;

--
-- Name: whatsapp_templates; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.whatsapp_templates ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--




COMMIT;