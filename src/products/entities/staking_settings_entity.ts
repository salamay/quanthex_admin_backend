import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('staking_settings')
export class StakingSettingsEntity {
    @PrimaryGeneratedColumn('uuid')
    ss_id: string;

    @Column({ nullable: false, unique: true })
    ss_plan_name: string; // e.g. "Plan 100", "Plan 200", etc.

    @Column({ type: 'double', nullable: false })
    ss_plan_amount: number; // The plan purchase amount (100, 200, 500, etc.)

    @Column({ type: 'double', nullable: false, default: 100 })
    ss_reward_percentage: number; // Admin-configurable reward percentage (100 = full double, 50 = half)

    @Column({ nullable: false, default: 6 })
    ss_referrals_per_cycle: number; // Number of referrals needed per payment cycle (default 6)

    @Column({ nullable: false, default: true })
    ss_is_active: boolean;

    @Column({ nullable: false, type: 'bigint' })
    ss_created_at: BigInt;

    @Column({ nullable: false, type: 'bigint' })
    ss_updated_at: BigInt;
}
