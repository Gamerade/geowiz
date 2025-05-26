import {
  users,
  questions,
  gameSessions,
  gameAnswers,
  achievements,
  learningProgress,
  learningRecommendations,
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
  type LearningProgress,
  type InsertLearningProgress,
  type LearningRecommendation,
  type InsertLearningRecommendation,
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

  // Update the initializeSampleQuestions method in your MemStorage class
  // This shows the corrected region assignments for your questions

  private initializeSampleQuestions() {
    const sampleQuestions: InsertQuestion[] = [
      // GLOBAL Standard Capitals (keep these as global)
      {
        mode: "capitals",
        region: "global",
        questionText: "What is the capital of Australia?",
        hint: "This city is located in the Australian Capital Territory.",
        answer: "canberra",
        alternativeAnswers: [],
        funFact: "Canberra was specifically designed and built to be Australia's capital city, chosen as a compromise between Sydney and Melbourne.",
        difficulty: 2,
        visualType: "text"
      },
      {
        mode: "capitals",
        region: "global",
        questionText: "What is the capital of Brazil?",
        hint: "This planned city was built in the 1950s in the country's interior.",
        answer: "brasilia",
        alternativeAnswers: ["brasília"],
        funFact: "Brasília was designed by architect Oscar Niemeyer and urban planner Lúcio Costa, and was built in just 41 months!",
        difficulty: 2,
        visualType: "text"
      },
      {
        mode: "capitals",
        region: "americas", // Changed from global - Canada is in Americas
        questionText: "What is the capital of Canada?",
        hint: "This city is located in Ontario, on the border with Quebec.",
        answer: "ottawa",
        alternativeAnswers: [],
        funFact: "Ottawa was chosen as Canada's capital by Queen Victoria in 1857, partly because it was less likely to be attacked by the United States!",
        difficulty: 1,
        visualType: "text"
      },
      {
        mode: "capitals",
        region: "asia", // Changed from global - Japan is in Asia
        questionText: "What is the capital of Japan?",
        hint: "This city was formerly known as Edo.",
        answer: "tokyo",
        alternativeAnswers: ["tōkyō"],
        funFact: "Tokyo became Japan's capital in 1868 when Emperor Meiji moved from Kyoto. The name means 'Eastern Capital.'",
        difficulty: 1,
        visualType: "text"
      },
      {
        mode: "capitals",
        region: "asia", // Changed from global - South Korea is in Asia
        questionText: "What is the capital of South Korea?",
        hint: "This city has been the capital for over 600 years.",
        answer: "seoul",
        alternativeAnswers: [],
        funFact: "Seoul has been South Korea's capital for over 600 years and is home to nearly 10 million people, making it one of the world's largest cities.",
        difficulty: 1,
        visualType: "text"
      },
      {
        mode: "capitals",
        region: "africa", // Changed from global - Morocco is in Africa
        questionText: "What is the capital of Morocco?",
        hint: "This coastal city is known for its red walls and historic medina.",
        answer: "rabat",
        alternativeAnswers: [],
        funFact: "Rabat became Morocco's capital in 1912. Many people think it's Casablanca or Marrakech, but this quieter city has been the political center for over a century.",
        difficulty: 3,
        visualType: "text"
      },
      {
        mode: "capitals",
        region: "oceania", // Changed from global - New Zealand is in Oceania
        questionText: "What is the capital of New Zealand?",
        hint: "This city is located on the North Island and is known for its harbor.",
        answer: "wellington",
        alternativeAnswers: [],
        funFact: "Wellington is one of the windiest cities in the world and is often called the 'Windy City.' It's also the southernmost capital city in the world.",
        difficulty: 2,
        visualType: "text"
      },
      {
        mode: "capitals",
        region: "asia", // Changed from global - Kazakhstan is in Asia
        questionText: "What is the capital of Kazakhstan?",
        hint: "This city was renamed in 2019 to honor the former president.",
        answer: "nur-sultan",
        alternativeAnswers: ["nursultan", "astana"],
        funFact: "The capital was moved from Almaty to Astana in 1997, then renamed Nur-Sultan in 2019. It's one of the newest capital cities in the world.",
        difficulty: 4,
        visualType: "text"
      },
      {
        mode: "capitals",
        region: "africa", // Changed from global - Nigeria is in Africa
        questionText: "What is the capital of Nigeria?",
        hint: "This planned city replaced Lagos as the capital in 1991.",
        answer: "abuja",
        alternativeAnswers: [],
        funFact: "Abuja was chosen as Nigeria's capital because of its central location and was specifically designed to be ethnically neutral for the diverse country.",
        difficulty: 3,
        visualType: "text"
      },
      {
        mode: "capitals",
        region: "asia", // Changed from global - Myanmar is in Asia
        questionText: "What is the capital of Myanmar?",
        hint: "This city replaced Yangon as the capital in 2006.",
        answer: "naypyidaw",
        alternativeAnswers: ["nay pyi taw"],
        funFact: "Naypyidaw was built from scratch starting in 2002 and became Myanmar's capital in 2006. It's known for its wide, empty streets and government buildings.",
        difficulty: 4,
        visualType: "text"
      },

      // Capital Cities - Europe (these are already correctly tagged)
      {
        mode: "capitals",
        region: "europe",
        questionText: "What is the capital of Estonia?",
        hint: "This medieval city is known for its well-preserved Old Town.",
        answer: "tallinn",
        alternativeAnswers: [],
        funFact: "Tallinn's Old Town is a UNESCO World Heritage site and one of the best-preserved medieval cities in Europe.",
        difficulty: 3,
        visualType: "text"
      },
      {
        mode: "capitals",
        region: "europe",
        questionText: "What is the capital of Slovenia?",
        hint: "This city is home to the famous Triple Bridge.",
        answer: "ljubljana",
        alternativeAnswers: [],
        funFact: "Ljubljana was the European Capital of Culture in 2008 and is known for its green initiatives.",
        difficulty: 3,
        visualType: "text"
      },
      {
        mode: "capitals",
        region: "europe",
        questionText: "What is the capital of Croatia?",
        hint: "This city is known for its red-tiled roofs and medieval Upper Town.",
        answer: "zagreb",
        alternativeAnswers: [],
        funFact: "Zagreb's Upper Town (Gornji Grad) is connected to the Lower Town by the world's shortest funicular railway.",
        difficulty: 2,
        visualType: "text"
      },
      {
        mode: "capitals",
        region: "europe",
        questionText: "What is the capital of Latvia?",
        hint: "This city is famous for its Art Nouveau architecture.",
        answer: "riga",
        alternativeAnswers: [],
        funFact: "Riga has the largest collection of Art Nouveau buildings in the world, with over 800 buildings in this architectural style.",
        difficulty: 3,
        visualType: "text"
      },
      {
        mode: "capitals",
        region: "europe",
        questionText: "What is the capital of Lithuania?",
        hint: "This city has one of the largest surviving medieval Old Towns in Northern Europe.",
        answer: "vilnius",
        alternativeAnswers: [],
        funFact: "Vilnius was designated as a European Capital of Culture in 2009 and is known for its baroque architecture.",
        difficulty: 3,
        visualType: "text"
      },

      // Add more regional questions for other regions
      // Capital Cities - Asia
      {
        mode: "capitals",
        region: "asia",
        questionText: "What is the capital of Thailand?",
        hint: "This city's full ceremonial name is the longest city name in the world.",
        answer: "bangkok",
        alternativeAnswers: ["krung thep"],
        funFact: "Bangkok's full ceremonial name has 169 letters and is listed in the Guinness Book of Records as the world's longest place name!",
        difficulty: 1,
        visualType: "text"
      },
      {
        mode: "capitals",
        region: "asia",
        questionText: "What is the capital of Vietnam?",
        hint: "This city was formerly known as Saigon during French colonial rule.",
        answer: "hanoi",
        alternativeAnswers: [],
        funFact: "Hanoi has been the capital of Vietnam for over 1000 years, with brief interruptions. The name means 'City inside rivers'.",
        difficulty: 2,
        visualType: "text"
      },

      // Capital Cities - Americas
      {
        mode: "capitals",
        region: "americas",
        questionText: "What is the capital of Argentina?",
        hint: "This city is famous for tango dancing and colorful La Boca neighborhood.",
        answer: "buenos aires",
        alternativeAnswers: [],
        funFact: "Buenos Aires is often called the 'Paris of South America' due to its European-influenced architecture and culture.",
        difficulty: 1,
        visualType: "text"
      },
      {
        mode: "capitals",
        region: "americas",
        questionText: "What is the capital of Chile?",
        hint: "This city sits in a valley surrounded by the Andes mountains.",
        answer: "santiago",
        alternativeAnswers: [],
        funFact: "Santiago is one of the largest cities in South America and you can ski in the nearby Andes and visit Pacific beaches on the same day!",
        difficulty: 2,
        visualType: "text"
      },

      // Capital Cities - Africa
      {
        mode: "capitals",
        region: "africa",
        questionText: "What is the capital of Kenya?",
        hint: "This city's name means 'cool water' in Maasai.",
        answer: "nairobi",
        alternativeAnswers: [],
        funFact: "Nairobi is the only capital city in the world with a national park within its boundaries - you can see lions with skyscrapers in the background!",
        difficulty: 2,
        visualType: "text"
      },
      {
        mode: "capitals",
        region: "africa",
        questionText: "What is the capital of Egypt?",
        hint: "This city is the largest in the Middle East and Africa.",
        answer: "cairo",
        alternativeAnswers: ["al-qahirah"],
        funFact: "Cairo is known as 'The City of a Thousand Minarets' for its abundance of Islamic architecture. The nearby pyramids are over 4,500 years old!",
        difficulty: 1,
        visualType: "text"
      },

      // Capital Cities - Oceania
      {
        mode: "capitals",
        region: "oceania",
        questionText: "What is the capital of Fiji?",
        hint: "This city is located on the island of Viti Levu.",
        answer: "suva",
        alternativeAnswers: [],
        funFact: "Suva is the largest city in the South Pacific outside of Australia and New Zealand, and is known for its colonial architecture.",
        difficulty: 3,
        visualType: "text"
      },

      // Continue with other game modes, ensuring proper regional tagging...

      // Hidden Outlines - Europe (already correctly tagged)
      {
        mode: "hidden-outlines",
        region: "europe",
        questionText: "Which European country has this distinctive boot shape?",
        hint: "This Mediterranean country is famous for pasta, pizza, and the Roman Empire.",
        answer: "italy",
        alternativeAnswers: [],
        funFact: "Italy's distinctive boot shape is one of the most recognizable country outlines in the world. The 'boot' appears to be kicking the island of Sicily!",
        difficulty: 1,
        visualType: "outline"
      },

      // Hidden Outlines - Asia
      {
        mode: "hidden-outlines",
        region: "asia",
        questionText: "Which Asian country looks like a sideways 'S' shape?",
        hint: "This Southeast Asian country is shaped like a dragon and famous for pho.",
        answer: "vietnam",
        alternativeAnswers: [],
        funFact: "Vietnam's distinctive S-shaped coastline stretches over 3,200 kilometers along the South China Sea, giving it a unique serpentine appearance on maps.",
        difficulty: 2,
        visualType: "outline"
      },

      // Hidden Outlines - Americas
      {
        mode: "hidden-outlines",
        region: "americas",
        questionText: "Which country has this distinctive elongated shape along South America's western coast?",
        hint: "This country is over 4,300 km long but averages only 180 km wide.",
        answer: "chile",
        alternativeAnswers: [],
        funFact: "Chile is the world's longest country, stretching over 4,300 kilometers from north to south, but averaging only 180 kilometers in width. It spans 38 degrees of latitude!",
        difficulty: 2,
        visualType: "outline"
      },

      // Continue updating all questions with proper regional tags...
      // Make sure each question's region matches where the country is actually located
    ];

    // Continue with the rest of the initialization code...
    sampleQuestions.forEach(q => {
      const question: Question = { 
        ...q, 
        id: this.currentQuestionId++,
        hint: q.hint || null,
        alternativeAnswers: q.alternativeAnswers || null,
        visualType: q.visualType || null,
        visualUrl: q.visualUrl || null
      };
      this.questions.set(question.id, question);
    });
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
    console.log(`Looking for questions: mode=${mode}, region=${region}`);
    console.log(`Total questions available: ${this.questions.size}`);
    console.log(`Available modes:`, Array.from(this.questions.values()).map(q => q.mode));
    
    const filteredQuestions = Array.from(this.questions.values()).filter(q => {
      const modeMatch = q.mode === mode;
      const regionMatch = region === "global" || q.region === region || q.region === "global";
      console.log(`Question ${q.id}: mode=${q.mode}, region=${q.region}, modeMatch=${modeMatch}, regionMatch=${regionMatch}`);
      return modeMatch && regionMatch;
    });

    console.log(`Filtered questions found: ${filteredQuestions.length}`);
    
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

export const storage = new MemStorage();
