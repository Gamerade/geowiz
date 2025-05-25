import {
  users,
  questions,
  gameSessions,
  gameAnswers,
  achievements,
  type User,
  type UpsertUser,
  type Question,
  type InsertQuestion,
  type GameSession,
  type InsertGameSession,
  type GameAnswer,
  type InsertGameAnswer,
  type Achievement,
  type InsertAchievement,
  type GameMode,
  type Region
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Question operations
  getQuestionsByMode(mode: GameMode, region: Region, limit?: number): Promise<Question[]>;
  getQuestion(id: number): Promise<Question | undefined>;
  createQuestion(question: InsertQuestion): Promise<Question>;

  // Game session operations
  createGameSession(session: InsertGameSession): Promise<GameSession>;
  getGameSession(id: number): Promise<GameSession | undefined>;
  updateGameSession(id: number, updates: Partial<GameSession>): Promise<GameSession | undefined>;
  getUserGameSessions(userId: string): Promise<GameSession[]>;

  // Game answer operations
  createGameAnswer(answer: InsertGameAnswer): Promise<GameAnswer>;
  getSessionAnswers(sessionId: number): Promise<GameAnswer[]>;

  // Achievement operations
  getUserAchievements(userId: string): Promise<Achievement[]>;
  createAchievement(achievement: InsertAchievement): Promise<Achievement>;

  // Leaderboard operations
  getLeaderboard(limit?: number): Promise<{ user: User; totalScore: number; rank: number }[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Question operations
  async getQuestionsByMode(mode: GameMode, region: Region, limit: number = 10): Promise<Question[]> {
    const questions = await db.select().from(questions);
    const filteredQuestions = questions.filter(q => {
      const modeMatch = q.mode === mode;
      const regionMatch = region === "global" || q.region === region || q.region === "global";
      return modeMatch && regionMatch;
    });

    // Shuffle and limit
    const shuffled = filteredQuestions.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, limit);
  }

  async getQuestion(id: number): Promise<Question | undefined> {
    const [question] = await db.select().from(questions).where(eq(questions.id, id));
    return question;
  }

  async createQuestion(insertQuestion: InsertQuestion): Promise<Question> {
    const [question] = await db
      .insert(questions)
      .values(insertQuestion)
      .returning();
    return question;
  }

  // Game session operations
  async createGameSession(insertSession: InsertGameSession): Promise<GameSession> {
    const [session] = await db
      .insert(gameSessions)
      .values(insertSession)
      .returning();
    return session;
  }

  async getGameSession(id: number): Promise<GameSession | undefined> {
    const [session] = await db.select().from(gameSessions).where(eq(gameSessions.id, id));
    return session;
  }

  async updateGameSession(id: number, updates: Partial<GameSession>): Promise<GameSession | undefined> {
    const [session] = await db
      .update(gameSessions)
      .set(updates)
      .where(eq(gameSessions.id, id))
      .returning();
    return session;
  }

  async getUserGameSessions(userId: string): Promise<GameSession[]> {
    return await db.select().from(gameSessions).where(eq(gameSessions.userId, userId));
  }

  // Game answer operations
  async createGameAnswer(insertAnswer: InsertGameAnswer): Promise<GameAnswer> {
    const [answer] = await db
      .insert(gameAnswers)
      .values(insertAnswer)
      .returning();
    return answer;
  }

  async getSessionAnswers(sessionId: number): Promise<GameAnswer[]> {
    return await db.select().from(gameAnswers).where(eq(gameAnswers.sessionId, sessionId));
  }

  // Achievement operations
  async getUserAchievements(userId: string): Promise<Achievement[]> {
    return await db.select().from(achievements).where(eq(achievements.userId, userId));
  }

  async createAchievement(insertAchievement: InsertAchievement): Promise<Achievement> {
    const [achievement] = await db
      .insert(achievements)
      .values(insertAchievement)
      .returning();
    return achievement;
  }

  // Leaderboard operations
  async getLeaderboard(limit: number = 10): Promise<{ user: User; totalScore: number; rank: number }[]> {
    // This would need a more complex SQL query in a real implementation
    const sessions = await db.select().from(gameSessions);
    const userScores = new Map<string, number>();
    
    // Calculate total scores for each user
    for (const session of sessions) {
      if (session.userId && session.isCompleted) {
        const current = userScores.get(session.userId) || 0;
        userScores.set(session.userId, current + session.score);
      }
    }

    // Get users and create leaderboard
    const allUsers = await db.select().from(users);
    const leaderboard = Array.from(userScores.entries())
      .map(([userId, totalScore]) => ({
        user: allUsers.find(u => u.id === userId)!,
        totalScore,
        rank: 0
      }))
      .filter(entry => entry.user) // Remove entries where user doesn't exist
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, limit);

    // Assign ranks
    leaderboard.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    return leaderboard;
  }
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private questions: Map<number, Question>;
  private gameSessions: Map<number, GameSession>;
  private gameAnswers: Map<number, GameAnswer>;
  private achievements: Map<number, Achievement>;
  private currentQuestionId: number;
  private currentSessionId: number;
  private currentAnswerId: number;
  private currentAchievementId: number;

  constructor() {
    this.users = new Map();
    this.questions = new Map();
    this.gameSessions = new Map();
    this.gameAnswers = new Map();
    this.achievements = new Map();
    this.currentQuestionId = 1;
    this.currentSessionId = 1;
    this.currentAnswerId = 1;
    this.currentAchievementId = 1;
    
    // Initialize with sample questions
    this.initializeSampleQuestions();
  }

  private initializeSampleQuestions() {
    const sampleQuestions: InsertQuestion[] = [
      // Mispronounced Capitals
      {
        mode: "mispronounced-capitals",
        region: "global",
        questionText: "What is the capital of Slovenia that many people mispronounce?",
        hint: "It's not 'Lube-liana' - there's a 'j' sound in there!",
        answer: "ljubljana",
        alternativeAnswers: ["lyublyana", "ljubjana"],
        funFact: "Ljubljana's name comes from the Slavic word 'Ljubljena,' meaning 'beloved.' The city is also known for its dragon symbol!",
        difficulty: 3,
        visualType: "text"
      },
      {
        mode: "mispronounced-capitals",
        region: "global",
        questionText: "What is the capital of Kyrgyzstan that's often mispronounced?",
        hint: "It sounds like 'Bish-kek', not 'Bis-kek'",
        answer: "bishkek",
        alternativeAnswers: ["bischkek"],
        funFact: "Bishkek was called Pishpek until 1926, then Frunze until 1991, when it returned to a name similar to its original!",
        difficulty: 4,
        visualType: "text"
      },
      // Flag Quirks
      {
        mode: "flag-quirks",
        region: "global",
        questionText: "Which country has a flag featuring an AK-47 rifle?",
        hint: "This African nation's flag also features a book and a hoe.",
        answer: "mozambique",
        alternativeAnswers: [],
        funFact: "Mozambique's flag is the only national flag to feature a modern assault rifle. The AK-47 represents defense and vigilance, while the book symbolizes education and the hoe represents agriculture.",
        difficulty: 3,
        visualType: "flag",
        visualUrl: "https://flagcdn.com/w320/mz.png"
      },
      {
        mode: "flag-quirks",
        region: "global",
        questionText: "Which country's flag changes design depending on whether it's war or peace time?",
        hint: "This South Asian kingdom has two different flag versions.",
        answer: "afghanistan",
        alternativeAnswers: [],
        funFact: "Afghanistan's flag has changed more than any other country's flag, with 26 different designs since 1901. The current design was adopted in 2021.",
        difficulty: 4,
        visualType: "flag",
        visualUrl: "https://flagcdn.com/w320/af.png"
      },
      // Multiple Capitals
      {
        mode: "multiple-capitals",
        region: "global",
        questionText: "Which country has three capitals: Cape Town, Pretoria, and Bloemfontein?",
        hint: "This African nation is famous for its wildlife and Nelson Mandela.",
        answer: "south africa",
        alternativeAnswers: [],
        funFact: "South Africa is the only country with three capitals: Cape Town (legislative), Pretoria (executive), and Bloemfontein (judicial). This arrangement was created to distribute power among different regions.",
        difficulty: 2,
        visualType: "text"
      },
      {
        mode: "multiple-capitals",
        region: "global",
        questionText: "Which country has both Amsterdam as its constitutional capital and The Hague as its seat of government?",
        hint: "This European country is famous for its tulips and windmills.",
        answer: "netherlands",
        alternativeAnswers: ["holland"],
        funFact: "The Netherlands has Amsterdam as its official capital, but The Hague is where the government, parliament, and Supreme Court are located. The royal family also lives in The Hague.",
        difficulty: 2,
        visualType: "text"
      },
      // Hidden Outlines
      {
        mode: "hidden-outlines",
        region: "global",
        questionText: "Can you identify this country from its distinctive boot shape?",
        hint: "This Mediterranean country is famous for pasta and pizza.",
        answer: "italy",
        alternativeAnswers: [],
        funFact: "Italy's distinctive boot shape is instantly recognizable on maps. The 'heel' of the boot is the region of Puglia, while the 'toe' is Calabria.",
        difficulty: 1,
        visualType: "outline",
        visualUrl: "https://www.countryflags.io/it/shiny/64.png"
      },
      {
        mode: "hidden-outlines",
        region: "global",
        questionText: "Which country has this distinctive elongated shape along South America's western coast?",
        hint: "This country is over 4,300 km long but averages only 180 km wide.",
        answer: "chile",
        alternativeAnswers: [],
        funFact: "Chile is the world's longest country, stretching over 4,300 kilometers from north to south, but averaging only 180 kilometers in width. It spans 38 degrees of latitude!",
        difficulty: 2,
        visualType: "outline",
        visualUrl: "https://www.countryflags.io/cl/shiny/64.png"
      },
      // Mystery Mix
      {
        mode: "mystery-mix",
        region: "global",
        questionText: "Which microstate is completely surrounded by Rome?",
        hint: "This tiny country is the spiritual center of the Catholic Church.",
        answer: "vatican city",
        alternativeAnswers: ["vatican"],
        funFact: "Vatican City is the smallest country in the world at just 0.17 square miles (0.44 square kilometers). You could walk across the entire country in about 20 minutes!",
        difficulty: 2,
        visualType: "text"
      },
      {
        mode: "mystery-mix",
        region: "global",
        questionText: "Which country has the highest capital city in the world?",
        hint: "This South American country's administrative capital sits at over 3,500 meters above sea level.",
        answer: "bolivia",
        alternativeAnswers: [],
        funFact: "La Paz, Bolivia's administrative capital, sits at 3,515 meters (11,532 feet) above sea level, making it the highest capital city in the world. The thin air can leave visitors breathless!",
        difficulty: 3,
        visualType: "text"
      }
    ];

    sampleQuestions.forEach(q => this.createQuestion(q));
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getQuestionsByMode(mode: GameMode, region: Region, limit: number = 10): Promise<Question[]> {
    const filteredQuestions = Array.from(this.questions.values()).filter(q => {
      const modeMatch = q.mode === mode;
      const regionMatch = region === "global" || q.region === region || q.region === "global";
      return modeMatch && regionMatch;
    });

    // Shuffle and limit
    const shuffled = filteredQuestions.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, limit);
  }

  async getQuestion(id: number): Promise<Question | undefined> {
    return this.questions.get(id);
  }

  async createQuestion(insertQuestion: InsertQuestion): Promise<Question> {
    const id = this.currentQuestionId++;
    const question: Question = { ...insertQuestion, id };
    this.questions.set(id, question);
    return question;
  }

  async createGameSession(insertSession: InsertGameSession): Promise<GameSession> {
    const id = this.currentSessionId++;
    const session: GameSession = { 
      ...insertSession, 
      id,
      startedAt: new Date(),
      completedAt: null
    };
    this.gameSessions.set(id, session);
    return session;
  }

  async getGameSession(id: number): Promise<GameSession | undefined> {
    return this.gameSessions.get(id);
  }

  async updateGameSession(id: number, updates: Partial<GameSession>): Promise<GameSession | undefined> {
    const session = this.gameSessions.get(id);
    if (!session) return undefined;

    const updatedSession = { ...session, ...updates };
    this.gameSessions.set(id, updatedSession);
    return updatedSession;
  }

  async getUserGameSessions(userId: number): Promise<GameSession[]> {
    return Array.from(this.gameSessions.values()).filter(s => s.userId === userId);
  }

  async createGameAnswer(insertAnswer: InsertGameAnswer): Promise<GameAnswer> {
    const id = this.currentAnswerId++;
    const answer: GameAnswer = { 
      ...insertAnswer, 
      id,
      answeredAt: new Date()
    };
    this.gameAnswers.set(id, answer);
    return answer;
  }

  async getSessionAnswers(sessionId: number): Promise<GameAnswer[]> {
    return Array.from(this.gameAnswers.values()).filter(a => a.sessionId === sessionId);
  }

  async getUserAchievements(userId: number): Promise<Achievement[]> {
    return Array.from(this.achievements.values()).filter(a => a.userId === userId);
  }

  async createAchievement(insertAchievement: InsertAchievement): Promise<Achievement> {
    const id = this.currentAchievementId++;
    const achievement: Achievement = { 
      ...insertAchievement, 
      id,
      unlockedAt: new Date()
    };
    this.achievements.set(id, achievement);
    return achievement;
  }

  async getLeaderboard(limit: number = 10): Promise<{ user: User; totalScore: number; rank: number }[]> {
    const userScores = new Map<number, number>();
    
    // Calculate total scores for each user
    for (const session of this.gameSessions.values()) {
      if (session.userId && session.isCompleted) {
        const current = userScores.get(session.userId) || 0;
        userScores.set(session.userId, current + session.score);
      }
    }

    // Create leaderboard entries
    const leaderboard = Array.from(userScores.entries())
      .map(([userId, totalScore]) => ({
        user: this.users.get(userId)!,
        totalScore,
        rank: 0
      }))
      .filter(entry => entry.user) // Remove entries where user doesn't exist
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, limit);

    // Assign ranks
    leaderboard.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    return leaderboard;
  }
}

export const storage = new DatabaseStorage();
