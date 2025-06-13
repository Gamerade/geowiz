import type { GameMode, Region, Question } from "@shared/schema";

export interface GameModeInfo {
  id: GameMode;
  title: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Expert';
  difficultyStars: number;
  icon: string;
  color: string;
  badge: string;
  badgeColor: string;
}

export interface RegionInfo {
  id: Region;
  name: string;
  description: string;
  countryCount: number;
  image?: string;
  badge?: string;
  badgeColor?: string;
}

export const gameModes: GameModeInfo[] = [
  {
    id: "capitals",
    title: "Capital Cities",
    description: "Test your knowledge of world capitals",
    difficulty: "Easy",
    difficultyStars: 1,
    icon: "fas fa-city",
    color: "from-blue-500 to-indigo-600",
    badge: "Perfect Start",
    badgeColor: "bg-blue-100 text-blue-800"
  },
  {
    id: "mispronounced-capitals",
    title: "Mispronounced Capitals",
    description: "Test your knowledge on capitals people often say wrong",
    difficulty: "Medium",
    difficultyStars: 3,
    icon: "fas fa-microphone",
    color: "from-red-500 to-pink-600",
    badge: "Popular Choice",
    badgeColor: "bg-red-100 text-red-800"
  },
  {
    id: "multiple-capitals",
    title: "Multiple Capitals", 
    description: "Countries with multiple capitals like South Africa",
    difficulty: "Hard",
    difficultyStars: 4,
    icon: "fas fa-city",
    color: "from-blue-500 to-indigo-600",
    badge: "Mind Bender",
    badgeColor: "bg-blue-100 text-blue-800"
  },
  {
    id: "hidden-outlines",
    title: "Hidden Outlines",
    description: "Identify countries from partially blurred map shapes",
    difficulty: "Medium", 
    difficultyStars: 3,
    icon: "fas fa-search",
    color: "from-green-500 to-emerald-600",
    badge: "Visual Challenge",
    badgeColor: "bg-green-100 text-green-800"
  },
  {
    id: "flag-quirks", 
    title: "Flag Quirks",
    description: "Visual oddities and fascinating flag histories",
    difficulty: "Easy",
    difficultyStars: 2,
    icon: "fas fa-flag",
    color: "from-purple-500 to-violet-600", 
    badge: "Colorful Fun",
    badgeColor: "bg-purple-100 text-purple-800"
  },
  {
    id: "mystery-mix",
    title: "Mystery Mix",
    description: "Unexpected trivia: microstates, borders, altitudes",
    difficulty: "Expert",
    difficultyStars: 5,
    icon: "fas fa-question",
    color: "from-orange-500 to-red-600",
    badge: "Expert Level", 
    badgeColor: "bg-orange-100 text-orange-800"
  },
  {
    id: "custom",
    title: "Custom Challenge",
    description: "Create your own geography adventure",
    difficulty: "Medium",
    difficultyStars: 0,
    icon: "fas fa-cogs",
    color: "from-slate-500 to-slate-600",
    badge: "Build Your Own",
    badgeColor: "bg-slate-200 text-slate-700"
  }
];

