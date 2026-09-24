-- CreateEnum
CREATE TYPE "task_status" AS ENUM ('TO_DO', 'COMPLETED');

-- CreateTable
CREATE TABLE "tasks" (
    "id" UUID NOT NULL,
    "wedding_id" UUID NOT NULL,
    "event_id" UUID,
    "name" VARCHAR(140) NOT NULL,
    "description" VARCHAR(1000),
    "side" "wedding_side" NOT NULL,
    "due_date" DATE,
    "status" "task_status" NOT NULL DEFAULT 'TO_DO',
    "completed_at" TIMESTAMPTZ(3),
    "created_by_user_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tasks_wedding_id_id_key" ON "tasks"("wedding_id", "id");

-- CreateIndex
CREATE INDEX "tasks_wedding_id_idx" ON "tasks"("wedding_id");

-- CreateIndex
CREATE INDEX "tasks_wedding_id_status_idx" ON "tasks"("wedding_id", "status");

-- CreateIndex
CREATE INDEX "tasks_wedding_id_side_idx" ON "tasks"("wedding_id", "side");

-- CreateIndex
CREATE INDEX "tasks_wedding_id_event_id_idx" ON "tasks"("wedding_id", "event_id");

-- CreateIndex
CREATE INDEX "tasks_wedding_id_due_date_idx" ON "tasks"("wedding_id", "due_date");

-- CreateIndex
CREATE INDEX "tasks_created_by_user_id_idx" ON "tasks"("created_by_user_id");

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_wedding_id_fkey" FOREIGN KEY ("wedding_id") REFERENCES "weddings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_wedding_id_event_id_fkey" FOREIGN KEY ("wedding_id", "event_id") REFERENCES "events"("wedding_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
