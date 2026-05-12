import { ProfileEntity } from "../entities/profile_entity";
import { ReferralEntity } from "../entities/referral_entity";

export class ReferralDto{
    info :ReferralEntity
    profile : ProfileEntity
}