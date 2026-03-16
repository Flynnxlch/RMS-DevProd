-- CreateEnum
CREATE TYPE "ContentType" AS ENUM ('TEXT', 'IMAGE');

-- CreateTable
CREATE TABLE "regulation_updates" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(500) NOT NULL,
    "category" VARCHAR(255) NOT NULL,
    "content_type" "ContentType" NOT NULL,
    "content" TEXT NOT NULL,
    "link" VARCHAR(500),
    "published_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "regulation_updates_pkey" PRIMARY KEY ("id")
);
