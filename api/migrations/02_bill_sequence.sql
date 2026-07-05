-- 1. Enforce unique bill numbers
ALTER TABLE public.invoices ADD CONSTRAINT invoices_bill_number_key UNIQUE (bill_number);

-- 2. Create app_settings table to track current bill sequence
CREATE TABLE IF NOT EXISTS public.app_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL
);

-- Insert initial bill number (128) if it doesn't exist
INSERT INTO public.app_settings (key, value)
VALUES ('current_bill_number', '127'::jsonb)
ON CONFLICT (key) DO NOTHING;
