import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { MiningEntity } from './entities/mining_entity';
import { SubscriptionEntity } from './entities/subscription_entity';
import { MiningPaymentEntity } from './entities/mining_payment_entity';
import { StakingEntity } from './entities/staking_entity';
import { StakingReferralsEntity } from './entities/staking_referrals_entity';
import { StakingPaymentEntity } from './entities/staking_payment_entity';
import { StakingSettingsEntity } from './entities/staking_settings_entity';
import { StakingUplinePaymentEntity } from './entities/staking_upline_payment_entity';
import { DailyRoiSettingsEntity } from './entities/daily_roi_settings_entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            MiningEntity, SubscriptionEntity, MiningPaymentEntity,
            StakingEntity, StakingReferralsEntity, StakingPaymentEntity, StakingSettingsEntity,
            StakingUplinePaymentEntity,
            DailyRoiSettingsEntity,
        ]),
    ],
    controllers: [ProductsController],
    providers: [ProductsService],
    exports: [ProductsService],
})
export class ProductsModule {}
