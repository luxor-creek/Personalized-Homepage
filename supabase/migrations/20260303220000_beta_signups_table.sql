-- Beta signups table
CREATE TABLE IF NOT EXISTS public.beta_signups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  company text NOT NULL,
  email text NOT NULL,
  phone text,
  source text DEFAULT 'homepage',
  tool text,
  created_at timestamptz DEFAULT now()
);

-- Allow anonymous inserts (public signup forms)
ALTER TABLE public.beta_signups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous inserts" ON public.beta_signups
  FOR INSERT TO anon WITH CHECK (true);

-- Allow authenticated reads (admin dashboard)
CREATE POLICY "Allow authenticated reads" ON public.beta_signups
  FOR SELECT TO authenticated USING (true);

-- Allow authenticated deletes (admin cleanup)
CREATE POLICY "Allow authenticated deletes" ON public.beta_signups
  FOR DELETE TO authenticated USING (true);
