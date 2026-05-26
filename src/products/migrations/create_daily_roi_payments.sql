-- Daily ROI payments table
-- Tracks per-staking daily ROI payouts with date-based deduplication
CREATE TABLE IF NOT EXISTS `daily_roi_payments` (
    `drp_id` VARCHAR(36) NOT NULL,
    `drp_staking_id` VARCHAR(255) NOT NULL,
    `drp_uid` VARCHAR(255) NOT NULL,
    `drp_email` VARCHAR(255) NOT NULL,
    `drp_staking_plan` VARCHAR(255) NOT NULL,
    `drp_staked_amount` DOUBLE NOT NULL,
    `drp_roi_percentage` DOUBLE NOT NULL,
    `drp_payout_amount` DOUBLE NOT NULL,
    `drp_payment_date` DATE NOT NULL,
    `drp_chain_id` INT NOT NULL DEFAULT 0,
    `drp_reward_symbol` VARCHAR(50) NULL,
    `drp_wallet_address` VARCHAR(255) NULL,
    `drp_tx_data` TEXT NULL,
    `drp_tx_hash` VARCHAR(255) NULL,
    `drp_status` VARCHAR(50) NOT NULL DEFAULT 'pending',
    `drp_created_at` BIGINT NOT NULL,
    `drp_updated_at` BIGINT NOT NULL,
    PRIMARY KEY (`drp_id`),
    UNIQUE INDEX `idx_drp_staking_date` (`drp_staking_id`, `drp_payment_date`),
    INDEX `idx_drp_uid` (`drp_uid`),
    INDEX `idx_drp_status` (`drp_status`),
    INDEX `idx_drp_payment_date` (`drp_payment_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
