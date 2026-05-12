import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config/dist/config.module';
import { ConfigService } from '@nestjs/config/dist/config.service';
import { UsersModule } from './users/users.module';
import { UserEntity } from './users/entities/user_entity';
import { ProfileEntity } from './users/entities/profile_entity';
import { AuthModule } from './auth/auth.module';
import { ProductsModule } from './products/products.module';
import { MiningEntity } from './products/entities/mining_entity';
import { SubscriptionEntity } from './products/entities/subscription_entity';
import { MiningPaymentEntity } from './products/entities/mining_payment_entity';
import { StakingEntity } from './products/entities/staking_entity';
import { StakingReferralsEntity } from './products/entities/staking_referrals_entity';
import { StakingPaymentEntity } from './products/entities/staking_payment_entity';
import { StakingSettingsEntity } from './products/entities/staking_settings_entity';
import { StakingUplinePaymentEntity } from './products/entities/staking_upline_payment_entity';
import { TypeOrmModule } from '@nestjs/typeorm';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>('QUANTHEX_DB_HOST'),
        port: configService.get<number>('QUANTHEX_DB_PORT'),
        username: configService.get<string>('QUANTHEX_DB_USERNAME'),
        password: configService.get<string>('QUANTHEX_DB_PASSWORD'),
        database: configService.get<string>('QUANTHEX_DB_NAME'),
        bigNumberStrings: true,
        entities: [
          UserEntity, ProfileEntity, MiningEntity, SubscriptionEntity, MiningPaymentEntity,
          StakingEntity, StakingReferralsEntity, StakingPaymentEntity, StakingSettingsEntity,
          StakingUplinePaymentEntity
        ],
        synchronize: false,
      })
    }),
    UsersModule,
    AuthModule,
    ProductsModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
