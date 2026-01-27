-- Add new columns for 360º Audit System to history_analysis table
ALTER TABLE public.history_analysis 
  ADD COLUMN IF NOT EXISTS photo_analysis JSONB,
  ADD COLUMN IF NOT EXISTS bio_analysis JSONB,
  ADD COLUMN IF NOT EXISTS performance_metrics JSONB,
  ADD COLUMN IF NOT EXISTS action_plan JSONB,
  ADD COLUMN IF NOT EXISTS highlight_suggestions TEXT[],
  ADD COLUMN IF NOT EXISTS content_suggestions JSONB,
  ADD COLUMN IF NOT EXISTS urgent_improvements TEXT[];

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_history_analysis_score ON public.history_analysis(score);

-- Add trigger to create admin alert when user gets low score (Rescue Plan)
CREATE OR REPLACE FUNCTION public.trigger_rescue_alert()
RETURNS TRIGGER AS $$
BEGIN
  -- If score is below 50, create admin alert
  IF NEW.score IS NOT NULL AND NEW.score < 50 THEN
    INSERT INTO public.admin_alerts (type, title, message, data)
    VALUES (
      'rescue_plan',
      'Plano de Resgate Ativado',
      'Um utilizador recebeu um Plano de Resgate com nota ' || NEW.score,
      jsonb_build_object(
        'user_id', NEW.user_id,
        'score', NEW.score,
        'profile_url', NEW.target_url,
        'platform', NEW.platform,
        'niche', NEW.niche_detected
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for rescue alerts
DROP TRIGGER IF EXISTS rescue_alert_trigger ON public.history_analysis;
CREATE TRIGGER rescue_alert_trigger
  AFTER INSERT OR UPDATE OF score ON public.history_analysis
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_rescue_alert();