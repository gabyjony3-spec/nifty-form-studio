
-- Drop existing constraint and add new one with elite included
ALTER TABLE public.companies DROP CONSTRAINT IF EXISTS companies_plan_check;

ALTER TABLE public.companies 
ADD CONSTRAINT companies_plan_check 
CHECK (plan = ANY (ARRAY['trial'::text, 'pro'::text, 'business'::text, 'elite'::text]));
