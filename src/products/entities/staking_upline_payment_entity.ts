import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('staking_upline_payments')
export class StakingUplinePaymentEntity {
    @PrimaryGeneratedColumn('uuid')
    sup_id: string;

    @Column({ nullable: false })
    sup_staking_payment_id: string; // The staking_payment (sp_id) that triggered this upline cut

    @Column({ nullable: false })
    sup_upline_uid: string; // The upline user who receives the 10%

    @Column({ nullable: false })
    sup_upline_email: string;

    @Column({ nullable: false })
    sup_upline_staking_id: string; // The upline's staking record

    @Column({ nullable: false })
    sup_downline_uid: string; // The referree whose payment triggers the upline cut

    @Column({ nullable: false })
    sup_downline_staking_id: string; // The referree's staking record

    @Column({ nullable: false })
    sup_downline_staking_plan: string;

    @Column({ type: 'double', nullable: false })
    sup_amount: number; // 10% of the double reward

    @Column({ nullable: true })
    sup_tx_data: string;

    @Column({ nullable: true })
    sup_tx_hash: string;

    @Column({ nullable: false })
    sup_chain_id: number;

    @Column({ nullable: true })
    sup_reward_symbol: string;

    @Column({ nullable: false, default: 'pending' })
    sup_status: string; // pending | confirmed

    @Column({ nullable: false, type: 'bigint' })
    sup_created_at: BigInt;

    @Column({ nullable: false, type: 'bigint' })
    sup_updated_at: BigInt;
}
