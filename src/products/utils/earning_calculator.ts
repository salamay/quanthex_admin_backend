import { ReferralDto } from "src/users/dtos/referral_dto";

// Package name constants
const STARTER = 'Starter Mining Package';
const GROWTH = 'Growth Package';
const ADVANCE = 'Advance Package';
const PRO = 'Pro Package';
const MEGA = 'Mega Package';

// Max amounts per package
const STARTER_AMOUNT_MAX = 498.0;
const GROWTH_AMOUNT_MAX = 1914.0;
const ADVANCE_AMOUNT_MAX = 4602.0;
const PRO_AMOUNT_MAX = 10644.0;
const MEGA_AMOUNT_MAX = 21300.0;

export class EarningCalculator {
    /**
     * Calculate direct earning based on package name and number of direct referrals.
     * Mirrors SubUtils.calcAmountEarned from user app.
     */
    static calcDirectEarning(packageName: string, noOfReferrals: number): number {
        if (noOfReferrals === 0) {
            const baseDefault = 0.1;
            if (packageName === STARTER) return baseDefault * 2;
            if (packageName === GROWTH) return baseDefault * 4;
            if (packageName === ADVANCE) return baseDefault * 6;
            if (packageName === PRO) return baseDefault * 7;
            if (packageName === MEGA) return baseDefault * 8;
            return 0.0;
        }

        let totalReward = 0;
        if (packageName === STARTER) totalReward = STARTER_AMOUNT_MAX;
        else if (packageName === GROWTH) totalReward = GROWTH_AMOUNT_MAX;
        else if (packageName === ADVANCE) totalReward = ADVANCE_AMOUNT_MAX;
        else if (packageName === PRO) totalReward = PRO_AMOUNT_MAX;
        else if (packageName === MEGA) totalReward = MEGA_AMOUNT_MAX;
        else return 0.0;

        return this.calPrice(noOfReferrals, totalReward, packageName);
    }

    private static calPrice(noOfReferrals: number, totalReward: number, packageName: string): number {
        let denom = 6;
        const rewardPotential = this.levelAmount(packageName, noOfReferrals);

        if (noOfReferrals <= 6) {
            denom = 6;
        } else if (noOfReferrals > 6 && noOfReferrals <= 36) {
            denom = 36;
        } else if (noOfReferrals > 36 && noOfReferrals <= 216) {
            denom = 216;
        } else if (noOfReferrals > 216 && noOfReferrals <= 1296) {
            denom = 1296;
        } else {
            return 0;
        }

        return (noOfReferrals / denom) * rewardPotential;
    }

    private static levelAmount(packageName: string, noOfReferrals: number): number {
        if (packageName === STARTER) {
            if (noOfReferrals <= 6) return 102;
            if (noOfReferrals > 6 && noOfReferrals <= 36) return 180;
            if (noOfReferrals > 36 && noOfReferrals <= 216) return 216;
            if (noOfReferrals >= 216 && noOfReferrals < 1296) return 498;
            return 0;
        } else if (packageName === GROWTH) {
            if (noOfReferrals <= 6) return 402;
            if (noOfReferrals > 6 && noOfReferrals <= 36) return 648;
            if (noOfReferrals > 36 && noOfReferrals <= 216) return 864;
            if (noOfReferrals >= 216 && noOfReferrals < 1296) return 1914;
            return 0;
        } else if (packageName === ADVANCE) {
            if (noOfReferrals <= 6) return 1002;
            if (noOfReferrals > 6 && noOfReferrals <= 36) return 1440;
            if (noOfReferrals > 36 && noOfReferrals <= 216) return 2160;
            if (noOfReferrals >= 216 && noOfReferrals < 1296) return 4602;
            return 0;
        } else if (packageName === PRO) {
            if (noOfReferrals <= 6) return 2004;
            if (noOfReferrals > 6 && noOfReferrals <= 36) return 3240;
            if (noOfReferrals > 36 && noOfReferrals <= 216) return 5400;
            if (noOfReferrals >= 216 && noOfReferrals < 1296) return 10644;
            return 0;
        } else if (packageName === MEGA) {
            if (noOfReferrals <= 6) return 4020;
            if (noOfReferrals > 6 && noOfReferrals <= 36) return 5400;
            if (noOfReferrals > 36 && noOfReferrals <= 216) return 11880;
            if (noOfReferrals >= 216 && noOfReferrals < 1296) return 21300;
            return 0;
        }
        return 0;
    }

