import { Column, Entity, PrimaryColumn } from 'typeorm';
@Entity('users')
export class UserEntity{
    @PrimaryColumn({unique:true})
    uid: string
    @Column({nullable: false})
    email: string
    @Column({ nullable: false })
    password: string
    @Column({ nullable: false })
    account_status: string
    @Column({ nullable: false })
    device_token: string
    @Column({ nullable: false })
    roles: string
    @Column({ nullable: false, type:'bigint' })
    user_created_at: BigInt
    @Column({ nullable: false })
    reg_via: string
    
}