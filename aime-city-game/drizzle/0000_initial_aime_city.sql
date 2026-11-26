CREATE TABLE "guest_rsvps" (
	"id" serial PRIMARY KEY NOT NULL,
	"site_code" varchar(12) NOT NULL,
	"guest_name" text NOT NULL,
	"attending" boolean DEFAULT true NOT NULL,
	"guests_count" integer DEFAULT 1 NOT NULL,
	"song" text DEFAULT '' NOT NULL,
	"message" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wedding_sites" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(12) NOT NULL,
	"couple" text NOT NULL,
	"wedding_date" text NOT NULL,
	"style" varchar(16) DEFAULT 'city' NOT NULL,
	"payload" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "wedding_sites_code_unique" UNIQUE("code")
);
