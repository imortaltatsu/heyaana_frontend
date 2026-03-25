-- Referral/XP System Schema
-- Run this manually in the Neon console

CREATE TABLE IF NOT EXISTS referral_codes (
  id SERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL UNIQUE,
  code VARCHAR(8) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS referral_claims (
  id SERIAL PRIMARY KEY,
  referrer_id BIGINT NOT NULL,
  referee_id BIGINT NOT NULL UNIQUE,  -- each user can only claim once
  xp_awarded INTEGER NOT NULL DEFAULT 500,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS referral_xp (
  id SERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL UNIQUE,
  username VARCHAR(100),
  xp INTEGER NOT NULL DEFAULT 0,
  referral_count INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON referral_codes(code);
CREATE INDEX IF NOT EXISTS idx_referral_codes_user ON referral_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_xp_xp ON referral_xp(xp DESC);
CREATE INDEX IF NOT EXISTS idx_referral_claims_referrer ON referral_claims(referrer_id);
