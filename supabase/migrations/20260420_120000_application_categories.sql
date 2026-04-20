CREATE TABLE public.application_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  label TEXT NOT NULL,
  color TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.application_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own categories" 
ON public.application_categories FOR ALL 
USING (auth.uid() = user_id);

-- Change applications.status to text
ALTER TABLE public.applications ALTER COLUMN status DROP DEFAULT;
ALTER TABLE public.applications ALTER COLUMN status TYPE TEXT USING status::text;
