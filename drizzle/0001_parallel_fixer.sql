CREATE TABLE "random_boxes" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"name_ar" text NOT NULL,
	"description" text,
	"description_ar" text,
	"amount" numeric(10, 2) NOT NULL,
	"min_value" numeric(10, 2) NOT NULL,
	"max_value" numeric(10, 2),
	"color_gradient" text NOT NULL,
	"icon" text NOT NULL,
	"display_order" integer,
	"is_active" boolean NOT NULL,
	"stock" integer,
	"sold_count" integer NOT NULL,
	"product_ids" jsonb,
	"metadata" jsonb,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "random_box_orders" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"random_box_id" text,
	"amount" numeric(10, 2) NOT NULL,
	"is_custom_amount" boolean NOT NULL,
	"revealed_products" jsonb,
	"status" "order_status" NOT NULL,
	"shipping_name" text NOT NULL,
	"shipping_phone" text NOT NULL,
	"shipping_address" text NOT NULL,
	"shipping_city" text NOT NULL,
	"notes" text,
	"metadata" jsonb,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"revealed_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "random_box_orders" ADD CONSTRAINT "random_box_orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "random_box_orders" ADD CONSTRAINT "random_box_orders_random_box_id_random_boxes_id_fk" FOREIGN KEY ("random_box_id") REFERENCES "public"."random_boxes"("id") ON DELETE set null ON UPDATE no action;