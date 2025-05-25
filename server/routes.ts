import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertGameSessionSchema, insertGameAnswerSchema, type GameMode, type Region } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Get questions for a specific game mode and region
  app.get("/api/questions/:mode/:region", async (req, res) => {
    try {
      const { mode, region } = req.params;
      const limit = parseInt(req.query.limit as string) || 10;
      
      const questions = await storage.getQuestionsByMode(mode as GameMode, region as Region, limit);
      res.json(questions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch questions" });
    }
  });

  // Create a new game session
  app.post("/api/sessions", async (req, res) => {
    try {
      const sessionData = insertGameSessionSchema.parse(req.body);
      const session = await storage.createGameSession(sessionData);
      res.json(session);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid session data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create session" });
      }
    }
  });

  // Get a specific game session
  app.get("/api/sessions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const session = await storage.getGameSession(id);
      
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      
      res.json(session);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch session" });
    }
  });

  // Update a game session
  app.patch("/api/sessions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      
      const session = await storage.updateGameSession(id, updates);
      
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      
      res.json(session);
    } catch (error) {
      res.status(500).json({ message: "Failed to update session" });
    }
  });

  // Submit an answer for a question
  app.post("/api/answers", async (req, res) => {
    try {
      const answerData = insertGameAnswerSchema.parse(req.body);
      
      // Get the question to check if answer is correct
      const question = await storage.getQuestion(answerData.questionId);
      if (!question) {
        return res.status(404).json({ message: "Question not found" });
      }

      // Check if answer is correct
      const userAnswer = answerData.userAnswer.toLowerCase().trim();
      const correctAnswer = question.answer.toLowerCase();
      const alternativeAnswers = question.alternativeAnswers?.map(alt => alt.toLowerCase()) || [];
      
      const isCorrect = userAnswer === correctAnswer || alternativeAnswers.includes(userAnswer);

      const answer = await storage.createGameAnswer({
        ...answerData,
        isCorrect
      });

      // Update session stats
      const session = await storage.getGameSession(answerData.sessionId);
      if (session) {
        const newQuestionsAnswered = session.questionsAnswered + 1;
        const newCorrectAnswers = session.correctAnswers + (isCorrect ? 1 : 0);
        const newCurrentStreak = isCorrect ? session.currentStreak + 1 : 0;
        const newMaxStreak = Math.max(session.maxStreak, newCurrentStreak);
        const scoreIncrement = isCorrect ? (100 + session.currentStreak * 10) : 0;
        const newScore = session.score + scoreIncrement;

        await storage.updateGameSession(answerData.sessionId, {
          questionsAnswered: newQuestionsAnswered,
          correctAnswers: newCorrectAnswers,
          currentStreak: newCurrentStreak,
          maxStreak: newMaxStreak,
          score: newScore
        });
      }

      res.json({
        ...answer,
        question,
        scoreEarned: isCorrect ? (100 + (session?.currentStreak || 0) * 10) : 0
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid answer data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to submit answer" });
      }
    }
  });

  // Complete a game session
  app.post("/api/sessions/:id/complete", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      const session = await storage.updateGameSession(id, {
        isCompleted: true,
        completedAt: new Date()
      });

      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }

      res.json(session);
    } catch (error) {
      res.status(500).json({ message: "Failed to complete session" });
    }
  });

  // Get user's game sessions
  app.get("/api/users/:userId/sessions", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const sessions = await storage.getUserGameSessions(userId);
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user sessions" });
    }
  });

  // Get leaderboard
  app.get("/api/leaderboard", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const leaderboard = await storage.getLeaderboard(limit);
      res.json(leaderboard);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch leaderboard" });
    }
  });

  // Get user achievements
  app.get("/api/users/:userId/achievements", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const achievements = await storage.getUserAchievements(userId);
      res.json(achievements);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch achievements" });
    }
  });

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  const httpServer = createServer(app);
  return httpServer;
}
