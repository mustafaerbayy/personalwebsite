-- Create the delete_account_codes table for storing email verification codes
CREATE TABLE IF NOT EXISTS public.delete_account_codes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  code text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.delete_account_codes ENABLE ROW LEVEL SECURITY;

-- Only service role can access this table (edge functions use service role)
-- No RLS policies needed for regular users since they should never directly access this table

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_delete_account_codes_user_id ON public.delete_account_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_delete_account_codes_expires_at ON public.delete_account_codes(expires_at);

-- Add data_backup column to deleted_accounts for full account recovery
ALTER TABLE public.deleted_accounts ADD COLUMN IF NOT EXISTS data_backup jsonb;

-- Add comment explaining the backup column
COMMENT ON COLUMN public.deleted_accounts.data_backup IS 'Full JSON backup of user data (profile, applications, departments, files, reminders, cv) for account recovery';

