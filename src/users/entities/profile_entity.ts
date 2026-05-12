import {Column, Entity, PrimaryColumn} from 'typeorm'
@Entity("profiles")
export class ProfileEntity {
    @PrimaryColumn({unique:true,nullable:false})
    uid: string
    @Column({nullable: false})
    email: string
    @Column({ nullable: false })
    account_status: string
    @Column({ nullable: false })
    roles   : string
    @Column({ nullable: false,type:'bigint' })
    profile_created_at: BigInt
    @Column({ nullable: false,type:'bigint' })
    profile_updated_at: BigInt
    @Column({ nullable: true })
    pin: string
    @Column({ nullable: false })
    referral_code: string
}