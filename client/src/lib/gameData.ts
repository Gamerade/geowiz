import type { GameMode, Region } from "@shared/schema";

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
    image: "https://pixabay.com/get/gd15d1f81fc9b2adede49e7b332bf8d65faf9a3862e1b407fb857272fb6b3a66bd1af764daeae9bca035451a206188aedb48fe5623194e0625104267ca960bd28_1280.jpg",
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
    image: "https://pixabay.com/get/g6ef4d7bd1fc03120234d240b4aa277175dad9091427d70a204d088ae22fdfbafd25af083f5917de6aab43715ca8e37c1_1280.jpg",
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
