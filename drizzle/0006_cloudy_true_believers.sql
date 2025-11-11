CREATE TABLE "chat_read_status" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"user_id" text,
	"is_admin" boolean NOT NULL,
	"last_read_at" timestamp NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "chat_read_status" ADD CONSTRAINT "chat_read_status_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "chat_read_status_session_id_idx" ON "chat_read_status" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "chat_read_status_user_id_idx" ON "chat_read_status" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "chat_read_status_session_user_admin_idx" ON "chat_read_status" USING btree ("session_id","user_id","is_admin");--> statement-breakpoint
CREATE INDEX "chat_messages_session_id_idx" ON "chat_messages" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "chat_messages_created_at_idx" ON "chat_messages" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "chat_messages_session_id_created_at_idx" ON "chat_messages" USING btree ("session_id","created_at");--> statement-breakpoint
CREATE INDEX "chat_messages_user_id_idx" ON "chat_messages" USING btree ("user_id");