export const regions: RegionInfo[] = [
  {
    id: "global",
    name: "Global Challenge",
    description: "All countries worldwide",
    countryCount: 195,
    image: "data:image/svg+xml,%3Csvg width='400' height='250' viewBox='0 0 400 250' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='400' height='250' fill='%233338FF'/%3E%3Cellipse cx='200' cy='125' rx='150' ry='80' fill='%2322C55E' fill-opacity='0.8'/%3E%3Cellipse cx='120' cy='90' rx='60' ry='35' fill='%2316A34A'/%3E%3Cellipse cx='280' cy='110' rx='70' ry='40' fill='%2316A34A'/%3E%3Cellipse cx='200' cy='160' rx='80' ry='45' fill='%2316A34A'/%3E%3Ctext x='200' y='135' text-anchor='middle' fill='white' font-family='sans-serif' font-size='18' font-weight='bold'%3EGLOBAL%3C/text%3E%3C/svg%3E",
    badge: "Ultimate",
    badgeColor: "bg-primary text-white"
  },
  {
    id: "europe", 
    name: "Europe",
    description: "From Iceland to Turkey",
    countryCount: 50,
    image: "https://images.unsplash.com/photo-1536431311719-398b6704d4cc?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250",
    badge: "Popular",
    badgeColor: "bg-emerald-500 text-white"
  },
  {
    id: "asia",
    name: "Asia", 
    description: "Largest continent challenge",
    countryCount: 48,
    image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250",
    badge: "Challenging",
    badgeColor: "bg-amber-500 text-white"
  },
  {
    id: "africa",
    name: "Africa",
    description: "Diverse nations and cultures", 
    countryCount: 54,
    image: "data:image/svg+xml,%3Csvg width='400' height='250' viewBox='0 0 400 250' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='400' height='250' fill='%2316A34A'/%3E%3Cpath d='M200 40 C220 50 240 70 250 90 C255 120 250 150 240 180 C230 200 200 210 170 200 C140 190 120 170 110 145 C105 120 110 100 130 80 C150 60 170 40 200 40 Z' fill='%2322C55E'/%3E%3Cpath d='M190 60 C215 65 230 80 235 100 C238 120 235 140 225 160 C210 175 185 180 160 170 C140 160 125 145 125 125 C125 105 140 100 160 85 C175 75 185 65 190 60 Z' fill='%23059669'/%3E%3Ctext x='200' y='145' text-anchor='middle' fill='white' font-family='sans-serif' font-size='18' font-weight='bold'%3EAFRICA%3C/text%3E%3C/svg%3E",
    badge: "Diverse",
    badgeColor: "bg-green-500 text-white"
  },
  {
    id: "north-america",
    name: "North America",
    description: "From Canada to Panama",
    countryCount: 23
  },
  {
    id: "south-america", 
    name: "South America",
    description: "From Colombia to Chile",
    countryCount: 12
  },
  {
    id: "oceania",
    name: "Oceania",
    description: "Pacific Island nations",
    countryCount: 14
  },
  {
    id: "custom",
    name: "Custom Set",
    description: "Create your own challenge",
    countryCount: 0
  }
];

export function getGameModeInfo(mode: GameMode): GameModeInfo | undefined {
  return gameModes.find(m => m.id === mode);
}

export function getRegionInfo(region: Region): RegionInfo | undefined {
  return regions.find(r => r.id === region);
}

export function getRankTitle(score: number): string {
  if (score >= 2000) return "Cartography Sorcerer";
  if (score >= 1500) return "Geography Gladiator"; 
  if (score >= 1000) return "Atlas Explorer";
  if (score >= 500) return "Map Navigator";
  if (score >= 200) return "Compass Cadet";
  return "Geography Novice";
}

/**
 * Store an array of questions in localStorage under the "questions" key.
 * Overwrites any existing questions.
 */
export function storeQuestions(questions: Question[]): void {
  localStorage.setItem("questions", JSON.stringify(questions));
}

/**
 * Retrieve questions from localStorage, or null if not present.
 */
export function getStoredQuestions(): Question[] | null {
  const data = localStorage.getItem("questions");
  if (!data) return null;
  try {
    return JSON.parse(data) as Question[];
  } catch {
    return null;
  }
}

export const triviaFacts = [
  {
    title: "Highest Capital City",
    description: "La Rinconada, Peru, sits at 16,732 feet above sea level, making it the highest permanent settlement on Earth!",
    image: "https://images.unsplash.com/photo-1516849841032-87cbac4d88f7?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200"
  },
  {
    title: "Continent Movement", 
    description: "Africa and South America are moving apart at about the same rate your fingernails grow - 2.5 cm per year!",
    image: "https://pixabay.com/get/gf6037b0cd103892bda37a319fbc4a5d57402321feecdaf5eae1abb064005f5b2afa5350dedb3c584db8d1cf965a152c6f3fb850324c84fac6fe1f496a0ae7d9e_1280.jpg"
  },
  {
    title: "Smallest Country",
    description: "Vatican City is so small that its entire area is just 0.17 square miles - you could walk across it in 20 minutes!",
    image: "https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200"
  }
];
