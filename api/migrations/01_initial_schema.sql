-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create Profiles Table (Extends Supabase auth.users)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    is_approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Row Level Security for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone."
    ON public.profiles FOR SELECT
    USING ( true );

CREATE POLICY "Users can insert their own profile."
    ON public.profiles FOR INSERT
    WITH CHECK ( auth.uid() = id );

CREATE POLICY "Users can update own profile."
    ON public.profiles FOR UPDATE
    USING ( auth.uid() = id );

-- Trigger to automatically create a profile for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, is_approved)
  VALUES (
    new.id, 
    new.email, 
    CASE WHEN new.email = 'vetrivelkvk@gmail.com' THEN 'admin' ELSE 'user' END,
    CASE WHEN new.email = 'vetrivelkvk@gmail.com' THEN TRUE ELSE FALSE END
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- 2. Create Invoices Table
CREATE TABLE public.invoices (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    bill_number INTEGER NOT NULL,
    date DATE NOT NULL,
    po_date DATE,
    po_number TEXT,
    to_details TEXT,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
    cgst NUMERIC(10,2) NOT NULL DEFAULT 0,
    sgst NUMERIC(10,2) NOT NULL DEFAULT 0,
    grand_total NUMERIC(12,2) NOT NULL DEFAULT 0,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'deleted')),
    pdf_url TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Row Level Security for Invoices
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Only approved users can manage invoices
CREATE POLICY "Approved users can view active invoices"
    ON public.invoices FOR SELECT
    USING ( 
        status = 'active' AND 
        EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_approved = TRUE) 
    );

CREATE POLICY "Approved users can insert invoices"
    ON public.invoices FOR INSERT
    WITH CHECK ( 
        EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_approved = TRUE) 
    );

CREATE POLICY "Approved users can update invoices"
    ON public.invoices FOR UPDATE
    USING ( 
        EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_approved = TRUE) 
    );


-- 3. Storage Buckets (Optional, but good practice to document if using Supabase Storage for PDFs/Assets)
-- Note: Storage buckets are usually created via the Supabase UI or API, 
-- but here is the logic for access control if the bucket 'invoice_pdfs' exists.
-- CREATE POLICY "Approved users can upload PDFs" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'invoice_pdfs' AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_approved = true));
-- CREATE POLICY "Approved users can view PDFs" ON storage.objects FOR SELECT USING (bucket_id = 'invoice_pdfs' AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_approved = true));
