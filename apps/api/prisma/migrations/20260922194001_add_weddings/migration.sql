-- CreateEnum
CREATE TYPE "wedding_management_type" AS ENUM ('BRIDE_SIDE', 'GROOM_SIDE', 'JOINT');

-- CreateEnum
CREATE TYPE "wedding_member_role" AS ENUM ('OWNER', 'ADMIN', 'FAMILY_MEMBER', 'COLLABORATOR');

-- CreateEnum
CREATE TYPE "wedding_side" AS ENUM ('BRIDE', 'GROOM', 'BOTH');

-- CreateTable
CREATE TABLE "weddings" (
    "id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "bride_name" VARCHAR(100) NOT NULL,
    "groom_name" VARCHAR(100) NOT NULL,
    "management_type" "wedding_management_type" NOT NULL,
    "main_wedding_date" DATE,
    "created_by_user_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "archived_at" TIMESTAMPTZ(3),

    CONSTRAINT "weddings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wedding_members" (
    "id" UUID NOT NULL,
    "wedding_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" "wedding_member_role" NOT NULL,
    "side" "wedding_side" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "joined_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "wedding_members_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "weddings_created_by_user_id_idx" ON "weddings"("created_by_user_id");

-- CreateIndex
CREATE INDEX "wedding_members_wedding_id_idx" ON "wedding_members"("wedding_id");

-- CreateIndex
CREATE INDEX "wedding_members_user_id_idx" ON "wedding_members"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "wedding_members_wedding_id_user_id_key" ON "wedding_members"("wedding_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "wedding_members_wedding_id_id_key" ON "wedding_members"("wedding_id", "id");

-- AddForeignKey
ALTER TABLE "weddings" ADD CONSTRAINT "weddings_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wedding_members" ADD CONSTRAINT "wedding_members_wedding_id_fkey" FOREIGN KEY ("wedding_id") REFERENCES "weddings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wedding_members" ADD CONSTRAINT "wedding_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
