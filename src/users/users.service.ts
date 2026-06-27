import { Injectable, Logger, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ProfileEntity } from './entities/profile_entity';
import { UserEntity } from './entities/user_entity';
import { plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm/repository/Repository.js';

@Injectable()
export class UsersService {

    logger = new Logger(UsersService.name);

    constructor(
    @InjectRepository(UserEntity) public userRepository: Repository<UserEntity>,
        @InjectRepository(ProfileEntity) public profileRepository: Repository<ProfileEntity>) {

    }
    async getProfileByUid(uid: string): Promise<ProfileEntity> {
        const query = "SELECT * FROM profiles WHERE uid = ?";
        const result = await this.userRepository.query(query, [uid]);
        if (!result || result.length === 0) {
            throw new NotFoundException("User not found")
        }
        return plainToInstance(ProfileEntity, result[0]);

    }
    async getProfileByEmail(email: string): Promise<UserEntity> {
        const query = "SELECT * FROM users WHERE email = ?";
        const result = await this.userRepository.query(query, [email]);
        if (!result || result.length === 0) {
            throw new NotFoundException("User not found")
        }
        return plainToInstance(UserEntity, result[0]);
    }

    async checkEmailExists(email: string): Promise<boolean> {
        try {
            const query = "SELECT * FROM users WHERE email = ?";
            const result = await this.userRepository.query(query, [email]);
            return result.length > 0;
        } catch (err) {
            throw new UnprocessableEntityException('An error occurred while processing your request');
        }
    }

    async getAllUsers(offset: number = 0, limit: number = 20, search?: string): Promise<any> {
        let whereClause = '';
        const params: any[] = [];

        if (search && search.trim()) {
            whereClause = 'WHERE u.email LIKE ? OR p.referral_code LIKE ?';
            const searchPattern = `%${search.trim()}%`;
            params.push(searchPattern, searchPattern);
        }

        const countQuery = `
            SELECT COUNT(*) as total
            FROM users u
            LEFT JOIN profiles p ON u.uid = p.uid
            ${whereClause}
        `;
        const countResult = await this.userRepository.query(countQuery, params);
        const total = parseInt(countResult[0]?.total || '0');

        const dataQuery = `
            SELECT
                u.uid,
                u.email,
                u.account_status,
                u.roles,
                u.user_created_at,
                u.reg_via,
                p.referral_code,
                p.profile_created_at,
                p.profile_updated_at
            FROM users u
            LEFT JOIN profiles p ON u.uid = p.uid
            ${whereClause}
            ORDER BY u.user_created_at ASC
            LIMIT ? OFFSET ?
        `;
        const dataParams = [...params, limit, offset];
        const users = await this.userRepository.query(dataQuery, dataParams);

        return { data: users, total };
    }

    async getUserDetail(uid: string): Promise<any> {
        const query = `
            SELECT
                u.uid,
                u.email,
                u.account_status,
                u.roles,
                u.user_created_at,
                u.reg_via,
                p.referral_code,
                p.profile_created_at,
                p.profile_updated_at
            FROM users u
            LEFT JOIN profiles p ON u.uid = p.uid
            WHERE u.uid = ?
        `;
        const result = await this.userRepository.query(query, [uid]);
        if (!result || result.length === 0) {
            throw new NotFoundException('User not found');
        }
        return result[0];
    }

    async getUserReferrals(uid: string, offset: number = 0, limit: number = 20): Promise<any> {
        const countQuery = `
            SELECT COUNT(*) as total
            FROM referrals
            WHERE referral_uid = ?
        `;
        const countResult = await this.userRepository.query(countQuery, [uid]);
        const total = parseInt(countResult[0]?.total || '0');

        const dataQuery = `
            SELECT
                r.referral_id,
                r.referral_uid,
                r.referree_uid,
                r.referral_subscription_id,
                r.referree_subscription_id,
                r.referral_created_at,
                r.depth,
                p.email as referree_email,
                p.referral_code as referree_referral_code,
                s.sub_package_name
            FROM referrals r
            LEFT JOIN profiles p ON r.referree_uid = p.uid
            LEFT JOIN subscriptions s ON r.referral_subscription_id = s.sub_id
            WHERE r.referral_uid = ?
            ORDER BY r.referral_created_at ASC
            LIMIT ? OFFSET ?
        `;
        const referrals = await this.userRepository.query(dataQuery, [uid, limit, offset]);

        return { data: referrals, total };
    }

    async getUserSubscriptions(uid: string, offset: number = 0, limit: number = 20): Promise<any> {
        const countQuery = `SELECT COUNT(*) as total FROM subscriptions WHERE uid = ?`;
        const countResult = await this.userRepository.query(countQuery, [uid]);
        const total = parseInt(countResult[0]?.total || '0');

        const dataQuery = `
            SELECT
                s.sub_id, s.uid, s.email, s.sub_type, s.sub_chain_id,
                s.sub_asset_contract, s.sub_asset_symbol, s.sub_asset_name,
                s.sub_asset_decimals, s.sub_asset_image, s.sub_created_at,
                s.sub_updated_at, s.sub_status, s.sub_reward_contract,
                s.sub_reward_chain_id, s.sub_reward_asset_name,
                s.sub_reward_asset_symbol, s.sub_reward_asset_image,
                s.sub_reward_asset_decimals, s.sub_package_name, s.sub_duration,
                s.sub_price, s.sub_referral_code, s.sub_mining_tag,
                s.sub_wallet_hash, s.sub_wallet_address
            FROM subscriptions s
            WHERE s.uid = ?
            ORDER BY s.sub_created_at DESC
            LIMIT ? OFFSET ?
        `;
        const subscriptions = await this.userRepository.query(dataQuery, [uid, limit, offset]);

        return { data: subscriptions, total };
    }

    async refferalCodeUser(referralCode: string): Promise<ProfileEntity> {
        this.logger.debug("getting user this referral belongs to ", referralCode)
        const query = "SELECT * from profiles WHERE referral_code=?"
        try {
            const results: [] = await this.profileRepository.query(query, [referralCode])
            if (results.length === 0) {
                this.logger.debug("Could not find user that this referral code belongs to")
                throw new NotFoundException("User not found")
            }
            return results.at(0) as ProfileEntity
        } catch (err) {
            throw new UnprocessableEntityException('An error occurred while processing your request');
        }
    }
}
