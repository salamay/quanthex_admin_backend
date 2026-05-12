import { Entity, PrimaryGeneratedColumn, Column, PrimaryColumn } from "typeorm";

@Entity('referrals')
export class ReferralEntity {
    @PrimaryColumn()
    referral_id: string
    @Column({nullable: false})
    referral_uid: string
    @Column({ nullable: false })
    referree_uid: string
    @Column({ nullable: false })
    referral_subscription_id: string
    @Column({ nullable: false })
    referree_subscription_id: string
    @Column({ nullable: false, type: 'bigint' })
    referral_created_at: BigInt
    @Column({ nullable: false, type: 'bigint' })
    referral_updated_at: BigInt
    @Column({ nullable: true })
    referral_descendant_uid: string
    @Column({ nullable: true })
    depth: number
    @Column({ type: 'json', nullable: true })
    referral_path: string[]

}