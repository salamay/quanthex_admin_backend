import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('stakings')
export class StakingEntity {
    @PrimaryColumn()
    staking_id: string;

    @Column()
    uid: string;

    @Column()
    email: string;

    @Column({ nullable: false, type: 'bigint' })
    stake_created_at: BigInt;

    @Column({ nullable: false, type: 'bigint' })
    stake_updated_at: BigInt;

    @Column({ nullable: true })
    staked_asset_symbol: string;

    @Column({ nullable: true })
    staked_asset_contract: string;

    @Column({ nullable: true })
    stacked_asset_decimals: number;

    @Column({ nullable: true })
    staked_asset_name: string;

    @Column({ nullable: true })
    staked_asset_image: string;

    @Column({ nullable: true })
    staked_amount_fiat: string;

    @Column({ nullable: true })
    staked_amount_crypto: string;

    @Column({ nullable: true })
    staking_status: string;

    @Column({ nullable: true })
    staking_reward_contract: string;

    @Column({ nullable: true })
    staking_reward_chain_id: number;

    @Column({ nullable: true })
    staking_reward_chain_name: string;

    @Column({ nullable: true })
    staking_reward_asset_name: string;

    @Column({ nullable: true })
    staking_reward_asset_symbol: string;

    @Column({ nullable: true })
    staking_reward_asset_decimals: number;

    @Column({ nullable: true })
    staking_reward_asset_image: string;

    @Column({ nullable: false, type: 'bigint' })
    duration: BigInt;

    @Column({ nullable: false, type: 'bigint' })
    end_date: BigInt;

    @Column({ nullable: false, type: 'bigint' })
    start_date: BigInt;

    @Column({ nullable: true })
    staking_wallet_hash: string;

    @Column({ nullable: true })
    staking_wallet_address: string;

    @Column({ nullable: false })
    staking_referral_code: string;

    @Column({ nullable: true })
    staking_plan: string;
}
