import { MigrationInterface, QueryRunner } from "typeorm";

// Forgot password: hash + expiry + wrong-guess counter of the emailed code.
export class AddPasswordReset1792000000002 implements MigrationInterface {
    name = 'AddPasswordReset1792000000002'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "password_reset_hash" text`);
        await queryRunner.query(`ALTER TABLE "users" ADD "password_reset_expires_at" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "users" ADD "password_reset_attempts" integer NOT NULL DEFAULT 0`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "password_reset_attempts"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "password_reset_expires_at"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "password_reset_hash"`);
    }

}
