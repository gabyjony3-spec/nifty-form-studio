-- Add pdf_url column to history_analysis table
ALTER TABLE public.history_analysis ADD COLUMN IF NOT EXISTS pdf_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.history_analysis.pdf_url IS 'URL or data URI of the generated PDF report';