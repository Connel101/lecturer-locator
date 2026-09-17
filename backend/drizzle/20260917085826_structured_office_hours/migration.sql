CREATE TABLE "lecturer_office_hours" (
	"lecturer_id" uuid,
	"day_of_week" integer,
	"start_time" time,
	"end_time" time,
	CONSTRAINT "lecturer_office_hours_pkey" PRIMARY KEY("lecturer_id","day_of_week","start_time","end_time"),
	CONSTRAINT "lecturer_office_hours_day_of_week_check" CHECK ("day_of_week" between 1 and 7),
	CONSTRAINT "lecturer_office_hours_time_range_check" CHECK ("end_time" > "start_time")
);
--> statement-breakpoint
ALTER TABLE "lecturers" DROP COLUMN "office_hours";--> statement-breakpoint
ALTER TABLE "lecturer_office_hours" ADD CONSTRAINT "lecturer_office_hours_lecturer_id_lecturers_id_fkey" FOREIGN KEY ("lecturer_id") REFERENCES "lecturers"("id") ON DELETE CASCADE;