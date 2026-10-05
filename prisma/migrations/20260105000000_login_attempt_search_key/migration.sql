-- AlterTable
ALTER TABLE "Dish" DROP COLUMN "offerPrice",
ADD COLUMN     "searchKey" TEXT NOT NULL DEFAULT '';

-- CreateTable
CREATE TABLE "LoginAttempt" (
    "id" TEXT NOT NULL,
    "ipHash" TEXT NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoginAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LoginAttempt_ipHash_windowStart_idx" ON "LoginAttempt"("ipHash", "windowStart");
