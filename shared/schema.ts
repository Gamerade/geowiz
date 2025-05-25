import { pgTable, text, serial, integer, boolean, timestamp, json, varchar, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: json("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Game questions table
export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  mode: text("mode").notNull(), // 'mispronounced-capitals', 'multiple-capitals', etc.
  region: text("region").notNull(), // 'global', 'europe', 'asia', etc.
  questionText: text("question_text").notNull(),
  hint: text("hint"),
  answer: text("answer").notNull(),
  alternativeAnswers: json("alternative_answers").$type<string[]>().default([]),
  funFact: text("fun_fact").notNull(),
  difficulty: integer("difficulty").notNull().default(1), // 1-5 scale
  visualType: text("visual_type"), // 'flag', 'outline', 'audio', 'text'
  visualUrl: text("visual_url"), // URL to flag/map image
});

// Game sessions table
export const gameSessions = pgTable("game_sessions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  mode: text("mode").notNull(),
  region: text("region").notNull(),
  score: integer("score").notNull().default(0),
  questionsAnswered: integer("questions_answered").notNull().default(0),
  correctAnswers: integer("correct_answers").notNull().default(0),
  currentStreak: integer("current_streak").notNull().default(0),
  maxStreak: integer("max_streak").notNull().default(0),
  isCompleted: boolean("is_completed").notNull().default(false),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
});

// Game answers table to track individual question responses
export const gameAnswers = pgTable("game_answers", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull().references(() => gameSessions.id),
  questionId: integer("question_id").notNull().references(() => questions.id),
  userAnswer: text("user_answer").notNull(),
  isCorrect: boolean("is_correct").notNull(),
  timeSpent: integer("time_spent"), // in seconds
  answeredAt: timestamp("answered_at").notNull().defaultNow(),
});

// User achievements table
export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  achievementType: text("achievement_type").notNull(), // 'flag_master', 'world_explorer', etc.
  unlockedAt: timestamp("unlocked_at").notNull().defaultNow(),
});

// Insert schemas
export const insertQuestionSchema = createInsertSchema(questions).omit({ id: true });
export const insertGameSessionSchema = createInsertSchema(gameSessions).omit({ 
  id: true, 
  startedAt: true, 
  completedAt: true 
});
export const insertGameAnswerSchema = createInsertSchema(gameAnswers).omit({ 
  id: true, 
  answeredAt: true 
});
export const insertAchievementSchema = createInsertSchema(achievements).omit({ 
  id: true, 
  unlockedAt: true 
});

// User types for Replit Auth
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export type Question = typeof questions.$inferSelect;
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;

export type GameSession = typeof gameSessions.$inferSelect;
export type InsertGameSession = z.infer<typeof insertGameSessionSchema>;

export type GameAnswer = typeof gameAnswers.$inferSelect;
export type InsertGameAnswer = z.infer<typeof insertGameAnswerSchema>;

export type Achievement = typeof achievements.$inferSelect;
export type InsertAchievement = z.infer<typeof insertAchievementSchema>;

// Game mode and region enums
export const GameModes = [
  "mispronounced-capitals",
  "multiple-capitals", 
  "hidden-outlines",
  "flag-quirks",
  "mystery-mix",
  "custom"
] as const;

export const Regions = [
  "global",
  "europe",
  "asia", 
  "africa",
  "north-america",
  "south-america",
  "oceania",
  "custom"
] as const;

export type GameMode = typeof GameModes[number];
export type Region = typeof Regions[number];
