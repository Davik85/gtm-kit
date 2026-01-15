-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- AlterTable
ALTER TABLE "Order"
  ADD COLUMN "accessToken" TEXT,
  ADD COLUMN "accessTokenCreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Backfill
UPDATE "Order"
SET "accessToken" = encode(gen_random_bytes(32), 'hex')
WHERE "accessToken" IS NULL;

-- AlterTable
ALTER TABLE "Order" ALTER COLUMN "accessToken" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Order_accessToken_key" ON "Order"("accessToken");
