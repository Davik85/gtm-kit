-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "promptKey" TEXT NOT NULL DEFAULT 'gtm_eu_core',
ADD COLUMN     "promptVersion" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "Result" ADD COLUMN     "promptKey" TEXT NOT NULL DEFAULT 'gtm_eu_core',
ADD COLUMN     "promptVersion" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "promptSnapshot" TEXT NOT NULL DEFAULT '';