    /**
     * Calculate indirect earning for a single indirect referral based on its path length.
     * Mirrors IndirectEarningCalc.calcAmountEarned from user app.
     */
    static calcIndirectEarningPerReferral(packageName: string, noOfPath: number): number {
        if (noOfPath === 0) return 0;
        return this.pathAmount(packageName, noOfPath);
    }

    private static pathAmount(packageName: string, noOfPath: number): number {
        if (packageName === STARTER) {
            if (noOfPath >= 1 && noOfPath < 2) return 5;
            if (noOfPath >= 2 && noOfPath < 3) return 1;
            if (noOfPath >= 3) return 1;
            return 0;
        } else if (packageName === GROWTH) {
            if (noOfPath >= 1 && noOfPath < 2) return 18;
            if (noOfPath >= 2 && noOfPath < 3) return 4;
            if (noOfPath >= 3) return 4;
            return 0;
        } else if (packageName === ADVANCE) {
            if (noOfPath >= 1 && noOfPath < 2) return 40;
            if (noOfPath >= 2 && noOfPath < 3) return 10;
            if (noOfPath >= 3) return 10;
            return 0;
        } else if (packageName === PRO) {
            if (noOfPath >= 1 && noOfPath < 2) return 90;
            if (noOfPath >= 2 && noOfPath < 3) return 25;
            if (noOfPath >= 3) return 25;
            return 0;
        } else if (packageName === MEGA) {
            if (noOfPath >= 1 && noOfPath < 2) return 150;
            if (noOfPath >= 2 && noOfPath < 3) return 55;
            if (noOfPath >= 3) return 55;
            return 0;
        }
        return 0;
    }

    /**
     * Calculate total indirect earnings by summing earnings for each indirect referral.
     * Each referral has a path array; its length determines the earning amount.
     */
    static calcTotalIndirectEarning(packageName: string,subId: string,indirectReferrals: ReferralDto[]): number {
        let total = 0;
        for (const referral of indirectReferrals) {
            let index: number = referral.info.referral_path.findIndex(path => path === subId);
            if (index !== -1) {
                console.log(` Path ${referral.info.referral_path} and index of is ${index} is ${subId} Length is ${referral.info.referral_path.length} Name: ${packageName}`);
                const pathLength = referral.info.referral_path.slice(index + 1).length; // Calculate path length from the referral to the current subId
                console.log(` Path length is ${pathLength}`);
                total += this.calcIndirectEarningPerReferral(packageName, pathLength);
            }
        }
        console.log(` Total indirect earning for package ${packageName} and subId ${subId} is ${total}`);
        return total;
    }

    /**
     * Calculate total earning (direct + indirect) for a mining.
     */
    static calcTotalEarning(
        packageName: string,
        subId: string,
        directReferralCount: number,
        indirectReferrals: ReferralDto[],
    ): { directEarning: number; indirectEarning: number; totalEarning: number } {
        const directEarning = this.calcDirectEarning(packageName, directReferralCount);
        const indirectEarning = this.calcTotalIndirectEarning(packageName, subId, indirectReferrals);
        const totalEarning = directEarning + indirectEarning;
        return {
            directEarning: parseFloat(directEarning.toFixed(4)),
            indirectEarning: parseFloat(indirectEarning.toFixed(4)),
            totalEarning: parseFloat(totalEarning.toFixed(4)),
        };
    }
}
