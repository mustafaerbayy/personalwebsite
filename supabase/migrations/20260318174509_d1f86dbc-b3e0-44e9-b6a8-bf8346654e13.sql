
CREATE TABLE public.cv_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  lang text NOT NULL CHECK (lang IN ('en', 'tr')),
  data jsonb NOT NULL DEFAULT '{}',
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, lang)
);

ALTER TABLE public.cv_content ENABLE ROW LEVEL SECURITY;

-- Anyone can read CV content (public page)
CREATE POLICY "Anyone can read cv_content"
  ON public.cv_content FOR SELECT
  TO public
  USING (true);

-- Only owner can insert/update/delete
CREATE POLICY "Owner can insert cv_content"
  ON public.cv_content FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owner can update cv_content"
  ON public.cv_content FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owner can delete cv_content"
  ON public.cv_content FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
