import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('minings')
export class MiningEntity {
    @PrimaryColumn()
    min_id: string;

    @Column()
    uid: string;

    @Column()
    email: string;

    @Column({ nullable: false, type: 'bigint' })
    min_created_at: BigInt;

    @Column({ nullable: false, type: 'bigint' })
    min_updated_at: BigInt;

    @Column()
    min_subscription_id: string;

    @Column()
    mining_tag: string;

    @Column()
    mining_wallet_hash: string;

    @Column()
    mining_wallet_address: string;
}
