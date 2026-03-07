-- Create plans table with limits per plan
CREATE TABLE IF NOT EXISTS public.plans (
    id text PRIMARY KEY,
    name text NOT NULL,
    max_sites integer NOT NULL DEFAULT 1,
    max_pageviews integer NOT NULL DEFAULT 20000,
    max_active_popups integer NOT NULL DEFAULT 3,
    max_leads integer NOT NULL DEFAULT 1000,
    max_domains integer NOT NULL DEFAULT 1,
    price_brl integer NOT NULL DEFAULT 0
);

-- Enable RLS
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read plans
CREATE POLICY "Plans are viewable by authenticated users"
    ON public.plans FOR SELECT
    TO authenticated
    USING (true);

-- Seed plan data
INSERT INTO public.plans (id, name, max_sites, max_pageviews, max_active_popups, max_leads, max_domains, price_brl) VALUES
    ('starter', 'Starter', 1, 20000, 3, 1000, 1, 9700),
    ('pro', 'Pro', 5, 100000, 10, 5000, 5, 29700),
    ('agency', 'Agência', 999, 500000, 999, 50000, 999, 69700)
ON CONFLICT (id) DO NOTHING;

-- Update profiles: change default plan from 'free' to 'starter'
ALTER TABLE public.profiles ALTER COLUMN plan SET DEFAULT 'starter';

-- Update any existing 'free' plans to 'starter'
UPDATE public.profiles SET plan = 'starter' WHERE plan = 'free' OR plan IS NULL;

-- Assign agency plan to admin user
UPDATE public.profiles SET plan = 'agency' WHERE email = 'cmo@majorhub.com.br';
