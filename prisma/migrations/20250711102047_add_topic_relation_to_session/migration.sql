/*
  Warnings:

  - You are about to drop the column `topic` on the `Session` table. All the data in the column will be lost.
  - Added the required column `topicId` to the `Session` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Session" DROP COLUMN "topic",
ADD COLUMN     "topicId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
