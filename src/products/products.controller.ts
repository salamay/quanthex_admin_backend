import { Controller, Get, Post, Put, Body, Query, Request, UnauthorizedException } from '@nestjs/common';
import { ProductsService } from './products.service';
import { SubmitPaymentDto } from './dtos/submit_payment_dto';
import { SubmitStakingPaymentDto } from './dtos/submit_staking_payment_dto';
import { SubmitUplinePaymentDto } from './dtos/submit_upline_payment_dto';
import { UpdateStakingSettingsDto } from './dtos/update_staking_settings_dto';

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

    @Post("submit-payment")
    async submitPayment(@Request() req, @Body() dto: SubmitPaymentDto): Promise<any> {
        const uid = req.user?.uid;
        if (!uid) {
            throw new UnauthorizedException('Missing user id on request');
        }
        return await this.productsService.submitPayment(dto);
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
}
