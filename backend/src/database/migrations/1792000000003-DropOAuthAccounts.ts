import { MigrationInterface, QueryRunner } from "typeorm";

// Removes oauth_accounts: it was created for an external login (Google, 42...)
// that the project does not build, and nothing ever wrote to it.
// down() recreates it exactly as CreateIdentityTables did.
export class DropOAuthAccounts1792000000003 implements MigrationInterface {
    name = 'DropOAuthAccounts1792000000003'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "oauth_accounts" DROP CONSTRAINT "FK_22a05e92f51a983475f9281d3b0"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_22a05e92f51a983475f9281d3b"`);
        await queryRunner.query(`DROP TABLE "oauth_accounts"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "oauth_accounts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "provider" text NOT NULL, "provider_account_id" text NOT NULL, CONSTRAINT "UQ_f1daab3d50d1ce730369c01c57f" UNIQUE ("provider", "provider_account_id"), CONSTRAINT "PK_710a81523f515b78f894e33bb10" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_22a05e92f51a983475f9281d3b" ON "oauth_accounts"  ("user_id") `);
        await queryRunner.query(`ALTER TABLE "oauth_accounts" ADD CONSTRAINT "FK_22a05e92f51a983475f9281d3b0" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
