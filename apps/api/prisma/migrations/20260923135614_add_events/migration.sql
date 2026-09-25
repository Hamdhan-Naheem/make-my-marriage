-- CreateTable
CREATE TABLE "events" (
    "id" UUID NOT NULL,
    "wedding_id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "description" VARCHAR(1000),
    "side" "wedding_side" NOT NULL,
    "event_date" DATE,
    "start_time" TIME(0),
    "end_time" TIME(0),
    "venue_name" VARCHAR(160),
    "address" VARCHAR(500),
    "created_by_user_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "events_wedding_id_idx" ON "events"("wedding_id");

-- CreateIndex
CREATE INDEX "events_wedding_id_event_date_idx" ON "events"("wedding_id", "event_date");

-- CreateIndex
CREATE INDEX "events_created_by_user_id_idx" ON "events"("created_by_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "events_wedding_id_id_key" ON "events"("wedding_id", "id");

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_wedding_id_fkey" FOREIGN KEY ("wedding_id") REFERENCES "weddings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
