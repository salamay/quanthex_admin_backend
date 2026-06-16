import { Injectable, InternalServerErrorException, BadRequestException, Logger, UnprocessableEntityException, NotFoundException } from '@nestjs/common';
import { ReferralDto } from 'src/users/dtos/referral_dto';
import { ReferralEntity } from 'src/users/entities/referral_entity';
import { ProfileMapper } from 'src/users/mapper/profile_mapper';
import { ReferralEntityMapper } from 'src/users/mapper/referral_entity_maper';
import { DataSource } from 'typeorm';
import { EarningCalculator } from './utils/earning_calculator';
import { SubmitPaymentDto } from './dtos/submit_payment_dto';
import { SubmitStakingPaymentDto } from './dtos/submit_staking_payment_dto';
import { SubmitUplinePaymentDto } from './dtos/submit_upline_payment_dto';
import { UpdateStakingSettingsDto } from './dtos/update_staking_settings_dto';
import { SubmitDailyRoiPaymentDto } from './dtos/submit_daily_roi_payment_dto';
import { JsonRpcProvider } from 'ethers';
import { NetworkUtils } from 'src/utils/network_utils';
import { stat } from 'fs';
import { hash } from 'crypto';

@Injectable()
export class ProductsService {
    private readonly logger = new Logger(ProductsService.name);

    constructor(private dataSource: DataSource) {}

    
    async getAllMinings(
        offset: number,
        limit: number,
        packageName?: string,
        startDate?: number,
        endDate?: number,
    ): Promise<{ data: any[]; total: number }> {
        this.logger.debug(`Fetching all minings with offset=${offset}, limit=${limit}, packageName=${packageName}, startDate=${startDate}, endDate=${endDate}`);
        try {
            const conditions: string[] = [];
            const params: any[] = [];

            if (packageName) {
                conditions.push('s.sub_package_name = ?');
                params.push(packageName);
            }
            if (startDate) {
                conditions.push('m.min_created_at >= ?');
                params.push(startDate);
            }
            if (endDate) {
                conditions.push('m.min_created_at <= ?');
                params.push(endDate);
            }

            const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

            const countQuery = `
                SELECT COUNT(*) as total FROM minings m
                LEFT JOIN subscriptions s ON s.sub_id = m.min_subscription_id
                ${whereClause}
            `;
            const countResult = await this.dataSource.query(countQuery, [...params]);
            const total = parseInt(countResult[0].total, 10);

            const query = `
                SELECT s.*, m.min_id, m.uid as m_uid, m.email as m_email,
                       m.min_created_at, m.min_updated_at, m.min_subscription_id,
                       m.mining_tag, m.mining_wallet_hash, m.mining_wallet_address,
                       p.referral_code
                FROM minings m
                LEFT JOIN subscriptions s ON s.sub_id = m.min_subscription_id
                LEFT JOIN profiles p ON p.uid = m.uid
                ${whereClause}
                ORDER BY m.min_created_at DESC
                LIMIT ? OFFSET ?
            `;
            const results = await this.dataSource.query(query, [...params, limit, offset]);

            // Collect unique uid+subId pairs from results
            const uids: string[] = [];
            const subIds: string[] = [];
            const seen = new Set<string>();
            for (const row of results) {
                const key = `${row.m_uid}::${row.sub_id}`;
                if (!seen.has(key) && row.m_uid && row.sub_id) {
                    seen.add(key);
                    uids.push(row.m_uid);
                    subIds.push(row.sub_id);
                }
            }

            // Batch fetch referral counts using reusable methods
            const directCountMap = await this.getMiningDirectReferralCounts(uids, subIds);
            const indirectCountMap = await this.getMiningIndirectReferralCounts(uids, subIds);

            // Batch fetch payment counts for all minings in this page
            const minIds = results.map((row: any) => row.min_id).filter(Boolean);
            const paymentCountMap = await this.getBatchPaymentCounts(minIds);

            const makeKey = (uid: string, subId: string) => `${uid}::${subId}`;
            const data = results.map((row: any) => {
                const key = makeKey(row.m_uid, row.sub_id);
                const pkg = row.sub_package_name || '';
                const directCount = directCountMap.get(key) || 0;
                const indirectCount = indirectCountMap.get(key) || 0;
                const earnings = EarningCalculator.calcTotalEarning(pkg, directCount, indirectCount);

                // Per-referral eligibility: eligible if referrals > payments
                const totalPayments = paymentCountMap.get(row.min_id) || 0;
                const isEligible = directCount > totalPayments;

                return {
                    mining: {
                        min_id: row.min_id,
                        uid: row.m_uid,
                        email: row.m_email,
                        min_created_at: row.min_created_at,
                        min_updated_at: row.min_updated_at,
                        min_subscription_id: row.min_subscription_id,
                        mining_tag: row.mining_tag,
                        mining_wallet_hash: row.mining_wallet_hash,
                        mining_wallet_address: row.mining_wallet_address,
                    },
                    subscription: {
                        sub_id: row.sub_id,
                        uid: row.uid,
                        email: row.email,
                        sub_type: row.sub_type,
                        sub_chain_id: row.sub_chain_id,
                        sub_asset_contract: row.sub_asset_contract,
                        sub_asset_symbol: row.sub_asset_symbol,
                        sub_asset_name: row.sub_asset_name,
                        sub_asset_decimals: row.sub_asset_decimals,
                        sub_asset_image: row.sub_asset_image,
                        sub_created_at: row.sub_created_at,
                        sub_updated_at: row.sub_updated_at,
                        sub_status: row.sub_status,
                        sub_reward_contract: row.sub_reward_contract,
                        sub_reward_chain_id: row.sub_reward_chain_id,
                        sub_reward_asset_name: row.sub_reward_asset_name,
                        sub_reward_asset_symbol: row.sub_reward_asset_symbol,
                        sub_reward_asset_image: row.sub_reward_asset_image,
                        sub_reward_asset_decimals: row.sub_reward_asset_decimals,
                        sub_package_name: row.sub_package_name,
                        sub_duration: row.sub_duration,
                        sub_price: row.sub_price,
                        sub_referral_code: row.sub_referral_code,
                        sub_mining_tag: row.sub_mining_tag,
                        sub_wallet_hash: row.sub_wallet_hash,
                        sub_wallet_address: row.sub_wallet_address,
                    },
                    referral_code: row.referral_code,
                    direct_referral_count: directCount,
                    indirect_referral_count: indirectCount,
                    earnings,
                    payment_status: {
                        total_payments: totalPayments,
                        next_payment_number: isEligible ? totalPayments + 1 : null,
                        is_eligible_for_payment: isEligible,
                    },
                };
            });

            // Get distinct package names for filter dropdown
            const packageNames = await this.getDistinctPackageNames();

            return { data, total, packageNames } as any;
        } catch (err) {
            this.logger.error('Error fetching all minings:', err);
            throw new InternalServerErrorException('Failed to fetch minings');
        }
    }

