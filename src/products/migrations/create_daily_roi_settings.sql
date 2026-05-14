-- Daily ROI settings table (single global row)
CREATE TABLE IF NOT EXISTS `daily_roi_settings` (
    `dr_id` VARCHAR(36) NOT NULL,
    `dr_daily_roi_percentage` DOUBLE NOT NULL DEFAULT 0.5,
    `dr_is_active` TINYINT(1) NOT NULL DEFAULT 1,
    `dr_created_at` BIGINT NOT NULL,
    `dr_updated_at` BIGINT NOT NULL,
    PRIMARY KEY (`dr_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed with default global daily ROI of 0.5%
INSERT INTO `daily_roi_settings` (`dr_id`, `dr_daily_roi_percentage`, `dr_is_active`, `dr_created_at`, `dr_updated_at`)
VALUES (UUID(), 0.5, 1, UNIX_TIMESTAMP() * 1000, UNIX_TIMESTAMP() * 1000);
