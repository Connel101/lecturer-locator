ALTER TABLE "routes" RENAME COLUMN "svg_path" TO "svg_overlay";--> statement-breakpoint
ALTER TABLE "routes" ALTER COLUMN "svg_overlay" DROP NOT NULL;