    async getDistinctPackageNames(): Promise<string[]> {
        try {
            const query = `SELECT DISTINCT s.sub_package_name FROM subscriptions s WHERE s.sub_package_name IS NOT NULL ORDER BY s.sub_package_name ASC`;
            const results = await this.dataSource.query(query);
            return results.map((row: any) => row.sub_package_name);
        } catch (err) {
            this.logger.error('Error fetching distinct package names:', err);
            return [];
        }
    }

    /**
     * Batch fetch direct referral counts for multiple uid+subId pairs.
     * Returns a Map<"uid::subId", count>.
     */
    // Example input: uids = ["u1", "u2"], subIds = ["s1", "s2"]
    // Means
    //(u1, s1)
    // (u2, s2)
    async getMiningDirectReferralCounts(uids: string[], subIds: string[]): Promise<Map<string, number>> {
        const makeKey = (uid: string, subId: string) => `${uid}::${subId}`;
        const countMap = new Map<string, number>();
        if (uids.length === 0) return countMap;
  
        const placeholders = uids.map(() => `(?, ?)`).join(', ');
        // Suppose uids = ["u1", "u2", "u3"]
        // This creates: (?, ?), (?, ?), (?, ?)
        // These placeholders are used in SQL prepared statements.
        const params: string[] = [];
        for (let i = 0; i < uids.length; i++) {
            params.push(uids[i], subIds[i]);
        }

        const query = `
            SELECT referral_uid, referral_subscription_id, COUNT(*) as cnt
            FROM referrals
            WHERE (referral_uid, referral_subscription_id) IN (${placeholders})
            GROUP BY referral_uid, referral_subscription_id
        `;
        const results = await this.dataSource.query(query, params);
        for (const row of results) {
            countMap.set(
                makeKey(row.referral_uid, row.referral_subscription_id),
                parseInt(row.cnt, 10),
            );
        }
        return countMap;
    }

    /**
     * Batch fetch indirect referral counts for multiple uid+subId pairs.
     * Returns a Map<"uid::subId", count>.
     */
    async getMiningIndirectReferralCounts(uids: string[], subIds: string[]): Promise<Map<string, number>> {
        const makeKey = (uid: string, subId: string) => `${uid}::${subId}`;
        const countMap = new Map<string, number>();
        if (uids.length === 0) return countMap;

        const conditions = subIds.map(() => `(JSON_CONTAINS(r.referral_path, ?) AND r.referral_uid != ?)`).join(' OR ');
        const params: string[] = [];
        for (let i = 0; i < uids.length; i++) {
            params.push(JSON.stringify([subIds[i]]), uids[i]);
        }

        const query = `
            SELECT r.referral_uid, r.referral_path
            FROM referrals r
            WHERE ${conditions}
        `;
        const results = await this.dataSource.query(query, params);

        for (const ir of results) {
            const path = typeof ir.referral_path === 'string' ? JSON.parse(ir.referral_path) : ir.referral_path;
            if (!Array.isArray(path)) continue;
            for (let i = 0; i < uids.length; i++) {
                if (path.includes(subIds[i]) && ir.referral_uid !== uids[i]) {
                    const key = makeKey(uids[i], subIds[i]);
                    countMap.set(key, (countMap.get(key) || 0) + 1);
                }
            }
        }
        return countMap;
    }

    /**
     * Get detailed direct referrals for a single user + subscription (used by controller detail endpoint).
     */
    async getMiningDirectReferrals(uid: string, subscriptionId: string): Promise<ReferralDto[]> {
        this.logger.debug(`Getting direct referrals for user ${uid}, subscription ${subscriptionId}`)
        const referrals: ReferralDto[] = []
        const query = `SELECT * FROM referrals r
                       LEFT JOIN profiles p ON r.referree_uid = p.uid
                       WHERE r.referral_uid = ? AND r.referral_subscription_id = ?`;
        const referralRepository = this.dataSource.manager.getRepository(ReferralEntity)
        const results: [] = await referralRepository.query(query, [uid, subscriptionId])
        this.logger.debug(`Found ${results.length} direct referrals for user ${uid}`)
        for (const row of results) {
            const referralDto = new ReferralDto()
            const referralEntity = ReferralEntityMapper.toEntity(row);
            const referreeEntity = ProfileMapper.toEntity(row);
            referralDto.info = referralEntity
            referralDto.profile = referreeEntity
            referrals.push(referralDto)
        }
        return referrals;
    }

    /**
     * Get detailed indirect referrals for a single user + subscription (used by controller detail endpoint).
     */
    async getMiningIndirectReferrals(uid: string, subscriptionId: string): Promise<ReferralDto[]> {
        this.logger.debug(`Getting indirect referrals for user ${uid}, subscription ${subscriptionId}`)
        const referrals: ReferralDto[] = []
        const query = `SELECT * FROM referrals r
                       LEFT JOIN profiles p ON r.referree_uid = p.uid
                       WHERE JSON_CONTAINS(r.referral_path, ?) AND r.referral_uid != ?`;
        const referralRepository = this.dataSource.manager.getRepository(ReferralEntity)
        const results: [] = await referralRepository.query(query, [JSON.stringify([subscriptionId]), uid])
        this.logger.debug(`Found ${results.length} indirect referrals for user ${uid}`)
        for (const row of results) {
            const referralDto = new ReferralDto()
            const referralEntity = ReferralEntityMapper.toEntity(row);
            const referreeEntity = ProfileMapper.toEntity(row);
            referralDto.info = referralEntity
            referralDto.profile = referreeEntity
            referrals.push(referralDto)
        }
        return referrals;
    }

    // ──────────────────────────────────────────────
    // Per-referral payment system: 1 referral = 1 payment eligibility
    // ──────────────────────────────────────────────

    /**
     * Get payment status for a mining.
     * A user is eligible for payment when their direct referral count
     * exceeds their total confirmed payments.
     */
    async getPaymentStatus(minId: string, uid: string, subscriptionId: string, directReferralCount: number): Promise<{
        totalPayments: number;
        nextPaymentNumber: number | null;
        isEligibleForPayment: boolean;
    }> {
        // Count confirmed non-manual payments for this mining
        const result = await this.dataSource.query(
            `SELECT COUNT(*) as cnt FROM mining_payments WHERE mp_min_id = ? AND mp_status = 'confirmed' AND mp_is_manual = 0`,
            [minId],
        );
        const totalPayments = parseInt(result[0]?.cnt || '0', 10);

        // Eligible if referrals > payments made
        const isEligible = directReferralCount > totalPayments;
        const nextPaymentNumber = isEligible ? totalPayments + 1 : null;

        return {
            totalPayments,
            nextPaymentNumber,
            isEligibleForPayment: isEligible,
        };
    }

