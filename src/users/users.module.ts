import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProfileEntity } from './entities/profile_entity';
import { UserEntity } from './entities/user_entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity, ProfileEntity
    ]),
  ],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService]
})
export class UsersModule {}
