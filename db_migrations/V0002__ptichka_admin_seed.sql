
INSERT INTO ptichka_users (name, phone, password, avatar, is_admin)
VALUES ('admin', 'admin', '1111', '⚙️', TRUE)
ON CONFLICT (phone) DO NOTHING;
