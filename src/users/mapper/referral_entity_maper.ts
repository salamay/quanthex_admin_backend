import { ReferralEntity } from "src/users/entities/referral_entity"

export class ReferralEntityMapper {


    static toEntity(data: any): ReferralEntity {
        const referral = new ReferralEntity();

        referral.referral_id = data.referral_id;
        referral.referral_uid = data.referral_uid;
        referral.referree_uid = data.referree_uid;
        referral.referral_created_at = data.referral_created_at;
        referral.referral_updated_at = data.referral_updated_at;
        referral.referral_descendant_uid = data.referral_descendant_uid;
        referral.depth = data.depth;
        referral.referral_path = data.referral_path;
        return referral;
    }

}