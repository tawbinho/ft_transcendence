import { MigrationInterface, QueryRunner } from "typeorm";

// The emailed 2FA code (hash and wrong-guess counter) lives on the pending
// session row, so it dies with the session.
export class AddSessionTwoFactorCode1792000000004 implements MigrationInterface {
    name = 'AddSessionTwoFactorCode1792000000004'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "sessions" ADD "two_factor_hash" text`);
        await queryRunner.query(`ALTER TABLE "sessions" ADD "two_factor_attempts" integer NOT NULL DEFAULT '0'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "sessions" DROP COLUMN "two_factor_attempts"`);
        await queryRunner.query(`ALTER TABLE "sessions" DROP COLUMN "two_factor_hash"`);
    }

}
