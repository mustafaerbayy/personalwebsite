ALTER TABLE applications ADD COLUMN is_archived BOOLEAN DEFAULT false;
ALTER TABLE applications ADD COLUMN archived_at TIMESTAMPTZ;