    /**
     * Submit a payment for a mining after the admin sends the transaction on-chain.
     */
    async submitPayment(dto: SubmitPaymentDto): Promise<any> {
        this.logger.debug(`Submitting payment for mining ${dto.min_id} with amount ${dto.amount} `);
        const rpc = NetworkUtils.getRpc(dto.chain_id)
        const res: { status: boolean; hash: string | null } = await this.submitTransaction(dto.tx_data, rpc)
        if (!res.status) {
            throw new UnprocessableEntityException('Transaction submission failed');
        }
        const txHash = res.hash;
        return await this.dataSource.transaction(async manager => {
            // 1. Look up the mining record
            const miningRows = await this.dataSource.query(
                `SELECT m.*, s.sub_id, s.sub_package_name, s.sub_reward_asset_symbol
             FROM minings m
             LEFT JOIN subscriptions s ON s.sub_id = m.min_subscription_id
             WHERE m.min_id = ?`,
                [dto.min_id],
            );

            if (!miningRows || miningRows.length === 0) {
                throw new BadRequestException('Mining record not found');
            }

            const mining = miningRows[0];

            // 2. Get direct referral count for this mining
            const directCountMap = await this.getMiningDirectReferralCounts(
                [mining.uid],
                [mining.sub_id],
            );
            const directCount = directCountMap.get(`${mining.uid}::${mining.sub_id}`) || 0;

            // 3. Determine payment status (per-referral: eligible if referrals > payments)
            const paymentStatus = await this.getPaymentStatus(
                dto.min_id,
                mining.uid,
                mining.sub_id,
                directCount,
            );

            if (!paymentStatus.isEligibleForPayment || paymentStatus.nextPaymentNumber === null) {
                throw new BadRequestException(
                    `Mining is not eligible for payment. Direct referrals: ${directCount}, total payments: ${paymentStatus.totalPayments}`,
                );
            }

            // 4. Insert payment record (mp_payment_tier stores sequential payment number)
            const now = BigInt(Date.now());
            await this.dataSource.query(
                `INSERT INTO mining_payments (mp_id, mp_min_id, mp_uid, mp_subscription_id, mp_tx_hash, mp_tx_data, mp_amount, mp_chain_id, mp_reward_symbol, mp_payment_tier, mp_referral_count_at_payment, mp_status, mp_created_at, mp_updated_at)
             VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmed', ?, ?)`,
                [
                    dto.min_id,
                    mining.uid,
                    mining.sub_id,
                    txHash || null,
                    dto.tx_data || null,
                    dto.amount,
                    dto.chain_id,
                    dto.reward_symbol || mining.sub_reward_asset_symbol || '',
                    paymentStatus.nextPaymentNumber,
                    directCount,
                    now.toString(),
                    now.toString(),
                ],
            );

            this.logger.log(`Payment #${paymentStatus.nextPaymentNumber} recorded for mining ${dto.min_id}`);

            // 5. Recalculate status after this payment
            const updatedStatus = await this.getPaymentStatus(
                dto.min_id,
                mining.uid,
                mining.sub_id,
                directCount,
            );

            return {
                payment_number: paymentStatus.nextPaymentNumber,
                referral_count: directCount,
                total_payments: updatedStatus.totalPayments,
                is_eligible_for_next: updatedStatus.isEligibleForPayment,
                next_payment_number: updatedStatus.nextPaymentNumber,
            };
        });
    }

    /**
     * Submit a manual payment for a mining (no eligibility check).
     * Admin can send any amount of DOGE to the user.
     */
    async submitManualPayment(dto: SubmitPaymentDto): Promise<any> {
        this.logger.debug(`Submitting manual payment for mining ${dto.min_id} with amount ${dto.amount}`);
        const rpc = NetworkUtils.getRpc(dto.chain_id);
        const res: { status: boolean; hash: string | null } = await this.submitTransaction(dto.tx_data, rpc);
        if (!res.status) {
            throw new UnprocessableEntityException('Transaction submission failed');
        }
        const txHash = res.hash;

        // Look up the mining record
        const miningRows = await this.dataSource.query(
            `SELECT m.*, s.sub_id, s.sub_package_name, s.sub_reward_asset_symbol
             FROM minings m
             LEFT JOIN subscriptions s ON s.sub_id = m.min_subscription_id
             WHERE m.min_id = ?`,
            [dto.min_id],
        );

        if (!miningRows || miningRows.length === 0) {
            throw new BadRequestException('Mining record not found');
        }

        const mining = miningRows[0];

        // Get current referral count (for record-keeping)
        const directCountMap = await this.getMiningDirectReferralCounts(
            [mining.uid],
            [mining.sub_id],
        );
        const directCount = directCountMap.get(`${mining.uid}::${mining.sub_id}`) || 0;

        // Count total manual payments for numbering
        const manualCountResult = await this.dataSource.query(
            `SELECT COUNT(*) as cnt FROM mining_payments WHERE mp_min_id = ? AND mp_is_manual = 1`,
            [dto.min_id],
        );
        const manualPaymentNumber = parseInt(manualCountResult[0]?.cnt || '0', 10) + 1;

        // Insert manual payment record
        const now = BigInt(Date.now());
        await this.dataSource.query(
            `INSERT INTO mining_payments (mp_id, mp_min_id, mp_uid, mp_subscription_id, mp_tx_hash, mp_tx_data, mp_amount, mp_chain_id, mp_reward_symbol, mp_payment_tier, mp_referral_count_at_payment, mp_is_manual, mp_status, mp_created_at, mp_updated_at)
             VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'confirmed', ?, ?)`,
            [
                dto.min_id,
                mining.uid,
                mining.sub_id,
                txHash || null,
                dto.tx_data || null,
                dto.amount,
                dto.chain_id,
                dto.reward_symbol || mining.sub_reward_asset_symbol || '',
                manualPaymentNumber,
                directCount,
                now.toString(),
                now.toString(),
            ],
        );

        this.logger.log(`Manual payment #${manualPaymentNumber} recorded for mining ${dto.min_id}`);

        return {
            manual_payment_number: manualPaymentNumber,
            amount: dto.amount,
            tx_hash: txHash,
        };
    }

    /**
     * Batch fetch confirmed payment counts for multiple mining IDs.
     * Returns a Map<min_id, number> of confirmed payment counts.
     */
    async getBatchPaymentCounts(minIds: string[]): Promise<Map<string, number>> {
        const countMap = new Map<string, number>();
        if (minIds.length === 0) return countMap;

        const placeholders = minIds.map(() => '?').join(', ');
        const results = await this.dataSource.query(
            `SELECT mp_min_id, COUNT(*) as cnt FROM mining_payments WHERE mp_min_id IN (${placeholders}) AND mp_status = 'confirmed' AND mp_is_manual = 0 GROUP BY mp_min_id`,
            minIds,
        );

        for (const r of results) {
            countMap.set(r.mp_min_id, parseInt(r.cnt, 10));
        }

        return countMap;
    }

    // ──────────────────────────────────────────────
    // STAKING SECTION
    // ──────────────────────────────────────────────

