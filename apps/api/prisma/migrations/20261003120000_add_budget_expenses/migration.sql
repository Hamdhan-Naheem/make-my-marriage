-- CreateEnum
CREATE TYPE "wedding_currency" AS ENUM ('LKR', 'USD', 'AUD', 'SGD');

-- AlterTable
ALTER TABLE "weddings"
ADD COLUMN "budget_amount" NUMERIC(18,2),
ADD COLUMN "currency" "wedding_currency";

-- AlterTable
ALTER TABLE "events"
ADD COLUMN "budget_amount" NUMERIC(18,2);

-- CreateTable
CREATE TABLE "expenses" (
    "id" UUID NOT NULL,
    "wedding_id" UUID NOT NULL,
    "event_id" UUID,
    "name" VARCHAR(140) NOT NULL,
    "description" VARCHAR(1000),
    "amount" NUMERIC(18,2) NOT NULL,
    "side" "wedding_side" NOT NULL,
    "expense_date" DATE,
    "category" VARCHAR(100),
    "created_by_user_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "expenses_amount_positive" CHECK ("amount" > 0)
);

-- AddCheckConstraint
ALTER TABLE "weddings"
ADD CONSTRAINT "weddings_budget_amount_non_negative"
CHECK ("budget_amount" IS NULL OR "budget_amount" >= 0);

-- AddCheckConstraint
ALTER TABLE "events"
ADD CONSTRAINT "events_budget_amount_non_negative"
CHECK ("budget_amount" IS NULL OR "budget_amount" >= 0);

-- CreateIndex
CREATE UNIQUE INDEX "expenses_wedding_id_id_key" ON "expenses"("wedding_id", "id");

-- CreateIndex
CREATE INDEX "expenses_wedding_id_idx" ON "expenses"("wedding_id");

-- CreateIndex
CREATE INDEX "expenses_wedding_id_event_id_idx" ON "expenses"("wedding_id", "event_id");

-- CreateIndex
CREATE INDEX "expenses_wedding_id_side_idx" ON "expenses"("wedding_id", "side");

-- CreateIndex
CREATE INDEX "expenses_wedding_id_expense_date_idx" ON "expenses"("wedding_id", "expense_date");

-- CreateIndex
CREATE INDEX "expenses_created_by_user_id_idx" ON "expenses"("created_by_user_id");

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_wedding_id_fkey"
FOREIGN KEY ("wedding_id") REFERENCES "weddings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_wedding_id_event_id_fkey"
FOREIGN KEY ("wedding_id", "event_id") REFERENCES "events"("wedding_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_created_by_user_id_fkey"
FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
