
CREATE TABLE IF NOT EXISTS ptichka_users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  avatar TEXT NOT NULL DEFAULT '🌿',
  total_kg NUMERIC(10,2) NOT NULL DEFAULT 0,
  is_admin BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ptichka_entries (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES ptichka_users(id),
  user_name TEXT NOT NULL,
  user_phone TEXT NOT NULL,
  type TEXT NOT NULL,
  kg NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
