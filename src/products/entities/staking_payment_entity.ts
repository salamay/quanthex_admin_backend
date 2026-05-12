import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('staking_payments')
export class StakingPaymentEntity {
    @PrimaryGeneratedColumn('uuid')
    sp_id: string;

    @Column({ nullable: false })
    sp_staking_id: string;

    @Column({ nullable: false })
    sp_uid: string;

    @Column({ nullable: false })
    sp_email: string;

    @Column({ nullable: false })
    sp_staking_plan: string;

    @Column({ type: 'double', nullable: false })
    sp_amount: number;

    @Column({ nullable: false })
    sp_tx_data: string;

    @Column({ nullable: true })
    sp_tx_hash: string;

    @Column({ nullable: false })
    sp_chain_id: number;

    @Column({ nullable: true })
    sp_reward_symbol: string;

    @Column({ nullable: false })
    sp_payment_cycle: number; // 1 = first 6 referrals, 2 = second 6, etc.

    @Column({ nullable: false })
    sp_referral_count_at_payment: number;

    @Column({ nullable: false, default: 'pending' })
    sp_status: string;

    @Column({ nullable: false, type: 'bigint' })
    sp_created_at: BigInt;

    @Column({ nullable: false, type: 'bigint' })
    sp_updated_at: BigInt;
}
