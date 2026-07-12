import { Controller, Get, Post, Put, Body, Query, Request, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { ProductsService } from './products.service';
import { SubmitPaymentDto } from './dtos/submit_payment_dto';
import { SubmitStakingPaymentDto } from './dtos/submit_staking_payment_dto';
import { SubmitUplinePaymentDto } from './dtos/submit_upline_payment_dto';
import { UpdateStakingSettingsDto } from './dtos/update_staking_settings_dto';
import { UpdateDailyRoiDto } from './dtos/update_daily_roi_dto';
import { SubmitDailyRoiPaymentDto } from './dtos/submit_daily_roi_payment_dto';

@Controller('products')
export class ProductsController {
    constructor(private productsService: ProductsService) {}

    @Get('minings')
    async getAllMinings(
        @Request() req,
        @Query('offset') offset: string = '0',
        @Query('limit') limit: string = '20',
        @Query('packageName') packageName?: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ): Promise<any> {
        const uid = req.user?.uid;
        if (!uid) {
            throw new UnauthorizedException('Missing user id on request');
        }
        const parsedOffset = parseInt(offset, 10) || 0;
        const parsedLimit = Math.min(parseInt(limit, 10) || 20, 100);
        const parsedStartDate = startDate ? parseInt(startDate, 10) : undefined;
        const parsedEndDate = endDate ? parseInt(endDate, 10) : undefined;
        return await this.productsService.getAllMinings(
            parsedOffset,
            parsedLimit,
            packageName,
            parsedStartDate,
            parsedEndDate,
        );
    }

    @Get("subscription-direct-referrals")
    async getSubscriptionDirectReferrals(@Request() req, @Query('subscriptionId') subscriptionId: string): Promise<any> {
        const uid = req.user?.uid;
        console.log('Fetching direct referrals for user:', uid);
        if (!uid) {
            throw new UnauthorizedException('Missing user id on request');
        }
        return await this.productsService.getMiningDirectReferrals(uid, subscriptionId);
    }

    @Get("subscription-indirect-referrals")
    async getSubscriptionIndirectReferrals(@Request() req, @Query('subscriptionId') subscriptionId: string): Promise<any> {
        const uid = req.user?.uid;
        console.log('Fetching indirect referrals for user:', uid);
        if (!uid) {
            throw new UnauthorizedException('Missing user id on request');
        }
        return await this.productsService.getMiningIndirectReferrals(uid, subscriptionId);
    }

    @Get("admin-direct-referrals")
    async getAdminDirectReferrals(
        @Query('uid') uid: string,
        @Query('subscriptionId') subscriptionId: string,
    ): Promise<any> {
        if (!uid || !subscriptionId) {
            throw new BadRequestException('Missing uid or subscriptionId parameter');
        }
        return await this.productsService.getMiningDirectReferrals(uid, subscriptionId);
    }

    @Get("admin-indirect-referrals")
    async getAdminIndirectReferrals(
        @Query('uid') uid: string,
        @Query('subscriptionId') subscriptionId: string,
    ): Promise<any> {
        if (!uid || !subscriptionId) {
            throw new BadRequestException('Missing uid or subscriptionId parameter');
        }
        return await this.productsService.getMiningIndirectReferrals(uid, subscriptionId);
    }

    @Post("submit-payment")
    async submitPayment(@Request() req, @Body() dto: SubmitPaymentDto): Promise<any> {
        const uid = req.user?.uid;
        if (!uid) {
            throw new UnauthorizedException('Missing user id on request');
        }
        return await this.productsService.submitPayment(dto);
    }

    @Post("manual-mining-payment")
    async submitManualPayment(@Request() req, @Body() dto: SubmitPaymentDto): Promise<any> {
        const uid = req.user?.uid;
        if (!uid) {
            throw new UnauthorizedException('Missing user id on request');
        }
        return await this.productsService.submitManualPayment(dto);
    }

    // ──────────────────────────────────────────────
    // STAKING ENDPOINTS
    // ──────────────────────────────────────────────

    @Get('stakings')
    async getAllStakings(
        @Request() req,
        @Query('offset') offset: string = '0',
        @Query('limit') limit: string = '20',
        @Query('planName') planName?: string,
        @Query('status') status?: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ): Promise<any> {
        const uid = req.user?.uid;
        if (!uid) {
            throw new UnauthorizedException('Missing user id on request');
        }
        const parsedOffset = parseInt(offset, 10) || 0;
        const parsedLimit = Math.min(parseInt(limit, 10) || 20, 100);
        const parsedStartDate = startDate ? parseInt(startDate, 10) : undefined;
        const parsedEndDate = endDate ? parseInt(endDate, 10) : undefined;
        return await this.productsService.getAllStakings(
            parsedOffset,
            parsedLimit,
            planName,
            status,
            parsedStartDate,
            parsedEndDate,
        );
    }

    @Get('staking-settings')
    async getStakingSettings(@Request() req): Promise<any> {
        const uid = req.user?.uid;
        if (!uid) {
            throw new UnauthorizedException('Missing user id on request');
        }
        return await this.productsService.getStakingSettings();
    }

    @Put('staking-settings')
    async updateStakingSettings(@Request() req, @Body() dto: UpdateStakingSettingsDto): Promise<any> {
        const uid = req.user?.uid;
        if (!uid) {
            throw new UnauthorizedException('Missing user id on request');
        }
        return await this.productsService.updateStakingSettings(dto);
    }

    @Post('submit-staking-payment')
    async submitStakingPayment(@Request() req, @Body() dto: SubmitStakingPaymentDto): Promise<any> {
        const uid = req.user?.uid;
        if (!uid) {
            throw new UnauthorizedException('Missing user id on request');
        }
        return await this.productsService.submitStakingPayment(dto);
    }

    // ──────────────────────────────────────────────
    // STAKING UPLINE PAYMENT ENDPOINTS
    // ──────────────────────────────────────────────

    @Get('staking-upline-payments')
    async getUplinePayments(
        @Request() req,
        @Query('offset') offset: string = '0',
        @Query('limit') limit: string = '20',
        @Query('status') status?: string,
        @Query('planName') planName?: string,
    ): Promise<any> {
        const uid = req.user?.uid;
        if (!uid) {
            throw new UnauthorizedException('Missing user id on request');
        }
        const parsedOffset = parseInt(offset, 10) || 0;
        const parsedLimit = Math.min(parseInt(limit, 10) || 20, 100);
        return await this.productsService.getUplinePayments(
            parsedOffset,
            parsedLimit,
            status,
            planName,
        );
    }

    @Post('submit-upline-payment')
    async submitUplinePayment(@Request() req, @Body() dto: SubmitUplinePaymentDto): Promise<any> {
        const uid = req.user?.uid;
        if (!uid) {
            throw new UnauthorizedException('Missing user id on request');
        }
        return await this.productsService.submitUplinePayment(dto);
    }

    // ──────────────────────────────────────────────
    // TRANSACTION LIST ENDPOINTS
    // ──────────────────────────────────────────────

    @Get('mining-payments')
    async getMiningPayments(
        @Request() req,
        @Query('offset') offset: string = '0',
        @Query('limit') limit: string = '20',
        @Query('status') status?: string,
        @Query('packageName') packageName?: string,
        @Query('email') email?: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
        @Query('minId') minId?: string,
    ): Promise<any> {
        const uid = req.user?.uid;
        if (!uid) {
            throw new UnauthorizedException('Missing user id on request');
        }
        const parsedOffset = parseInt(offset, 10) || 0;
        const parsedLimit = Math.min(parseInt(limit, 10) || 20, 100);
        const parsedStartDate = startDate ? parseInt(startDate, 10) : undefined;
        const parsedEndDate = endDate ? parseInt(endDate, 10) : undefined;
        return await this.productsService.getMiningPayments(
            parsedOffset,
            parsedLimit,
            status,
            packageName,
            email,
            parsedStartDate,
            parsedEndDate,
            minId,
        );
    }

    @Get('staking-payments')
    async getStakingPayments(
        @Request() req,
        @Query('offset') offset: string = '0',
        @Query('limit') limit: string = '20',
        @Query('status') status?: string,
        @Query('planName') planName?: string,
        @Query('email') email?: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ): Promise<any> {
        const uid = req.user?.uid;
        if (!uid) {
            throw new UnauthorizedException('Missing user id on request');
        }
        const parsedOffset = parseInt(offset, 10) || 0;
        const parsedLimit = Math.min(parseInt(limit, 10) || 20, 100);
        const parsedStartDate = startDate ? parseInt(startDate, 10) : undefined;
        const parsedEndDate = endDate ? parseInt(endDate, 10) : undefined;
        return await this.productsService.getStakingPayments(
            parsedOffset,
            parsedLimit,
            status,
            planName,
            email,
            parsedStartDate,
            parsedEndDate,
        );
    }

    // ──────────────────────────────────────────────
    // DAILY ROI SETTINGS ENDPOINTS
    // ──────────────────────────────────────────────

    @Get('daily-roi-settings')
    async getDailyRoiSettings(@Request() req): Promise<any> {
        const uid = req.user?.uid;
        if (!uid) {
            throw new UnauthorizedException('Missing user id on request');
        }
        return await this.productsService.getDailyRoiSettings();
    }

    @Put('daily-roi-settings')
    async updateDailyRoiSettings(@Request() req, @Body() dto: UpdateDailyRoiDto): Promise<any> {
        const uid = req.user?.uid;
        if (!uid) {
            throw new UnauthorizedException('Missing user id on request');
        }
        return await this.productsService.updateDailyRoiSettings(dto);
    }

    // ──────────────────────────────────────────────
    // DAILY ROI PAYMENTS ENDPOINTS
    // ──────────────────────────────────────────────

    @Get('daily-roi-eligible')
    async getDailyRoiEligible(@Request() req): Promise<any> {
        const uid = req.user?.uid;
        if (!uid) {
            throw new UnauthorizedException('Missing user id on request');
        }
        return await this.productsService.getDailyRoiEligibleStakings();
    }

    @Post('daily-roi-pay')
    async payDailyRoi(@Request() req, @Body() dto: SubmitDailyRoiPaymentDto): Promise<any> {
        const uid = req.user?.uid;
        if (!uid) {
            throw new UnauthorizedException('Missing user id on request');
        }
        if (!dto.staking_id) {
            throw new BadRequestException('staking_id is required');
        }
        if (!dto.tx_data) {
            throw new BadRequestException('tx_data is required');
        }
        if (!dto.chain_id) {
            throw new BadRequestException('chain_id is required');
        }
        return await this.productsService.payDailyRoi(dto);
    }

    @Post('daily-roi-pay-all')
    async payAllDailyRoi(@Request() req, @Body() body: { items: SubmitDailyRoiPaymentDto[] }): Promise<any> {
        const uid = req.user?.uid;
        if (!uid) {
            throw new UnauthorizedException('Missing user id on request');
        }
        if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
            throw new BadRequestException('items array is required and must not be empty');
        }
        return await this.productsService.payAllDailyRoi(body.items);
    }

    @Get('daily-roi-payments')
    async getDailyRoiPayments(
        @Request() req,
        @Query('offset') offset: string = '0',
        @Query('limit') limit: string = '20',
        @Query('status') status?: string,
        @Query('email') email?: string,
        @Query('paymentDate') paymentDate?: string,
    ): Promise<any> {
        const uid = req.user?.uid;
        if (!uid) {
            throw new UnauthorizedException('Missing user id on request');
        }
        const parsedOffset = parseInt(offset, 10) || 0;
        const parsedLimit = Math.min(parseInt(limit, 10) || 20, 100);
        return await this.productsService.getDailyRoiPayments(
            parsedOffset,
            parsedLimit,
            status,
            email,
            paymentDate,
        );
    }
}
