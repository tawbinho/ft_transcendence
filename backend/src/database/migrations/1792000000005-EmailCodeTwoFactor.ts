import { MigrationInterface, QueryRunner } from "typeorm";

// 2FA codes are now emailed, so the authenticator-app secret and its replay
// counter are gone, and the emailed code (hash, expiry, wrong guesses) lives
// on the row. Users who already had 2FA on keep it: they get emailed codes.
export class EmailCodeTwoFactor1792000000005 implements MigrationInterface {
    name = 'EmailCodeTwoFactor1792000000005'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "two_factor" DROP COLUMN "secret"`);
        await queryRunner.query(`ALTER TABLE "two_factor" DROP COLUMN "last_used_step"`);
        await queryRunner.query(`ALTER TABLE "two_factor" ADD "code_hash" text`);
        await queryRunner.query(`ALTER TABLE "two_factor" ADD "code_expires_at" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "two_factor" ADD "code_attempts" integer NOT NULL DEFAULT '0'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "two_factor" DROP COLUMN "code_attempts"`);
        await queryRunner.query(`ALTER TABLE "two_factor" DROP COLUMN "code_expires_at"`);
        await queryRunner.query(`ALTER TABLE "two_factor" DROP COLUMN "code_hash"`);
        await queryRunner.query(`ALTER TABLE "two_factor" ADD "last_used_step" integer`);
        await queryRunner.query(`ALTER TABLE "two_factor" ADD "secret" text NOT NULL DEFAULT ''`);
    }

}
