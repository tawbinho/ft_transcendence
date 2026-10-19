import { MigrationInterface, QueryRunner } from "typeorm";

// Adds email verification to users: when it happened, and the hash + expiry
// of the pending link token. Accounts that already exist predate the rule: they count as verified.
export class AddEmailVerification1792000000000 implements MigrationInterface {
    name = 'AddEmailVerification1792000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "email_verified_at" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "users" ADD "email_verify_hash" text`);
        await queryRunner.query(`ALTER TABLE "users" ADD "email_verify_expires_at" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`UPDATE "users" SET "email_verified_at" = now()`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "email_verify_expires_at"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "email_verify_hash"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "email_verified_at"`);
    }

}
