-- Add mp_is_manual column to mining_payments table
-- Run this SQL on your MySQL database if the table already exists

ALTER TABLE `mining_payments`
  ADD COLUMN `mp_is_manual` TINYINT NOT NULL DEFAULT 0 COMMENT '0 = referral-based, 1 = manual payment'
  AFTER `mp_referral_count_at_payment`;
