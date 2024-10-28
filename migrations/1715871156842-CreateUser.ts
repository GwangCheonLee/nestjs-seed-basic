import {MigrationInterface, QueryRunner} from 'typeorm';

export class CreateUser1715871156842 implements MigrationInterface {
  name = 'CreateUser1715871156842';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."users_roles_enum" AS ENUM('USER', 'ADMIN')`,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" SERIAL NOT NULL, "oauth_provider" character varying, "email" character varying NOT NULL, "password" character varying, "nickname" character varying NOT NULL, "profile_image" character varying, "roles" "public"."users_roles_enum" array NOT NULL DEFAULT '{USER}', "two_factor_authentication_secret" character varying, "is_active" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "public"."users_roles_enum"`);
  }
}
