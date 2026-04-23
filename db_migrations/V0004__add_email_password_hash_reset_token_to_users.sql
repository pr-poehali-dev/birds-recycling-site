ALTER TABLE t_p80181463_birds_recycling_site.ptichka_users
  ADD COLUMN IF NOT EXISTS email text NULL,
  ADD COLUMN IF NOT EXISTS password_hash text NULL,
  ADD COLUMN IF NOT EXISTS reset_token text NULL,
  ADD COLUMN IF NOT EXISTS reset_token_expires timestamptz NULL;

CREATE UNIQUE INDEX IF NOT EXISTS ptichka_users_email_uidx
  ON t_p80181463_birds_recycling_site.ptichka_users (email)
  WHERE email IS NOT NULL;
