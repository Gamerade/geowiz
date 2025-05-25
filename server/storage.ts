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
      // Mispronounced Capitals (10 questions)
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
      {
        mode: "mispronounced-capitals",
        region: "global",
        questionText: "What is the capital of Qatar that's commonly mispronounced?",
        hint: "It's 'Doh-ha', not 'Do-ha'",
        answer: "doha",
        alternativeAnswers: ["dohha"],
        funFact: "Doha means 'the big tree' in Arabic and is home to over 80% of Qatar's population!",
        difficulty: 2,
        visualType: "text"
      },
      {
        mode: "mispronounced-capitals",
        region: "global",
        questionText: "What is the capital of Uruguay that people often struggle to pronounce?",
        hint: "It's 'Mon-te-vi-DAY-o', with emphasis on the last syllable",
        answer: "montevideo",
        alternativeAnswers: ["montevidayo"],
        funFact: "Montevideo was named after Monte VI De Oriente, meaning 'I saw the sixth mountain from the east'!",
        difficulty: 3,
        visualType: "text"
      },
      {
        mode: "mispronounced-capitals",
        region: "global",
        questionText: "What is the capital of Azerbaijan that's frequently mispronounced?",
        hint: "It's 'Ba-KOO', not 'Ba-KU'",
        answer: "baku",
        alternativeAnswers: ["bakoo"],
        funFact: "Baku is known as the 'City of Winds' and has been producing oil for over 1,000 years!",
        difficulty: 3,
        visualType: "text"
      },
      {
        mode: "mispronounced-capitals",
        region: "global",
        questionText: "What is the capital of Myanmar that many mispronounce?",
        hint: "It's 'Nay-pyi-DAW', not 'Nay-pee-do'",
        answer: "naypyidaw",
        alternativeAnswers: ["naypyitaw", "naypyido"],
        funFact: "Naypyidaw was built from scratch in 2005 and is one of the world's largest capital cities by area!",
        difficulty: 5,
        visualType: "text"
      },
      {
        mode: "mispronounced-capitals",
        region: "global",
        questionText: "What is the capital of Djibouti that shares its name with the country?",
        hint: "It's 'ji-BOO-tee', not 'Dji-bow-ti'",
        answer: "djibouti",
        alternativeAnswers: ["jibouti"],
        funFact: "Djibouti City is strategically located at the entrance to the Red Sea and serves as a major shipping hub!",
        difficulty: 4,
        visualType: "text"
      },
      {
        mode: "mispronounced-capitals",
        region: "global",
        questionText: "What is the capital of Laos that's often mispronounced?",
        hint: "It's 'Vi-en-CHAN', not 'Vi-en-tiane'",
        answer: "vientiane",
        alternativeAnswers: ["vienchan"],
        funFact: "Vientiane means 'city of sandalwood' and is one of the most laid-back capital cities in Asia!",
        difficulty: 4,
        visualType: "text"
      },
      {
        mode: "mispronounced-capitals",
        region: "global",
        questionText: "What is the capital of Burkina Faso that people often mispronounce?",
        hint: "It's 'Wa-ga-DOO-goo', not 'Ou-ga-dou-gou'",
        answer: "ouagadougou",
        alternativeAnswers: ["wagadougou"],
        funFact: "Ouagadougou means 'where people get honor and respect' and hosts Africa's largest film festival!",
        difficulty: 5,
        visualType: "text"
      },
      {
        mode: "mispronounced-capitals",
        region: "global",
        questionText: "What is the capital of Sri Lanka that's commonly mispronounced?",
        hint: "It's 'Sri JAY-a-war-da-na-POO-ra KOT-te', but you can say 'Ko-tte'",
        answer: "kotte",
        alternativeAnswers: ["sri jayawardenepura kotte", "jayawardenepura"],
        funFact: "The full name is one of the longest capital city names in the world! Most locals just call it Kotte.",
        difficulty: 4,
        visualType: "text"
      },
      // Flag Quirks (10 questions)
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
        questionText: "Which country's flag is the only one that's not rectangular?",
        hint: "This Himalayan kingdom has a unique double-pennant design.",
        answer: "nepal",
        alternativeAnswers: [],
        funFact: "Nepal's flag consists of two triangular pennants representing the Himalayas. The sun and moon symbols represent the hope that Nepal will last as long as these celestial bodies.",
        difficulty: 3,
        visualType: "flag",
        visualUrl: "https://flagcdn.com/w320/np.png"
      },
      {
        mode: "flag-quirks",
        region: "global",
        questionText: "Which country has a flag that's completely different on each side?",
        hint: "This South American nation shows its coat of arms on one side only.",
        answer: "paraguay",
        alternativeAnswers: [],
        funFact: "Paraguay's flag has different emblems on each side - the national coat of arms on the front and the seal of the treasury on the back, making it one of only three flags with different designs on each side.",
        difficulty: 4,
        visualType: "flag",
        visualUrl: "https://flagcdn.com/w320/py.png"
      },
      {
        mode: "flag-quirks",
        region: "global",
        questionText: "Which country's flag features a building (a temple)?",
        hint: "This Southeast Asian kingdom's flag shows Angkor Wat.",
        answer: "cambodia",
        alternativeAnswers: [],
        funFact: "Cambodia's flag is the only national flag in the world to feature a building - the famous Angkor Wat temple complex, which is also a UNESCO World Heritage site.",
        difficulty: 3,
        visualType: "flag",
        visualUrl: "https://flagcdn.com/w320/kh.png"
      },
      {
        mode: "flag-quirks",
        region: "global",
        questionText: "Which country has a flag with the most colors (12 different colors)?",
        hint: "This island nation in the Indian Ocean has a very colorful flag.",
        answer: "belize",
        alternativeAnswers: [],
        funFact: "Belize's flag has 12 different colors, making it the most colorful national flag in the world. It features the national coat of arms on a blue field with red stripes.",
        difficulty: 4,
        visualType: "flag",
        visualUrl: "https://flagcdn.com/w320/bz.png"
      },
      {
        mode: "flag-quirks",
        region: "global",
        questionText: "Which country's flag features a sword?",
        hint: "This Middle Eastern kingdom's flag has Arabic text and a sword underneath.",
        answer: "saudi arabia",
        alternativeAnswers: [],
        funFact: "Saudi Arabia's flag features the Islamic creed and a sword. The green represents Islam, and the flag is never flown at half-mast because the Islamic creed should never be lowered.",
        difficulty: 2,
        visualType: "flag",
        visualUrl: "https://flagcdn.com/w320/sa.png"
      },
      {
        mode: "flag-quirks",
        region: "global",
        questionText: "Which country has a flag that features a tree?",
        hint: "This Middle Eastern nation's flag shows a cedar tree.",
        answer: "lebanon",
        alternativeAnswers: [],
        funFact: "Lebanon's flag features a cedar tree, which has been a symbol of the country for over 3,000 years. The Lebanon cedar is mentioned multiple times in the Bible.",
        difficulty: 2,
        visualType: "flag",
        visualUrl: "https://flagcdn.com/w320/lb.png"
      },
      {
        mode: "flag-quirks",
        region: "global",
        questionText: "Which country's flag changes color when viewed from different angles?",
        hint: "This is actually a trick question - no flag does this!",
        answer: "none",
        alternativeAnswers: ["no country", "trick question"],
        funFact: "This was a trick question! While some flags have metallic elements that might appear to shimmer, no national flag actually changes color when viewed from different angles.",
        difficulty: 3,
        visualType: "text"
      },
      {
        mode: "flag-quirks",
        region: "global",
        questionText: "Which country has a flag featuring a dragon?",
        hint: "This Himalayan kingdom is known as the 'Land of the Thunder Dragon.'",
        answer: "bhutan",
        alternativeAnswers: [],
        funFact: "Bhutan's flag features a white dragon holding jewels, representing the country's name 'Druk Yul' meaning 'Land of the Thunder Dragon.' The dragon represents the protection of the country.",
        difficulty: 3,
        visualType: "flag",
        visualUrl: "https://flagcdn.com/w320/bt.png"
      },
      {
        mode: "flag-quirks",
        region: "global",
        questionText: "Which country's flag is identical to Chad's flag?",
        hint: "This Eastern European nation has the exact same flag design as an African country.",
        answer: "romania",
        alternativeAnswers: [],
        funFact: "Romania and Chad have nearly identical flags, both featuring blue, yellow, and red vertical stripes. Chad adopted its flag in 1959, while Romania has used this design since 1989.",
        difficulty: 4,
        visualType: "flag",
        visualUrl: "https://flagcdn.com/w320/ro.png"
      },
      // Multiple Capitals (10 questions)
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
      {
        mode: "multiple-capitals",
        region: "global",
        questionText: "Which country has La Paz as its administrative capital and Sucre as its constitutional capital?",
        hint: "This South American country is landlocked and famous for its salt flats.",
        answer: "bolivia",
        alternativeAnswers: [],
        funFact: "Bolivia has two capitals: Sucre is the constitutional capital where the Supreme Court sits, while La Paz is the administrative capital housing the government and parliament.",
        difficulty: 3,
        visualType: "text"
      },
      {
        mode: "multiple-capitals",
        region: "global",
        questionText: "Which country considers both Yamoussoukro and Abidjan as capitals?",
        hint: "This West African nation is famous for cocoa production.",
        answer: "ivory coast",
        alternativeAnswers: ["cote d'ivoire"],
        funFact: "Côte d'Ivoire has Yamoussoukro as its political capital since 1983, but Abidjan remains the economic capital and largest city where most government offices are still located.",
        difficulty: 4,
        visualType: "text"
      },
      {
        mode: "multiple-capitals",
        region: "global",
        questionText: "Which country has both Putrajaya and Kuala Lumpur as capitals?",
        hint: "This Southeast Asian nation is known for its twin towers.",
        answer: "malaysia",
        alternativeAnswers: [],
        funFact: "Malaysia has Kuala Lumpur as its largest city and former capital, while Putrajaya serves as the new administrative capital built in the 1990s to house government offices.",
        difficulty: 3,
        visualType: "text"
      },
      {
        mode: "multiple-capitals",
        region: "global",
        questionText: "Which country has both Dodoma and Dar es Salaam functioning as capitals?",
        hint: "This East African nation is home to Mount Kilimanjaro.",
        answer: "tanzania",
        alternativeAnswers: [],
        funFact: "Tanzania officially moved its capital from Dar es Salaam to Dodoma in 1996, but many government functions and embassies remain in Dar es Salaam, creating a dual capital situation.",
        difficulty: 4,
        visualType: "text"
      },
      {
        mode: "multiple-capitals",
        region: "global",
        questionText: "Which country has both Bern as its federal capital and Zurich as its largest city?",
        hint: "This European country is famous for chocolate, watches, and neutrality.",
        answer: "switzerland",
        alternativeAnswers: [],
        funFact: "Switzerland has Bern as its federal capital, but the country operates more like a confederation with Zurich being the economic center and Geneva hosting many international organizations.",
        difficulty: 2,
        visualType: "text"
      },
      {
        mode: "multiple-capitals",
        region: "global",
        questionText: "Which country has both Sri Jayawardenepura Kotte and Colombo as capitals?",
        hint: "This island nation in the Indian Ocean is famous for tea and elephants.",
        answer: "sri lanka",
        alternativeAnswers: [],
        funFact: "Sri Lanka has Sri Jayawardenepura Kotte as its legislative capital while Colombo serves as the commercial capital and largest city. Most people simply refer to the capital as Colombo.",
        difficulty: 4,
        visualType: "text"
      },
      {
        mode: "multiple-capitals",
        region: "global",
        questionText: "Which country has both Lagos and Abuja as major cities, with one being the former capital?",
        hint: "This West African nation is the most populous country in Africa.",
        answer: "nigeria",
        alternativeAnswers: [],
        funFact: "Nigeria moved its capital from Lagos to Abuja in 1991. Lagos remains the commercial capital and largest city, while Abuja serves as the political capital.",
        difficulty: 3,
        visualType: "text"
      },
      {
        mode: "multiple-capitals",
        region: "global",
        questionText: "Which country has both Tel Aviv and Jerusalem claimed as capitals?",
        hint: "This Middle Eastern nation has disputed capital status internationally.",
        answer: "israel",
        alternativeAnswers: [],
        funFact: "Israel considers Jerusalem its capital, but most countries maintain embassies in Tel Aviv due to the disputed status of Jerusalem in international law.",
        difficulty: 3,
        visualType: "text"
      },
      // Hidden Outlines (10 questions)
      {
        mode: "hidden-outlines",
        region: "global",
        questionText: "Can you identify this country from its distinctive boot shape?",
        hint: "This Mediterranean country is famous for pasta and pizza.",
        answer: "italy",
        alternativeAnswers: [],
        funFact: "Italy's distinctive boot shape is instantly recognizable on maps. The 'heel' of the boot is the region of Puglia, while the 'toe' is Calabria.",
        difficulty: 1,
        visualType: "outline"
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
        visualType: "outline"
      },
      {
        mode: "hidden-outlines",
        region: "global",
        questionText: "Which island nation has this distinctive shape in the Mediterranean?",
        hint: "This triangular island is known for Mount Etna and is part of Italy.",
        answer: "sicily",
        alternativeAnswers: [],
        funFact: "Sicily is the largest island in the Mediterranean Sea and has a distinctive triangular shape. Mount Etna, one of the world's most active volcanoes, dominates the eastern part of the island.",
        difficulty: 3,
        visualType: "outline"
      },
      {
        mode: "hidden-outlines",
        region: "global",
        questionText: "Which country resembles an elephant's head facing east?",
        hint: "This West African nation is famous for its gold and cocoa production.",
        answer: "ghana",
        alternativeAnswers: [],
        funFact: "Ghana's outline resembles an elephant's head when viewed on a map, with the Volta region forming the 'trunk' extending eastward into the Atlantic Ocean.",
        difficulty: 4,
        visualType: "outline"
      },
      {
        mode: "hidden-outlines",
        region: "global",
        questionText: "Which country has a distinctive shape that looks like a sitting dog?",
        hint: "This South American country is famous for tango and beef.",
        answer: "argentina",
        alternativeAnswers: [],
        funFact: "Argentina's distinctive shape on the map resembles a sitting dog, with Patagonia forming the 'body' and the northern regions forming the 'head' looking eastward.",
        difficulty: 3,
        visualType: "outline"
      },
      {
        mode: "hidden-outlines",
        region: "global",
        questionText: "Which island looks like a tear drop in the Indian Ocean?",
        hint: "This island nation is known for tea, cinnamon, and beautiful beaches.",
        answer: "sri lanka",
        alternativeAnswers: [],
        funFact: "Sri Lanka's teardrop shape has led to it being called the 'Pearl of the Indian Ocean.' The island was historically known as Ceylon.",
        difficulty: 3,
        visualType: "outline"
      },
      {
        mode: "hidden-outlines",
        region: "global",
        questionText: "Which country looks like a sideways 'S' shape?",
        hint: "This Southeast Asian country is shaped like a dragon and famous for pho.",
        answer: "vietnam",
        alternativeAnswers: [],
        funFact: "Vietnam's distinctive S-shaped coastline stretches over 3,200 kilometers along the South China Sea, giving it a unique serpentine appearance on maps.",
        difficulty: 2,
        visualType: "outline"
      },
      {
        mode: "hidden-outlines",
        region: "global",
        questionText: "Which European country resembles a fish swimming westward?",
        hint: "This Nordic country is famous for fjords and the Northern Lights.",
        answer: "norway",
        alternativeAnswers: [],
        funFact: "Norway's distinctive shape with its many fjords and elongated coastline resembles a fish swimming toward the Atlantic Ocean, with the Lofoten Islands forming the 'tail.'",
        difficulty: 3,
        visualType: "outline"
      },
      {
        mode: "hidden-outlines",
        region: "global",
        questionText: "Which country has a shape that resembles a upside-down triangle?",
        hint: "This South Asian country is known as a subcontinent.",
        answer: "india",
        alternativeAnswers: [],
        funFact: "India's triangular shape points southward into the Indian Ocean, with the Himalayas forming the northern border and the Western and Eastern Ghats along the coasts.",
        difficulty: 2,
        visualType: "outline"
      },
      {
        mode: "hidden-outlines",
        region: "global",
        questionText: "Which African country has a distinctive panhandle extending westward?",
        hint: "This landlocked country in southern Africa is famous for its wildlife and the Kalahari Desert.",
        answer: "botswana",
        alternativeAnswers: [],
        funFact: "Botswana's distinctive shape includes the Caprivi Strip-like panhandle that extends westward, giving it a unique appearance among African nations.",
        difficulty: 4,
        visualType: "outline"
      },
      // Mystery Mix (10 questions)
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
        questionText: "Which country has more time zones than any other?",
        hint: "This country spans 11 time zones from Europe to Asia.",
        answer: "russia",
        alternativeAnswers: [],
        funFact: "Russia spans 11 time zones, more than any other country. When it's midnight in Moscow, it's already 9 AM in Kamchatka on the far eastern coast!",
        difficulty: 3,
        visualType: "text"
      },
      {
        mode: "mystery-mix",
        region: "global",
        questionText: "Which country is home to the world's largest desert?",
        hint: "This desert is larger than the entire United States!",
        answer: "antarctica",
        alternativeAnswers: [],
        funFact: "Antarctica contains the world's largest desert - not the Sahara! It's a cold desert with less than 2 inches of precipitation per year.",
        difficulty: 4,
        visualType: "text"
      },
      {
        mode: "mystery-mix",
        region: "global",
        questionText: "Which country has the most UNESCO World Heritage Sites?",
        hint: "This European country is famous for art, history, and amazing food.",
        answer: "italy",
        alternativeAnswers: [],
        funFact: "Italy has 58 UNESCO World Heritage Sites, more than any other country. From the Colosseum to Venice, Italy is a treasure trove of cultural heritage!",
        difficulty: 3,
        visualType: "text"
      },
      {
        mode: "mystery-mix",
        region: "global",
        questionText: "Which country is located on two continents?",
        hint: "This country bridges Europe and Asia, with its largest city split between both continents.",
        answer: "turkey",
        alternativeAnswers: [],
        funFact: "Turkey is the only country that spans two continents - Europe and Asia. Istanbul, its largest city, is literally split between both continents by the Bosphorus strait!",
        difficulty: 2,
        visualType: "text"
      },
      {
        mode: "mystery-mix",
        region: "global",
        questionText: "Which country has no rivers?",
        hint: "This wealthy Middle Eastern nation relies entirely on desalination for fresh water.",
        answer: "saudi arabia",
        alternativeAnswers: [],
        funFact: "Saudi Arabia is the largest country in the world with no rivers. The country relies on desalination plants and underground aquifers for its water supply.",
        difficulty: 4,
        visualType: "text"
      },
      {
        mode: "mystery-mix",
        region: "global",
        questionText: "Which country has the most natural lakes?",
        hint: "This North American country has over 36,000 lakes larger than 5 hectares.",
        answer: "canada",
        alternativeAnswers: [],
        funFact: "Canada has more lakes than the rest of the world combined! It contains over 36,000 lakes larger than 5 hectares, including the Great Lakes shared with the US.",
        difficulty: 3,
        visualType: "text"
      },
      {
        mode: "mystery-mix",
        region: "global",
        questionText: "Which European country has never been conquered?",
        hint: "This mountainous nation is famous for its neutrality and chocolate.",
        answer: "switzerland",
        alternativeAnswers: [],
        funFact: "Switzerland has never been successfully invaded or conquered in its modern history. Its mountainous terrain and strong military traditions have helped maintain its independence.",
        difficulty: 3,
        visualType: "text"
      },
      {
        mode: "mystery-mix",
        region: "global",
        questionText: "Which country changes its name twice a year?",
        hint: "This European nation switches between summer and winter names.",
        answer: "none",
        alternativeAnswers: ["no country", "trick question"],
        funFact: "This was a trick question! No country actually changes its official name seasonally, though some places have different local names in different seasons.",
        difficulty: 3,
        visualType: "text"
      },
      {
        mode: "mystery-mix",
        region: "global",
        questionText: "Which country has the most pyramids?",
        hint: "This African country has more pyramids than Egypt!",
        answer: "sudan",
        alternativeAnswers: [],
        funFact: "Sudan has over 200 pyramids, more than Egypt! Most are located in three areas: Nuri, Naga, and Meroë, built by the ancient Kingdom of Kush.",
        difficulty: 4,
        visualType: "text"
      }
    ];

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