    /**
     * Get all stakings with referral counts and payment status, paginated.
     */
    async getAllStakings(
        offset: number,
        limit: number,
        planName?: string,
        status?: string,
        startDate?: number,
        endDate?: number,
    ): Promise<{ data: any[]; total: number; planNames: string[] }> {
        this.logger.debug(`Fetching all stakings offset=${offset}, limit=${limit}`);
        try {
            const conditions: string[] = [];
            const params: any[] = [];

            if (planName) {
                conditions.push('st.staking_plan = ?');
                params.push(planName);
            }
            if (status) {
                conditions.push('st.staking_status = ?');
                params.push(status);
            }
            if (startDate) {
                conditions.push('st.stake_created_at >= ?');
                params.push(startDate);
            }
            if (endDate) {
                conditions.push('st.stake_created_at <= ?');
                params.push(endDate);
            }

            const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

            // Count
            const countResult = await this.dataSource.query(
                `SELECT COUNT(*) as total FROM stakings st ${whereClause}`,
                [...params],
            );
            const total = parseInt(countResult[0].total, 10);
            // Main query
            const query = `
                SELECT st.*
                FROM stakings st
                ${whereClause}
                ORDER BY st.stake_created_at DESC
                LIMIT ? OFFSET ?
            `;
            const results = await this.dataSource.query(query, [...params, limit, offset]);

            // Batch referral counts for all stakings
            const stakingIds = results.map((r: any) => r.staking_id).filter(Boolean);
            const referralCountMap = await this.getStakingReferralCounts(stakingIds);

            // Batch payment status
            const paidCyclesMap = await this.getBatchStakingPaymentStatus(stakingIds);

            // Get staking settings for payment amount lookup
            const settingsMap = await this.getStakingSettingsMap();

            const data = results.map((row: any) => {
                const referralCount = referralCountMap.get(row.staking_id) || 0;
                const paidCycles = paidCyclesMap.get(row.staking_id) || [];
                const settings = settingsMap.get(row.staking_plan);
                const referralsPerCycle = settings?.ss_referrals_per_cycle || 6;

                // How many complete cycles of 6 referrals
                const completedCycles = Math.floor(referralCount / referralsPerCycle);
                // Max paid cycle number
                const maxPaidCycle = paidCycles.length > 0 ? Math.max(...paidCycles) : 0;
                // Next payable cycle
                const nextCycle = maxPaidCycle + 1;

                // Check staking duration hasn't expired
                const now = Date.now();
                const endDate = typeof row.end_date === 'string' ? parseInt(row.end_date, 10) : Number(row.end_date);
                const isExpired = endDate > 0 && now > endDate;

                const isEligible = !isExpired && completedCycles >= nextCycle;

                // Compute actual double payment: plan_amount * 2 * (percentage / 100)
                const rewardPercentage = settings?.ss_reward_percentage ?? 100;
                const planAmount = settings?.ss_plan_amount ?? 0;
                const computedDoublePayment = planAmount * 2 * (rewardPercentage / 100);

                return {
                    staking: {
                        staking_id: row.staking_id,
                        uid: row.uid,
                        email: row.email,
                        stake_created_at: row.stake_created_at,
                        stake_updated_at: row.stake_updated_at,
                        staked_asset_symbol: row.staked_asset_symbol,
                        staked_asset_contract: row.staked_asset_contract,
                        staked_asset_name: row.staked_asset_name,
                        staked_asset_image: row.staked_asset_image,
                        staked_amount_fiat: row.staked_amount_fiat,
                        staked_amount_crypto: row.staked_amount_crypto,
                        staking_status: row.staking_status,
                        staking_reward_contract: row.staking_reward_contract,
                        staking_reward_chain_id: row.staking_reward_chain_id,
                        staking_reward_chain_name: row.staking_reward_chain_name,
                        staking_reward_asset_name: row.staking_reward_asset_name,
                        staking_reward_asset_symbol: row.staking_reward_asset_symbol,
                        staking_reward_asset_decimals: row.staking_reward_asset_decimals,
                        staking_reward_asset_image: row.staking_reward_asset_image,
                        duration: row.duration,
                        end_date: row.end_date,
                        start_date: row.start_date,
                        staking_wallet_hash: row.staking_wallet_hash,
                        staking_wallet_address: row.staking_wallet_address,
                        staking_referral_code: row.staking_referral_code,
                        staking_plan: row.staking_plan,
                    },
                    referral_count: referralCount,
                    payment_status: {
                        paid_cycles: paidCycles,
                        next_cycle: nextCycle,
                        completed_referral_cycles: completedCycles,
                        is_eligible_for_payment: isEligible,
                        is_expired: isExpired,
                        reward_percentage: rewardPercentage,
                        double_payment_amount: computedDoublePayment,
                    },
                };
            });

            // Distinct plan names for filter
            const planNamesResult = await this.dataSource.query(
                `SELECT DISTINCT staking_plan FROM stakings WHERE staking_plan IS NOT NULL ORDER BY staking_plan ASC`,
            );
            const planNames = planNamesResult.map((r: any) => r.staking_plan);

            return { data, total, planNames };
        } catch (err) {
            this.logger.error('Error fetching stakings:', err);
            throw new InternalServerErrorException('Failed to fetch stakings');
        }
    }

    /**
     * Batch fetch referral counts for staking IDs.
     * Counts how many referrees each staking has (using staking_referral_staking_id as the referrer's staking).
     */
    async getStakingReferralCounts(stakingIds: string[]): Promise<Map<string, number>> {
        const countMap = new Map<string, number>();
        if (stakingIds.length === 0) return countMap;

        const placeholders = stakingIds.map(() => '?').join(', ');
        const results = await this.dataSource.query(
            `SELECT staking_referral_staking_id, COUNT(*) as cnt
             FROM staking_referrals
             WHERE staking_referral_staking_id IN (${placeholders})
             GROUP BY staking_referral_staking_id`,
            stakingIds,
        );

        for (const row of results) {
            countMap.set(row.staking_referral_staking_id, parseInt(row.cnt, 10));
        }
        return countMap;
    }

    /**
     * Batch fetch paid payment cycles for staking IDs.
     */
    async getBatchStakingPaymentStatus(stakingIds: string[]): Promise<Map<string, number[]>> {
        const paidMap = new Map<string, number[]>();
        if (stakingIds.length === 0) return paidMap;

        const placeholders = stakingIds.map(() => '?').join(', ');
        const payments = await this.dataSource.query(
            `SELECT sp_staking_id, sp_payment_cycle FROM staking_payments WHERE sp_staking_id IN (${placeholders}) AND sp_status = 'confirmed'`,
            stakingIds,
        );

        for (const p of payments) {
            const list = paidMap.get(p.sp_staking_id) || [];
            list.push(p.sp_payment_cycle);
            paidMap.set(p.sp_staking_id, list);
        }
        return paidMap;
    }

    /**
     * Get staking settings as a map keyed by plan name.
     */
    async getStakingSettingsMap(): Promise<Map<string, any>> {
        const settingsMap = new Map<string, any>();
        const results = await this.dataSource.query(
            `SELECT * FROM staking_settings WHERE ss_is_active = 1`,
        );
        for (const row of results) {
            settingsMap.set(row.ss_plan_name, row);
        }
        return settingsMap;
    }

    /**
     * Get all staking settings (for admin settings page).
     */
    async getStakingSettings(): Promise<any[]> {
        return await this.dataSource.query(
            `SELECT * FROM staking_settings ORDER BY ss_plan_amount ASC`,
        );
    }

