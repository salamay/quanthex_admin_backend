import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('staking_referrals')
export class StakingReferralsEntity {
    @PrimaryColumn()
    staking_referral_id: string;

    @Column({ nullable: false })
    staking_referral_uid: string;

    @Column({ nullable: false })
    staking_referree_uid: string;

    @Column({ nullable: false })
    staking_referral_staking_id: string;

    @Column({ nullable: false })
    staking_referree_staking_id: string;

    @Column({ nullable: false, type: 'bigint' })
    staking_referral_created_at: BigInt;

    @Column({ nullable: false, type: 'bigint' })
    staking_referral_updated_at: BigInt;
}
