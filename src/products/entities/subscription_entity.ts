import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('subscriptions')
export class SubscriptionEntity {
    @PrimaryColumn({ unique: true, nullable: false })
    sub_id: string;

    @Column({ nullable: true })
    uid: string;

    @Column({ nullable: true })
    email: string;

    @Column({ nullable: true })
    sub_type: string;

    @Column({ nullable: true })
    sub_chain_id: number;

    @Column({ nullable: true })
    sub_asset_contract: string;

    @Column({ nullable: true })
    sub_asset_symbol: string;

    @Column({ nullable: true })
    sub_asset_name: string;

    @Column({ nullable: true })
    sub_asset_decimals: number;

    @Column({ nullable: true })
    sub_asset_image: string;

    @Column({ nullable: false, type: 'bigint' })
    sub_created_at: BigInt;

    @Column({ nullable: false, type: 'bigint' })
    sub_updated_at: BigInt;

    @Column({ nullable: true })
    sub_status: string;

    @Column({ nullable: true })
    sub_reward_contract: string;

    @Column({ nullable: true })
    sub_reward_chain_id: number;

    @Column({ nullable: true })
    sub_reward_asset_name: string;

    @Column({ nullable: true })
    sub_reward_asset_symbol: string;

    @Column({ nullable: true })
    sub_reward_asset_image: string;

    @Column({ nullable: true })
    sub_reward_asset_decimals: number;

    @Column({ nullable: true })
    sub_package_name: string;

    @Column({ nullable: false, type: 'bigint' })
    sub_duration: BigInt;

    @Column({ nullable: true })
    sub_price: number;

    @Column({ nullable: true })
    sub_referral_code: string;

    @Column({ nullable: true })
    sub_mining_tag: string;

    @Column({ nullable: true })
    sub_wallet_hash: string;

    @Column({ nullable: true })
    sub_wallet_address: string;
}
