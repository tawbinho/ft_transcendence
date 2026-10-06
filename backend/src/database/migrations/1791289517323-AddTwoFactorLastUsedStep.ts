import { MigrationInterface, QueryRunner } from "typeorm";

// WHAT THIS FILE IS
// A migration generated from the TwoFactor entity change. It adds the
// `last_used_step` column to `two_factor`: the number of the last 30-second
// TOTP slot whose code was accepted. Codes from that slot or earlier are
// rejected afterwards, which stops a code from being used twice (replay).
// The column is nullable: existing rows (and users who never verified a
// code) have no value yet.
// The number in the file/class name is the creation time; never rename this
// file or edit it once it has run (see CreateIdentityTables for details).
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
