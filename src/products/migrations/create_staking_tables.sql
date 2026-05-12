-- Staking payments table (new table, admin-owned)
CREATE TABLE IF NOT EXISTS `staking_payments` (
    `sp_id` VARCHAR(36) NOT NULL,
    `sp_staking_id` VARCHAR(255) NOT NULL,
    `sp_uid` VARCHAR(255) NOT NULL,
    `sp_email` VARCHAR(255) NOT NULL,
    `sp_staking_plan` VARCHAR(255) NOT NULL,
    `sp_amount` DOUBLE NOT NULL,
    `sp_tx_data` TEXT NOT NULL,
    `sp_tx_hash` VARCHAR(255) NULL,
    `sp_chain_id` INT NOT NULL,
    `sp_reward_symbol` VARCHAR(50) NULL,
    `sp_payment_cycle` INT NOT NULL,
    `sp_referral_count_at_payment` INT NOT NULL,
    `sp_status` VARCHAR(50) NOT NULL DEFAULT 'pending',
    `sp_created_at` BIGINT NOT NULL,
    `sp_updated_at` BIGINT NOT NULL,
    PRIMARY KEY (`sp_id`),
    INDEX `idx_sp_staking_id` (`sp_staking_id`),
    INDEX `idx_sp_uid` (`sp_uid`),
    INDEX `idx_sp_status` (`sp_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Staking settings table (new table, admin-owned)
CREATE TABLE IF NOT EXISTS `staking_settings` (
    `ss_id` VARCHAR(36) NOT NULL,
    `ss_plan_name` VARCHAR(255) NOT NULL,
    `ss_plan_amount` DOUBLE NOT NULL,
    `ss_reward_percentage` DOUBLE NOT NULL DEFAULT 100,
    `ss_referrals_per_cycle` INT NOT NULL DEFAULT 6,
    `ss_is_active` TINYINT(1) NOT NULL DEFAULT 1,
    `ss_created_at` BIGINT NOT NULL,
    `ss_updated_at` BIGINT NOT NULL,
    PRIMARY KEY (`ss_id`),
    UNIQUE INDEX `idx_ss_plan_name` (`ss_plan_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed default staking settings for all plans
-- ss_reward_percentage: 100 = full double payment (plan_amount * 2), 50 = half, etc.
INSERT INTO `staking_settings` (`ss_id`, `ss_plan_name`, `ss_plan_amount`, `ss_reward_percentage`, `ss_referrals_per_cycle`, `ss_is_active`, `ss_created_at`, `ss_updated_at`)
VALUES
    (UUID(), 'Plan 100', 100, 100, 6, 1, UNIX_TIMESTAMP() * 1000, UNIX_TIMESTAMP() * 1000),
    (UUID(), 'Plan 200', 200, 100, 6, 1, UNIX_TIMESTAMP() * 1000, UNIX_TIMESTAMP() * 1000),
    (UUID(), 'Plan 500', 500, 100, 6, 1, UNIX_TIMESTAMP() * 1000, UNIX_TIMESTAMP() * 1000),
    (UUID(), 'Plan 1000', 1000, 100, 6, 1, UNIX_TIMESTAMP() * 1000, UNIX_TIMESTAMP() * 1000),
    (UUID(), 'Plan 1500', 1500, 100, 6, 1, UNIX_TIMESTAMP() * 1000, UNIX_TIMESTAMP() * 1000),
    (UUID(), 'Plan 2000', 2000, 100, 6, 1, UNIX_TIMESTAMP() * 1000, UNIX_TIMESTAMP() * 1000),
    (UUID(), 'Plan 3000', 3000, 100, 6, 1, UNIX_TIMESTAMP() * 1000, UNIX_TIMESTAMP() * 1000),
    (UUID(), 'Plan 5000', 5000, 100, 6, 1, UNIX_TIMESTAMP() * 1000, UNIX_TIMESTAMP() * 1000);

-- Staking upline payments table (new table, admin-owned)
-- Tracks the 10% upline cut from each staking double payment
CREATE TABLE IF NOT EXISTS `staking_upline_payments` (
    `sup_id` VARCHAR(36) NOT NULL,
    `sup_staking_payment_id` VARCHAR(255) NOT NULL,
    `sup_upline_uid` VARCHAR(255) NOT NULL,
    `sup_upline_email` VARCHAR(255) NOT NULL,
    `sup_upline_staking_id` VARCHAR(255) NOT NULL,
    `sup_downline_uid` VARCHAR(255) NOT NULL,
    `sup_downline_staking_id` VARCHAR(255) NOT NULL,
    `sup_downline_staking_plan` VARCHAR(255) NOT NULL,
    `sup_amount` DOUBLE NOT NULL,
    `sup_tx_data` TEXT NULL,
    `sup_tx_hash` VARCHAR(255) NULL,
    `sup_chain_id` INT NOT NULL,
    `sup_reward_symbol` VARCHAR(50) NULL,
    `sup_status` VARCHAR(50) NOT NULL DEFAULT 'pending',
    `sup_created_at` BIGINT NOT NULL,
    `sup_updated_at` BIGINT NOT NULL,
    PRIMARY KEY (`sup_id`),
    INDEX `idx_sup_staking_payment_id` (`sup_staking_payment_id`),
    INDEX `idx_sup_upline_uid` (`sup_upline_uid`),
    INDEX `idx_sup_status` (`sup_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
