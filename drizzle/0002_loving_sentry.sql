ALTER TABLE "carts" ALTER COLUMN "product_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "carts" ADD COLUMN "random_box_id" text;--> statement-breakpoint
ALTER TABLE "carts" ADD COLUMN "item_type" text NOT NULL;--> statement-breakpoint
ALTER TABLE "carts" ADD COLUMN "custom_amount" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "carts" ADD CONSTRAINT "carts_random_box_id_random_boxes_id_fk" FOREIGN KEY ("random_box_id") REFERENCES "public"."random_boxes"("id") ON DELETE cascade ON UPDATE no action;