    /**
     * Update a staking setting.
     */
    async updateStakingSettings(dto: UpdateStakingSettingsDto): Promise<any> {
        const existing = await this.dataSource.query(
            `SELECT * FROM staking_settings WHERE ss_id = ?`,
            [dto.ss_id],
        );
        if (!existing || existing.length === 0) {
            throw new NotFoundException('Staking setting not found');
        }

        const updates: string[] = [];
        const params: any[] = [];

        if (dto.ss_reward_percentage !== undefined) {
            updates.push('ss_reward_percentage = ?');
            params.push(dto.ss_reward_percentage);
        }
        if (dto.ss_referrals_per_cycle !== undefined) {
            updates.push('ss_referrals_per_cycle = ?');
            params.push(dto.ss_referrals_per_cycle);
        }
        if (dto.ss_is_active !== undefined) {
            updates.push('ss_is_active = ?');
            params.push(dto.ss_is_active ? 1 : 0);
        }

        if (updates.length === 0) {
            return existing[0];
        }

        updates.push('ss_updated_at = ?');
        params.push(BigInt(Date.now()).toString());
        params.push(dto.ss_id);

        await this.dataSource.query(
            `UPDATE staking_settings SET ${updates.join(', ')} WHERE ss_id = ?`,
            params,
        );

        const updated = await this.dataSource.query(
            `SELECT * FROM staking_settings WHERE ss_id = ?`,
            [dto.ss_id],
        );
        return updated[0];
    }

