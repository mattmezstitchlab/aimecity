import { boolean, integer, jsonb, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";
import type { PublicSite } from "@/lib/types";

export const weddingSites = pgTable("wedding_sites", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 12 }).notNull().unique(),
  couple: text("couple").notNull(),
  weddingDate: text("wedding_date").notNull(),
  style: varchar("style", { length: 16 }).notNull().default("city"),
  payload: jsonb("payload").$type<PublicSite>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const guestRsvps = pgTable("guest_rsvps", {
  id: serial("id").primaryKey(),
  siteCode: varchar("site_code", { length: 12 }).notNull(),
  guestName: text("guest_name").notNull(),
  attending: boolean("attending").notNull().default(true),
  guestsCount: integer("guests_count").notNull().default(1),
  song: text("song").notNull().default(""),
  message: text("message").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type WeddingSiteRow = typeof weddingSites.$inferSelect;
export type GuestRsvpRow = typeof guestRsvps.$inferSelect;
