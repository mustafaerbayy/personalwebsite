ALTER TABLE applications ADD COLUMN date_history JSONB DEFAULT '[]'::jsonb;
