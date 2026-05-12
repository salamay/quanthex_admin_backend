import { ProfileEntity } from "../entities/profile_entity"

export class ProfileMapper{


    static toEntity(row:any):ProfileEntity{
        const entity=new ProfileEntity()
        entity.uid=row['uid']
        entity.email=row['email']
        entity.account_status=row['account_status']
        entity.roles=row['roles']
        entity.pin=row['pin']
        entity.referral_code=row['referral_code']
        entity.profile_created_at=row['profile_created_at']
        entity.profile_updated_at=row['profile_updated_at']
        return entity
    }
    
}