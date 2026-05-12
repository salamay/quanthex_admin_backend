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
