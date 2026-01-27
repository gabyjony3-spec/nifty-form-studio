ALTER TABLE history_analysis 
ADD COLUMN IF NOT EXISTS strategic_adjustments JSONB,
ADD COLUMN IF NOT EXISTS sales_funnel JSONB,
ADD COLUMN IF NOT EXISTS visual_identity JSONB,
ADD COLUMN IF NOT EXISTS monthly_content_plan JSONB,
ADD COLUMN IF NOT EXISTS content_pillars JSONB;