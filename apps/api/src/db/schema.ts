import {
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  username: text("username").notNull().unique(),
  /** Segment trong URL mock: GET /api/<publicSlug>/... — null = fallback username (dữ liệu cũ). */
  publicSlug: text("public_slug").unique(),
  email: text("email").unique(),
  passwordHash: text("password_hash"),
  webhookToken: text("webhook_token").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const projects = pgTable(
  "projects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("projects_user_slug").on(t.userId, t.slug)]
);

export const endpoints = pgTable(
  "endpoints",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    pathNormalized: text("path_normalized").notNull(),
    methodsAllowed: jsonb("methods_allowed").$type<string[]>().notNull(),
    schemaConfig: jsonb("schema_config").notNull(),
    latencyMsMin: integer("latency_ms_min"),
    latencyMsMax: integer("latency_ms_max"),
    statusRoulette: jsonb("status_roulette").$type<Record<string, number>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("endpoints_user_path").on(t.userId, t.pathNormalized)]
);

// Guest (anonymous) mock endpoints
export const guestEndpoints = pgTable(
  "guest_endpoints",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    // Guest actor key (MVP: dùng request IP để rate limit)
    actorKey: text("actor_key").notNull(),

    guestToken: text("guest_token").notNull().unique(),
    pathNormalized: text("path_normalized").notNull(),
    methodsAllowed: jsonb("methods_allowed").$type<string[]>().notNull(),
    schemaConfig: jsonb("schema_config").notNull(),

    latencyMsMin: integer("latency_ms_min"),
    latencyMsMax: integer("latency_ms_max"),
    statusRoulette: jsonb("status_roulette").$type<Record<string, number>>(),

    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("guest_endpoints_token_path").on(t.guestToken, t.pathNormalized),
  ]
);

export const webhookLogs = pgTable("webhook_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  hookToken: text("hook_token").notNull(),
  method: text("method").notNull(),
  path: text("path"),
  headers: jsonb("headers").$type<Record<string, string>>(),
  body: text("body"),
  ip: text("ip"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
