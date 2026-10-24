import { MigrationInterface, QueryRunner } from "typeorm";

// A migration generated from the TwoFactor entity change. It adds the
// `last_used_step` column to `two_factor`: the number of the last 30-second
// TOTP slot whose code was accepted.
export class AddTwoFactorLastUsedStep1791289517323 implements MigrationInterface {
    name = 'AddTwoFactorLastUsedStep1791289517323'

    // up(): adds the column.
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "two_factor" ADD "last_used_step" integer`);
    }

    // down(): removes the column again (used by `npm run migration:revert`).
    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "two_factor" DROP COLUMN "last_used_step"`);
    }

}
