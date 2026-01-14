-- CreateEnum
CREATE TYPE "OrderTier" AS ENUM ('base', 'plus', 'pro');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "tier" "OrderTier" NOT NULL DEFAULT 'base';
