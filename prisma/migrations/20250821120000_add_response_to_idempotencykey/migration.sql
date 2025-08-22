ALTER TABLE "IdempotencyKey" ADD COLUMN "response" JSONB NOT NULL DEFAULT '{}'::jsonb;
