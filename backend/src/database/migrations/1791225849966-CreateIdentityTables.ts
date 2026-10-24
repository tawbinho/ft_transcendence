import { MigrationInterface, QueryRunner } from "typeorm";

// A migration: a versioned set of instructions that changes the database
// schema.
export class CreateIdentityTables1791225849966 implements MigrationInterface {
    name = 'CreateIdentityTables1791225849966'

    // up(): applies the change. Creates users, oauth_accounts and two_factor,
    // then the index on oauth_accounts.user_id, then the foreign keys.
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" text NOT NULL, "display_name" text NOT NULL, "password_hash" text, "avatar_url" text, "locale" text NOT NULL DEFAULT 'en', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "UQ_a72fa0bb46a03bedcd1745efb41" UNIQUE ("display_name"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "oauth_accounts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "provider" text NOT NULL, "provider_account_id" text NOT NULL, CONSTRAINT "UQ_f1daab3d50d1ce730369c01c57f" UNIQUE ("provider", "provider_account_id"), CONSTRAINT "PK_710a81523f515b78f894e33bb10" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_22a05e92f51a983475f9281d3b" ON "oauth_accounts"  ("user_id") `);
        await queryRunner.query(`CREATE TABLE "two_factor" ("user_id" uuid NOT NULL, "secret" text NOT NULL, "enabled" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_162c7f53b41b84102a8e06eff18" PRIMARY KEY ("user_id"))`);
        await queryRunner.query(`ALTER TABLE "oauth_accounts" ADD CONSTRAINT "FK_22a05e92f51a983475f9281d3b0" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "two_factor" ADD CONSTRAINT "FK_162c7f53b41b84102a8e06eff18" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    // down(): undoes up(), in the reverse order (foreign keys first, then the
    // tables, with `users` last because the others point to it). Used by `npm
    // run migration:revert`.
    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "two_factor" DROP CONSTRAINT "FK_162c7f53b41b84102a8e06eff18"`);
        await queryRunner.query(`ALTER TABLE "oauth_accounts" DROP CONSTRAINT "FK_22a05e92f51a983475f9281d3b0"`);
        await queryRunner.query(`DROP TABLE "two_factor"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_22a05e92f51a983475f9281d3b"`);
        await queryRunner.query(`DROP TABLE "oauth_accounts"`);
        await queryRunner.query(`DROP TABLE "users"`);
    }

}