    /**
     * Submit a staking double payment.
     */
    async submitStakingPayment(dto: SubmitStakingPaymentDto): Promise<any> {
        this.logger.debug(`Submitting staking payment for staking ${dto.staking_id}`);
        // 1. Look up the staking record
        const stakingRows = await this.dataSource.query(
            `SELECT * FROM stakings WHERE staking_id = ?`,
            [dto.staking_id],
        );
        if (!stakingRows || stakingRows.length === 0) {
            throw new BadRequestException('Staking record not found');
        }
        const staking = stakingRows[0];
        // 2. Check expiry
        const now = Date.now();
        const endDate = typeof staking.end_date === 'string' ? parseInt(staking.end_date, 10) : Number(staking.end_date);
        if (endDate > 0 && now > endDate) {
            throw new BadRequestException('Staking duration has expired');
        }
        const rpc = NetworkUtils.getRpc(dto.chain_id);
        const res = await this.submitTransaction(dto.tx_data, rpc);
        if (!res.status) {
            throw new UnprocessableEntityException('Transaction submission failed');
        }
        const txHash = res.hash;

        return await this.dataSource.transaction(async manager => {
        
            // 3. Get referral count
            const refCountMap = await this.getStakingReferralCounts([dto.staking_id]);
            const referralCount = refCountMap.get(dto.staking_id) || 0;

            // 4. Get paid cycles and settings
            const paidCyclesMap = await this.getBatchStakingPaymentStatus([dto.staking_id]);
            const paidCycles = paidCyclesMap.get(dto.staking_id) || [];
            const settingsMap = await this.getStakingSettingsMap();
            const settings = settingsMap.get(staking.staking_plan);
            const referralsPerCycle = settings?.ss_referrals_per_cycle || 6;

            const completedCycles = Math.floor(referralCount / referralsPerCycle);
            const maxPaidCycle = paidCycles.length > 0 ? Math.max(...paidCycles) : 0;
            const nextCycle = maxPaidCycle + 1;

            if (completedCycles < nextCycle) {
                throw new BadRequestException(
                    `Staking not eligible for payment. Referrals: ${referralCount}, completed cycles: ${completedCycles}, next payable cycle: ${nextCycle}`,
                );
            }

            // 5. Insert payment record
            const nowBig = BigInt(Date.now());
            await this.dataSource.query(
                `INSERT INTO staking_payments (sp_id, sp_staking_id, sp_uid, sp_email, sp_staking_plan, sp_amount, sp_tx_data, sp_tx_hash, sp_chain_id, sp_reward_symbol, sp_payment_cycle, sp_referral_count_at_payment, sp_status, sp_created_at, sp_updated_at)
                 VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmed', ?, ?)`,
                [
                    dto.staking_id,
                    staking.uid,
                    staking.email,
                    staking.staking_plan,
                    dto.amount,
                    dto.tx_data || null,
                    txHash || null,
                    dto.chain_id,
                    dto.reward_symbol || staking.staking_reward_asset_symbol || '',
                    nextCycle,
                    referralCount,
                    nowBig.toString(),
                    nowBig.toString(),
                ],
            );

            this.logger.log(`Staking payment recorded for ${dto.staking_id} cycle ${nextCycle}`);

            // 6. Auto-create pending upline payment (10% of the double reward goes to the upline)
            try {
                // Find the upline via staking_referrals: the row where staking_referree_staking_id = current staking
                const uplineRows = await this.dataSource.query(
                    `SELECT sr.*, s.email as upline_email
                     FROM staking_referrals sr
                     LEFT JOIN stakings s ON s.staking_id = sr.staking_referral_staking_id
                     WHERE sr.staking_referree_staking_id = ?
                     LIMIT 1`,
                    [dto.staking_id],
                );

                if (uplineRows && uplineRows.length > 0) {
                    const uplineRow = uplineRows[0];
                    const uplineAmount = dto.amount * 0.10; // 10% of the double reward

                    // Get the sp_id of the payment we just inserted
                    const spRows = await this.dataSource.query(
                        `SELECT sp_id FROM staking_payments WHERE sp_staking_id = ? AND sp_payment_cycle = ? AND sp_status = 'confirmed' ORDER BY sp_created_at DESC LIMIT 1`,
                        [dto.staking_id, nextCycle],
                    );
                    const spId = spRows?.[0]?.sp_id || '';

                    await this.dataSource.query(
                        `INSERT INTO staking_upline_payments (sup_id, sup_staking_payment_id, sup_upline_uid, sup_upline_email, sup_upline_staking_id, sup_downline_uid, sup_downline_staking_id, sup_downline_staking_plan, sup_amount, sup_chain_id, sup_reward_symbol, sup_status, sup_created_at, sup_updated_at)
                         VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
                        [
                            spId,
                            uplineRow.staking_referral_uid,
                            uplineRow.upline_email || '',
                            uplineRow.staking_referral_staking_id,
                            staking.uid,
                            dto.staking_id,
                            staking.staking_plan,
                            uplineAmount,
                            dto.chain_id,
                            dto.reward_symbol || staking.staking_reward_asset_symbol || '',
                            nowBig.toString(),
                            nowBig.toString(),
                        ],
                    );
                    this.logger.log(`Pending upline payment created for upline ${uplineRow.staking_referral_uid}, amount: ${uplineAmount}`);
                }
            } catch (uplineErr) {
                // Don't fail the main payment if upline record creation fails
                this.logger.error('Failed to create upline payment record:', uplineErr);
            }

            // 7. Return updated status
            const updatedPaidCycles = [...paidCycles, nextCycle];
            const updatedMaxPaid = nextCycle;
            const updatedNextCycle = updatedMaxPaid + 1;
            const updatedIsEligible = completedCycles >= updatedNextCycle;

            const rewardPercentage = settings?.ss_reward_percentage ?? 100;
            const planAmount = settings?.ss_plan_amount ?? 0;
            const computedDoublePayment = planAmount * 2 * (rewardPercentage / 100);

            return {
                payment_cycle: nextCycle,
                referral_count: referralCount,
                next_cycle: updatedNextCycle,
                is_eligible_for_next: updatedIsEligible,
                paid_cycles: updatedPaidCycles,
                reward_percentage: rewardPercentage,
                double_payment_amount: computedDoublePayment,
            };
        });
    }

    // ──────────────────────────────────────────────
    // STAKING UPLINE PAYMENTS
    // ──────────────────────────────────────────────

    /**
     * Get all upline payments, paginated, with optional filters.
     */
    async getUplinePayments(
        offset: number,
        limit: number,
        status?: string,
        planName?: string,
    ): Promise<{ data: any[]; total: number }> {
        this.logger.debug(`Fetching upline payments offset=${offset}, limit=${limit}`);
        try {
            const conditions: string[] = [];
            const params: any[] = [];

            if (status) {
                conditions.push('sup.sup_status = ?');
                params.push(status);
            }
            if (planName) {
                conditions.push('sup.sup_downline_staking_plan = ?');
                params.push(planName);
            }

            const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

            const countResult = await this.dataSource.query(
                `SELECT COUNT(*) as total FROM staking_upline_payments sup ${whereClause}`,
                [...params],
            );
            const total = parseInt(countResult[0].total, 10);

            const query = `
                SELECT sup.*,
                       us.staking_wallet_address as upline_wallet_address,
                       us.staking_reward_chain_id as upline_reward_chain_id,
                       us.staking_reward_asset_symbol as upline_reward_asset_symbol,
                       us.staking_reward_asset_name as upline_reward_asset_name,
                       us.staking_reward_chain_name as upline_reward_chain_name,
                       us.staking_reward_asset_decimals as upline_reward_asset_decimals,
                       us.staking_reward_contract as upline_reward_contract,
                       us.staking_reward_asset_image as upline_reward_asset_image
                FROM staking_upline_payments sup
                LEFT JOIN stakings us ON us.staking_id = sup.sup_upline_staking_id
                ${whereClause}
                ORDER BY sup.sup_created_at DESC
                LIMIT ? OFFSET ?
            `;
            const results = await this.dataSource.query(query, [...params, limit, offset]);

            return { data: results, total };
        } catch (err) {
            this.logger.error('Error fetching upline payments:', err);
            throw new InternalServerErrorException('Failed to fetch upline payments');
        }
    }

    /**
     * Submit an upline payment (admin pays the upline their 10%).
     */
    async submitUplinePayment(dto: SubmitUplinePaymentDto): Promise<any> {
        this.logger.debug(`Submitting upline payment for sup_id=${dto.sup_id}`);

        // 1. Look up the pending upline payment record
        const supRows = await this.dataSource.query(
            `SELECT sup.*, us.staking_wallet_address as upline_wallet_address
             FROM staking_upline_payments sup
             LEFT JOIN stakings us ON us.staking_id = sup.sup_upline_staking_id
             WHERE sup.sup_id = ?`,
            [dto.sup_id],
        );

        if (!supRows || supRows.length === 0) {
            throw new NotFoundException('Upline payment record not found');
        }

        const supRecord = supRows[0];

        if (supRecord.sup_status === 'confirmed') {
            throw new BadRequestException('This upline payment has already been confirmed');
        }

        // 2. Submit on-chain
        const rpc = NetworkUtils.getRpc(dto.chain_id);
        const res = await this.submitTransaction(dto.tx_data, rpc);
        if (!res.status) {
            throw new UnprocessableEntityException('Transaction submission failed');
        }
        const txHash = res.hash;

        // 3. Update the record to confirmed
        const now = BigInt(Date.now());
        await this.dataSource.query(
            `UPDATE staking_upline_payments
             SET sup_status = 'confirmed', sup_tx_data = ?, sup_tx_hash = ?, sup_chain_id = ?, sup_updated_at = ?
             WHERE sup_id = ?`,
            [
                dto.tx_data || null,
                txHash || null,
                dto.chain_id,
                now.toString(),
                dto.sup_id,
            ],
        );

        this.logger.log(`Upline payment confirmed for sup_id=${dto.sup_id}`);

        // 4. Return updated record
        const updated = await this.dataSource.query(
            `SELECT * FROM staking_upline_payments WHERE sup_id = ?`,
            [dto.sup_id],
        );
        return updated[0];
    }

    // ──────────────────────────────────────────────
    // TRANSACTION LISTS
    // ──────────────────────────────────────────────

    /**
     * Get paginated mining payment transactions with filters.
     * JOINs to minings + subscriptions for user email, package name, wallet info.
     */
    async getMiningPayments(
        offset: number,
        limit: number,
        status?: string,
        packageName?: string,
        email?: string,
        startDate?: number,
        endDate?: number,
        minId?: string,
    ): Promise<{ data: any[]; total: number }> {
        this.logger.debug(`Fetching mining payments offset=${offset}, limit=${limit}`);
        try {
            const conditions: string[] = [];
            const params: any[] = [];

            if (minId) {
                conditions.push('mp.mp_min_id = ?');
                params.push('c2ca10c9-1d07-4874-befd-a183f29d956d');
            }
            if (status) {
                conditions.push('mp.mp_status = ?');
                params.push(status);
            }
            if (packageName) {
                conditions.push('s.sub_package_name = ?');
                params.push(packageName);
            }
            if (email) {
                conditions.push('m.email LIKE ?');
                params.push(`%${email}%`);
            }
            if (startDate) {
                conditions.push('mp.mp_created_at >= ?');
                params.push(startDate);
            }
            if (endDate) {
                conditions.push('mp.mp_created_at <= ?');
                params.push(endDate);
            }

            const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

            const countResult = await this.dataSource.query(
                `SELECT COUNT(*) as total FROM mining_payments mp
                 LEFT JOIN minings m ON m.min_id = mp.mp_min_id
                 LEFT JOIN subscriptions s ON s.sub_id = mp.mp_subscription_id
                 ${whereClause}`,
                [...params],
            );
            const total = parseInt(countResult[0].total, 10);

            const query = `
                SELECT mp.*,
                       m.email as user_email,
                       m.mining_wallet_address,
                       m.mining_tag,
                       s.sub_package_name,
                       s.sub_reward_asset_symbol,
                       s.sub_reward_asset_name,
                       s.sub_reward_chain_id,
                       s.sub_reward_contract,
                       s.sub_asset_symbol,
                       s.sub_price
                FROM mining_payments mp
                LEFT JOIN minings m ON m.min_id = mp.mp_min_id
                LEFT JOIN subscriptions s ON s.sub_id = mp.mp_subscription_id
                ${whereClause}
                ORDER BY mp.mp_created_at DESC
                LIMIT ? OFFSET ?
            `;
            const results = await this.dataSource.query(query, [...params, limit, offset]);

            return { data: results, total };
        } catch (err) {
            this.logger.error('Error fetching mining payments:', err);
            throw new InternalServerErrorException('Failed to fetch mining payments');
        }
    }

    /**
     * Get paginated staking payment transactions with filters.
     * staking_payments already has sp_email and sp_staking_plan denormalized.
     * JOINs to stakings for wallet and reward asset info.
     */
    async getStakingPayments(
        offset: number,
        limit: number,
        status?: string,
        planName?: string,
        email?: string,
        startDate?: number,
        endDate?: number,
    ): Promise<{ data: any[]; total: number }> {
        this.logger.debug(`Fetching staking payments offset=${offset}, limit=${limit}`);
        try {
            const conditions: string[] = [];
            const params: any[] = [];

            if (status) {
                conditions.push('sp.sp_status = ?');
                params.push(status);
            }
            if (planName) {
                conditions.push('sp.sp_staking_plan = ?');
                params.push(planName);
            }
            if (email) {
                conditions.push('sp.sp_email LIKE ?');
                params.push(`%${email}%`);
            }
            if (startDate) {
                conditions.push('sp.sp_created_at >= ?');
                params.push(startDate);
            }
            if (endDate) {
                conditions.push('sp.sp_created_at <= ?');
                params.push(endDate);
            }

            const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

            const countResult = await this.dataSource.query(
                `SELECT COUNT(*) as total FROM staking_payments sp ${whereClause}`,
                [...params],
            );
            const total = parseInt(countResult[0].total, 10);

            const query = `
                SELECT sp.*,
                       st.staking_wallet_address,
                       st.staking_reward_asset_symbol,
                       st.staking_reward_asset_name,
                       st.staking_reward_chain_id,
                       st.staking_reward_chain_name,
                       st.staking_reward_contract,
                       st.staked_amount_fiat,
                       st.staked_asset_symbol
                FROM staking_payments sp
                LEFT JOIN stakings st ON st.staking_id = sp.sp_staking_id
                ${whereClause}
                ORDER BY sp.sp_created_at DESC
                LIMIT ? OFFSET ?
            `;
            const results = await this.dataSource.query(query, [...params, limit, offset]);

            return { data: results, total };
        } catch (err) {
            this.logger.error('Error fetching staking payments:', err);
            throw new InternalServerErrorException('Failed to fetch staking payments');
        }
    }

    // ──────────────────────────────────────────────
    // DAILY ROI SETTINGS
    // ──────────────────────────────────────────────

    /**
     * Get the global daily ROI settings (single row).
     */
    async getDailyRoiSettings(): Promise<any> {
        const results = await this.dataSource.query(
            `SELECT * FROM daily_roi_settings LIMIT 1`,
        );
        if (!results || results.length === 0) {
            return null;
        }
        return results[0];
    }

    /**
     * Update the global daily ROI settings.
     */
    async updateDailyRoiSettings(dto: { dr_daily_roi_percentage?: number; dr_is_active?: boolean }): Promise<any> {
        const existing = await this.dataSource.query(
            `SELECT * FROM daily_roi_settings LIMIT 1`,
        );
        if (!existing || existing.length === 0) {
            throw new NotFoundException('Daily ROI settings not found. Please run the migration first.');
        }

        const row = existing[0];
        const updates: string[] = [];
        const params: any[] = [];

        if (dto.dr_daily_roi_percentage !== undefined) {
            updates.push('dr_daily_roi_percentage = ?');
            params.push(dto.dr_daily_roi_percentage);
        }
        if (dto.dr_is_active !== undefined) {
            updates.push('dr_is_active = ?');
            params.push(dto.dr_is_active ? 1 : 0);
        }

        if (updates.length === 0) {
            return row;
        }

        updates.push('dr_updated_at = ?');
        params.push(BigInt(Date.now()).toString());
        params.push(row.dr_id);

        await this.dataSource.query(
            `UPDATE daily_roi_settings SET ${updates.join(', ')} WHERE dr_id = ?`,
            params,
        );

        const updated = await this.dataSource.query(
            `SELECT * FROM daily_roi_settings WHERE dr_id = ?`,
            [row.dr_id],
        );
        return updated[0];
    }

    // ──────────────────────────────────────────────
    // DAILY ROI PAYMENTS
    // ──────────────────────────────────────────────

    /**
     * Get all active, non-expired stakings eligible for today's daily ROI payment.
     * Returns stakings that have NOT already been paid for today.
     */
    async getDailyRoiEligibleStakings(): Promise<{ eligible: any[]; alreadyPaid: any[]; roiPercentage: number; totalPayoutToday: number }> {
        console.log('Calculating daily ROI eligible stakings...');
        // 1. Get current daily ROI percentage
        const roiSettings = await this.getDailyRoiSettings();
        if (!roiSettings || !roiSettings.dr_is_active) {
            return { eligible: [], alreadyPaid: [], roiPercentage: 0, totalPayoutToday: 0 };
        }
        const roiPercentage = parseFloat(roiSettings.dr_daily_roi_percentage);

        // 2. Today's date string (YYYY-MM-DD)
        const today = new Date().toISOString().split('T')[0];
        const nowMillis = Date.now();

        // 3. Get all active, non-expired stakings
        const stakings = await this.dataSource.query(
            `SELECT st.* FROM stakings st
             WHERE st.staking_status = 'active'
             AND st.end_date > ?
             ORDER BY st.stake_created_at DESC`,
            [nowMillis],
        );
        console.log(`Found ${stakings.length} active, non-expired stakings for daily ROI check.`);

        // 4. Get today's already-paid staking IDs
        const paidToday = await this.dataSource.query(
            `SELECT drp.drp_staking_id, drp.drp_payout_amount, drp.drp_status
             FROM daily_roi_payments drp
             WHERE drp.drp_payment_date = ?`,
            [today],
        );
        const paidMap = new Map<string, any>();
        for (const p of paidToday) {
            paidMap.set(p.drp_staking_id, p);
        }

        const eligible: any[] = [];
        const alreadyPaid: any[] = [];
        let totalPayoutToday = 0;

        for (const st of stakings) {
            const stakedAmount = parseFloat(st.staked_amount_fiat) || 0;
            const payoutAmount = stakedAmount * (roiPercentage / 100);

            const entry = {
                staking_id: st.staking_id,
                uid: st.uid,
                email: st.email,
                staking_plan: st.staking_plan,
                staked_amount_fiat: stakedAmount,
                staking_wallet_address: st.staking_wallet_address,
                staking_reward_asset_symbol: st.staking_reward_asset_symbol,
                staking_reward_chain_id: st.staking_reward_chain_id,
                payout_amount: payoutAmount,
            };

            if (paidMap.has(st.staking_id)) {
                alreadyPaid.push({ ...entry, status: paidMap.get(st.staking_id).drp_status });
                totalPayoutToday += payoutAmount;
            } else {
                eligible.push(entry);
            }
        }
        console.log(`Eligible for daily ROI payment: ${eligible.length}, Already paid today: ${alreadyPaid.length}, Total payout today: ${totalPayoutToday.toFixed(2)}`);

        return { eligible, alreadyPaid, roiPercentage, totalPayoutToday };
    }

    /**
     * Pay daily ROI for a single staking.
     */
    async payDailyRoi(dto: SubmitDailyRoiPaymentDto): Promise<any> {
        const { staking_id: stakingId, tx_data, chain_id } = dto;

        // 1. Get ROI settings
        const roiSettings = await this.getDailyRoiSettings();
        if (!roiSettings || !roiSettings.dr_is_active) {
            throw new BadRequestException('Daily ROI is not active.');
        }
        const roiPercentage = parseFloat(roiSettings.dr_daily_roi_percentage);

        // 2. Today's date
        const today = new Date().toISOString().split('T')[0];
        const nowMillis = Date.now();

        // 3. Check if already paid today
        const existing = await this.dataSource.query(
            `SELECT * FROM daily_roi_payments WHERE drp_staking_id = ? AND drp_payment_date = ?`,
            [stakingId, today],
        );
        if (existing && existing.length > 0) {
            throw new BadRequestException('This staking has already been paid for today.');
        }

        // 4. Get the staking
        const stakingResult = await this.dataSource.query(
            `SELECT * FROM stakings WHERE staking_id = ?`,
            [stakingId],
        );
        if (!stakingResult || stakingResult.length === 0) {
            throw new NotFoundException('Staking not found.');
        }
        const staking = stakingResult[0];

        // 5. Validate active & not expired
        if (staking.staking_status !== 'active') {
            throw new BadRequestException('Staking is not active.');
        }
        const endDate = typeof staking.end_date === 'string' ? parseInt(staking.end_date, 10) : Number(staking.end_date);
        if (endDate > 0 && nowMillis > endDate) {
            throw new BadRequestException('Staking has expired.');
        }

        // 6. Submit transaction on-chain
        const rpc = NetworkUtils.getRpc(chain_id);
        const res = await this.submitTransaction(tx_data, rpc);
        if (!res.status) {
            throw new UnprocessableEntityException('Transaction submission failed');
        }
        const txHash = res.hash;

        // 7. Calculate payout
        const stakedAmount = parseFloat(staking.staked_amount_fiat) || 0;
        const payoutAmount = stakedAmount * (roiPercentage / 100);

        // 8. Insert payment record as confirmed
        const nowBig = BigInt(Date.now()).toString();
        try {
                        await this.dataSource.query(
            `INSERT INTO daily_roi_payments
             (drp_id, drp_staking_id, drp_uid, drp_email, drp_staking_plan,
              drp_staked_amount, drp_roi_percentage, drp_payout_amount, drp_payment_date,
              drp_chain_id, drp_reward_symbol, drp_wallet_address, drp_tx_data, drp_tx_hash,
              drp_status, drp_created_at, drp_updated_at)
             VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmed', ?, ?)`,
            [
                stakingId,
                staking.uid,
                staking.email,
                staking.staking_plan,
                stakedAmount,
                roiPercentage,
                payoutAmount,
                today,
                chain_id,
                staking.staking_reward_asset_symbol || null,
                staking.staking_wallet_address || null,
                tx_data || null,
                txHash || null,
                nowBig,
                nowBig,
            ],
        );

        }catch (err) {
            this.logger.error('Error inserting daily ROI payment record:', err);
            throw new InternalServerErrorException('Failed to record daily ROI payment');
        }
       
        this.logger.log(`Daily ROI payment confirmed for staking ${stakingId}, txHash: ${txHash}`);

        // 9. Return the created record
        const created = await this.dataSource.query(
            `SELECT * FROM daily_roi_payments WHERE drp_staking_id = ? AND drp_payment_date = ?`,
            [stakingId, today],
        );
        return created[0];
    }

    /**
     * Pay daily ROI for ALL eligible stakings at once.
     * Each item must include a signed transaction (tx_data) and chain_id.
     */
    async payAllDailyRoi(items: SubmitDailyRoiPaymentDto[]): Promise<{ paid: number; failed: number; totalPayout: number; results: any[] }> {
        if (!items || items.length === 0) {
            return { paid: 0, failed: 0, totalPayout: 0, results: [] };
        }

        let paid = 0;
        let failed = 0;
        let totalPayout = 0;
        const results: any[] = [];

        for (const item of items) {
            try {
                const result = await this.payDailyRoi(item);
                paid++;
                totalPayout += parseFloat(result.drp_payout_amount) || 0;
                results.push({ staking_id: item.staking_id, status: 'confirmed', result });
            } catch (e:any) {
                failed++;
                results.push({ staking_id: item.staking_id, status: 'failed', error: e.message || 'Unknown error' });
            }
        }

        return { paid, failed, totalPayout, results };
    }

    /**
     * Get paginated daily ROI payment history.
     */
    async getDailyRoiPayments(
        offset: number,
        limit: number,
        status?: string,
        email?: string,
        paymentDate?: string,
    ): Promise<{ data: any[]; total: number }> {
        const conditions: string[] = [];
        const params: any[] = [];

        try {
if (status) {
            conditions.push('drp.drp_status = ?');
            params.push(status);
        }
        if (email) {
            conditions.push('drp.drp_email LIKE ?');
            params.push(`%${email}%`);
        }
        if (paymentDate) {
            conditions.push('drp.drp_payment_date = ?');
            params.push(paymentDate);
        }

        const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

        const countResult = await this.dataSource.query(
            `SELECT COUNT(*) as total FROM daily_roi_payments drp ${whereClause}`,
            [...params],
        );
        const total = parseInt(countResult[0].total, 10);

        const data = await this.dataSource.query(
            `SELECT drp.* FROM daily_roi_payments drp
             ${whereClause}
             ORDER BY drp.drp_created_at DESC
             LIMIT ? OFFSET ?`,
            [...params, limit, offset],
        );

        return { data, total };
        } catch (err) {
            this.logger.error('Error fetching daily ROI payments:', err);
            throw new InternalServerErrorException('Failed to fetch daily ROI payments');
        }
        
    }

    // ──────────────────────────────────────────────
    // SHARED UTILITIES
    // ──────────────────────────────────────────────

    async submitTransaction( signedTx: string, rpc: string): Promise<{ status: boolean; hash: string | null }> {
        const provider = new JsonRpcProvider(rpc);
        const maxAttempts = 3;
        let txHash=null;
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                txHash = await provider.send("eth_sendRawTransaction", [signedTx]);
                console.log(`Transaction submitted : ${txHash} (attempt ${attempt})`);
                const receipt = await provider.waitForTransaction(txHash);
                if (receipt?.status === 1) {
                    console.log("Transaction SUCCESS");
                    return { status: true, hash: txHash };
                } else {
                    console.log(`Transaction FAILED (attempt ${attempt})`);

                    // fall through to retry if attempts remain
                }
            } catch (err) {
                console.error(`Error submitting transaction (attempt ${attempt}):`, err);
                provider.destroy();
                throw new InternalServerErrorException('Failed to submit transaction');
            }

            if (attempt < maxAttempts) {
                // simple backoff before retrying
                await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            }
        }

        console.log(`Transaction submission failed after ${maxAttempts} attempts`);
        return {
            status: false,
            hash: txHash,
        };
    }

}
