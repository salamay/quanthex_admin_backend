import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('daily_roi_payments')
export class DailyRoiPaymentEntity {
    @PrimaryGeneratedColumn('uuid')
    drp_id: string;

    @Column({ nullable: false })
    drp_staking_id: string;

    @Column({ nullable: false })
    drp_uid: string;

    @Column({ nullable: false })
    drp_email: string;

    @Column({ nullable: false })
    drp_staking_plan: string;

    @Column({ type: 'double', nullable: false })
    drp_staked_amount: number;

    @Column({ type: 'double', nullable: false })
    drp_roi_percentage: number;

    @Column({ type: 'double', nullable: false })
    drp_payout_amount: number;

    @Column({ type: 'date', nullable: false })
    drp_payment_date: string;

    @Column({ nullable: false, default: 0 })
    drp_chain_id: number;

    @Column({ nullable: true })
    drp_reward_symbol: string;

    @Column({ nullable: true })
    drp_wallet_address: string;

    @Column({ type: 'text', nullable: true })
    drp_tx_data: string;

    @Column({ nullable: true })
    drp_tx_hash: string;

    @Column({ nullable: false, default: 'pending' })
    drp_status: string;

    @Column({ nullable: false, type: 'bigint' })
    drp_created_at: BigInt;

    @Column({ nullable: false, type: 'bigint' })
    drp_updated_at: BigInt;
}
