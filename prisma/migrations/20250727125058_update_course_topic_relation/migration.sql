/*
  Warnings:

  - You are about to drop the column `expectedAnswer` on the `Problem` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `Topic` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `Topic` table. All the data in the column will be lost.
  - You are about to drop the column `difficulty` on the `Topic` table. All the data in the column will be lost.
  - You are about to drop the column `duration` on the `Topic` table. All the data in the column will be lost.
  - You are about to drop the column `emoji` on the `Topic` table. All the data in the column will be lost.
  - You are about to drop the column `themeType` on the `Topic` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `Topic` table. All the data in the column will be lost.
  - Added the required column `firstQuestion` to the `Problem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `courseId` to the `Topic` table without a default value. This is not possible if the table is not empty.
  - Added the required column `email` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Problem" DROP COLUMN "expectedAnswer",
ADD COLUMN     "firstQuestion" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Topic" DROP COLUMN "createdAt",
DROP COLUMN "description",
DROP COLUMN "difficulty",
DROP COLUMN "duration",
DROP COLUMN "emoji",
DROP COLUMN "themeType",
DROP COLUMN "title",
ADD COLUMN     "courseId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "email" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Course" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "emoji" TEXT,
    "description" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "duration" TEXT NOT NULL,
    "path" TEXT,
    "stage" TEXT NOT NULL,
    "themeType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActiveRecall" (
    "id" TEXT NOT NULL,
    "test1" TEXT NOT NULL,
    "test2" TEXT NOT NULL,
    "test3" TEXT NOT NULL,
    "test4" TEXT NOT NULL,

    CONSTRAINT "ActiveRecall_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Topic" ADD CONSTRAINT "Topic_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
