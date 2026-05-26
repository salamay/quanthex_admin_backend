-- Create mining_payments table for tracking tiered mining payments
-- Run this SQL on your MySQL database

CREATE TABLE IF NOT EXISTS `mining_payments` (
  `mp_id` VARCHAR(36) NOT NULL,
  `mp_min_id` VARCHAR(255) NOT NULL,
  `mp_uid` VARCHAR(255) NOT NULL,
  `mp_subscription_id` VARCHAR(255) NOT NULL,
  `mp_tx_hash` VARCHAR(255) DEFAULT NULL,
  `mp_tx_data` TEXT NOT NULL,
  `mp_amount` DOUBLE NOT NULL,
  `mp_chain_id` INT NOT NULL,
  `mp_reward_symbol` VARCHAR(50) DEFAULT NULL,
  `mp_payment_tier` INT NOT NULL COMMENT 'Payment tier: 6, 36, 216, or 1296',
  `mp_referral_count_at_payment` INT NOT NULL,
  `mp_is_manual` TINYINT NOT NULL DEFAULT 0 COMMENT '0 = referral-based, 1 = manual payment',
  `mp_status` VARCHAR(20) NOT NULL DEFAULT 'pending' COMMENT 'pending | confirmed | failed',
  `mp_created_at` BIGINT NOT NULL,
  `mp_updated_at` BIGINT NOT NULL,
  PRIMARY KEY (`mp_id`),
  KEY `idx_mp_min_id` (`mp_min_id`),
  KEY `idx_mp_uid` (`mp_uid`),
  KEY `idx_mp_status` (`mp_status`),
  KEY `idx_mp_min_id_status` (`mp_min_id`, `mp_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
