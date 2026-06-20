-- Add plan_tier to users table for subscription-based rate limiting.

ALTER TABLE users ADD COLUMN plan_tier VARCHAR(20) NOT NULL DEFAULT 'free';
