import { MigrationInterface, QueryRunner } from "typeorm";

// Counts wrong guesses of the emailed 6-digit code, so it can be locked after a few.
export class AddEmailVerifyAttempts1792000000001 implements MigrationInterface {
    name = 'AddEmailVerifyAttempts1792000000001'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "email_verify_attempts" integer NOT NULL DEFAULT 0`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "email_verify_attempts"`);
    }

}
