import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('mining_payments')
export class MiningPaymentEntity {
    @PrimaryGeneratedColumn('uuid')
    mp_id: string;

    @Column({ nullable: false })
    mp_min_id: string;

    @Column({ nullable: false })
    mp_uid: string;

    @Column({ nullable: false })
    mp_subscription_id: string;

    @Column({ nullable: true })
    mp_tx_hash: string;

    @Column({ nullable: false })
    mp_tx_data: string;

    @Column({ type: 'double', nullable: false })
    mp_amount: number;

    @Column({ nullable: false })
    mp_chain_id: number;

    @Column({ nullable: true })
    mp_reward_symbol: string;

    @Column({ nullable: false })
    mp_payment_tier: number; // Sequential payment number (1, 2, 3, ...)

    @Column({ nullable: false })
    mp_referral_count_at_payment: number;

    @Column({ type: 'tinyint', nullable: false, default: 0 })
    mp_is_manual: number; // 0 = referral-based, 1 = manual payment

    @Column({ nullable: false, default: 'pending' })
    mp_status: string; // 'pending' | 'confirmed' | 'failed'

    @Column({ nullable: false, type: 'bigint' })
    mp_created_at: BigInt;

    @Column({ nullable: false, type: 'bigint' })
    mp_updated_at: BigInt;
}
