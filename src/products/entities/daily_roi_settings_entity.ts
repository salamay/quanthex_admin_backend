import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('daily_roi_settings')
export class DailyRoiSettingsEntity {
    @PrimaryGeneratedColumn('uuid')
    dr_id: string;

    @Column({ type: 'double', nullable: false, default: 0.5 })
    dr_daily_roi_percentage: number;

    @Column({ nullable: false, default: true })
    dr_is_active: boolean;

    @Column({ nullable: false, type: 'bigint' })
    dr_created_at: BigInt;

    @Column({ nullable: false, type: 'bigint' })
    dr_updated_at: BigInt;
}
