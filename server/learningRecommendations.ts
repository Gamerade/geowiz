import { storage } from "./storage";
import type { GameMode, Region, GameSession, GameAnswer } from "@shared/schema";

export interface LearningInsight {
  type: "strength" | "weakness" | "opportunity";
  category: string;
  description: string;
  evidence: string;
}

export interface PersonalizedRecommendation {
  id: string;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  suggestedMode: GameMode | null;
  suggestedRegion: Region | null;
  reasoning: string;
  type: "focus_area" | "difficulty_adjustment" | "new_region" | "skill_building";
}

export class LearningPathEngine {
  
  async analyzeUserPerformance(userId: string): Promise<LearningInsight[]> {
    const sessions = await storage.getUserGameSessions(userId);
    const insights: LearningInsight[] = [];
    
    if (sessions.length === 0) {
      return [{
        type: "opportunity",
        category: "Getting Started",
        description: "Ready to begin your geography journey",
        evidence: "No games played yet"
      }];
    }

    // Analyze performance by mode
    const modeStats = this.calculateModePerformance(sessions);
    Object.entries(modeStats).forEach(([mode, stats]) => {
      if (stats.accuracy >= 0.8) {
        insights.push({
          type: "strength",
          category: `${mode} Mastery`,
          description: `Excellent performance in ${mode.replace('-', ' ')} questions`,
          evidence: `${Math.round(stats.accuracy * 100)}% accuracy across ${stats.totalQuestions} questions`
        });
      } else if (stats.accuracy < 0.5) {
        insights.push({
          type: "weakness",
          category: `${mode} Challenge`,
          description: `Room for improvement in ${mode.replace('-', ' ')} questions`,
          evidence: `${Math.round(stats.accuracy * 100)}% accuracy - consider more practice`
        });
      }
    });

    // Analyze performance by region
    const regionStats = this.calculateRegionPerformance(sessions);
    Object.entries(regionStats).forEach(([region, stats]) => {
      if (stats.accuracy >= 0.8 && stats.totalQuestions >= 5) {
        insights.push({
          type: "strength",
          category: `${region} Expert`,
          description: `Strong knowledge of ${region.replace('-', ' ')} geography`,
          evidence: `${Math.round(stats.accuracy * 100)}% accuracy in ${region}`
        });
      }
    });

    // Identify learning patterns
    const streakAnalysis = this.analyzeStreakPatterns(sessions);
    if (streakAnalysis.maxStreak >= 5) {
      insights.push({
        type: "strength",
        category: "Consistency",
        description: "Great ability to maintain focus and accuracy",
        evidence: `Achieved ${streakAnalysis.maxStreak} question streak`
      });
    }

    return insights;
  }

  async generateRecommendations(userId: string): Promise<PersonalizedRecommendation[]> {
    const sessions = await storage.getUserGameSessions(userId);
    const insights = await this.analyzeUserPerformance(userId);
    const recommendations: PersonalizedRecommendation[] = [];
    
    if (sessions.length === 0) {
      return this.getBeginnerRecommendations();
    }

    const modeStats = this.calculateModePerformance(sessions);
    const regionStats = this.calculateRegionPerformance(sessions);
    const recentPerformance = this.analyzeRecentPerformance(sessions);

    // Recommend improvement areas
    const weakModes = Object.entries(modeStats)
      .filter(([_, stats]) => stats.accuracy < 0.6)
      .sort((a, b) => a[1].accuracy - b[1].accuracy);

    if (weakModes.length > 0) {
      const [weakestMode, stats] = weakModes[0];
      recommendations.push({
        id: `improve-${weakestMode}`,
        title: `Master ${this.formatModeName(weakestMode)}`,
        description: `Focus on improving your ${this.formatModeName(weakestMode)} skills with targeted practice`,
        priority: "high",
        suggestedMode: weakestMode as GameMode,
        suggestedRegion: "global",
        reasoning: `Current accuracy: ${Math.round(stats.accuracy * 100)}%. Practice will help build confidence.`,
        type: "focus_area"
      });
    }

    // Recommend new challenges for strong performers
    const strongModes = Object.entries(modeStats)
      .filter(([_, stats]) => stats.accuracy >= 0.8)
      .map(([mode]) => mode);

    if (strongModes.length > 0) {
      const unexploredModes = ["mispronounced-capitals", "multiple-capitals", "hidden-outlines", "flag-quirks", "mystery-mix"]
        .filter(mode => !strongModes.includes(mode));
      
      if (unexploredModes.length > 0) {
        recommendations.push({
          id: `challenge-${unexploredModes[0]}`,
          title: `Try ${this.formatModeName(unexploredModes[0])}`,
          description: `Ready for a new challenge? Test your skills with ${this.formatModeName(unexploredModes[0])}`,
          priority: "medium",
          suggestedMode: unexploredModes[0] as GameMode,
          suggestedRegion: "global",
          reasoning: "Based on your strong performance, you're ready for more advanced challenges.",
          type: "skill_building"
        });
      }
    }

    // Regional expansion recommendations
    const exploredRegions = Object.keys(regionStats);
    const unexploredRegions = ["europe", "asia", "africa", "north-america", "south-america", "oceania"]
      .filter(region => !exploredRegions.includes(region));

    if (unexploredRegions.length > 0 && recentPerformance.accuracy >= 0.7) {
      recommendations.push({
        id: `explore-${unexploredRegions[0]}`,
        title: `Explore ${this.formatRegionName(unexploredRegions[0])}`,
        description: `Expand your geographical knowledge to ${this.formatRegionName(unexploredRegions[0])}`,
        priority: "medium",
        suggestedMode: this.getBestMode(modeStats),
        suggestedRegion: unexploredRegions[0] as Region,
        reasoning: "Your solid performance suggests you're ready to explore new regions.",
        type: "new_region"
      });
    }

    // Difficulty progression
    if (recentPerformance.accuracy >= 0.9) {
      recommendations.push({
        id: "difficulty-increase",
        title: "Challenge Yourself",
        description: "Your accuracy is excellent! Try harder game modes to push your limits",
        priority: "low",
        suggestedMode: "mystery-mix",
        suggestedRegion: "global",
        reasoning: `${Math.round(recentPerformance.accuracy * 100)}% recent accuracy shows you're ready for harder challenges.`,
        type: "difficulty_adjustment"
      });
    }

    return recommendations.slice(0, 4); // Return top 4 recommendations
  }

  private calculateModePerformance(sessions: GameSession[]) {
    const modeStats: Record<string, { accuracy: number; totalQuestions: number; correctAnswers: number }> = {};
    
    sessions.forEach(session => {
      if (!modeStats[session.mode]) {
        modeStats[session.mode] = { accuracy: 0, totalQuestions: 0, correctAnswers: 0 };
      }
      modeStats[session.mode].totalQuestions += session.questionsAnswered;
      modeStats[session.mode].correctAnswers += session.correctAnswers;
      modeStats[session.mode].accuracy = modeStats[session.mode].correctAnswers / modeStats[session.mode].totalQuestions;
    });

    return modeStats;
  }

  private calculateRegionPerformance(sessions: GameSession[]) {
    const regionStats: Record<string, { accuracy: number; totalQuestions: number; correctAnswers: number }> = {};
    
    sessions.forEach(session => {
      if (!regionStats[session.region]) {
        regionStats[session.region] = { accuracy: 0, totalQuestions: 0, correctAnswers: 0 };
      }
      regionStats[session.region].totalQuestions += session.questionsAnswered;
      regionStats[session.region].correctAnswers += session.correctAnswers;
      regionStats[session.region].accuracy = regionStats[session.region].correctAnswers / regionStats[session.region].totalQuestions;
    });

    return regionStats;
  }

  private analyzeStreakPatterns(sessions: GameSession[]) {
    const maxStreak = Math.max(...sessions.map(s => s.maxStreak), 0);
    const avgStreak = sessions.reduce((sum, s) => sum + s.maxStreak, 0) / sessions.length;
    return { maxStreak, avgStreak };
  }

  private analyzeRecentPerformance(sessions: GameSession[]) {
    const recentSessions = sessions.slice(-3); // Last 3 sessions
    const totalQuestions = recentSessions.reduce((sum, s) => sum + s.questionsAnswered, 0);
    const correctAnswers = recentSessions.reduce((sum, s) => sum + s.correctAnswers, 0);
    return { accuracy: totalQuestions > 0 ? correctAnswers / totalQuestions : 0 };
  }

  private getBestMode(modeStats: Record<string, any>): GameMode {
    const bestMode = Object.entries(modeStats)
      .sort((a, b) => b[1].accuracy - a[1].accuracy)[0];
    return (bestMode?.[0] || "capitals") as GameMode;
  }

  private formatModeName(mode: string): string {
    return mode.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  private formatRegionName(region: string): string {
    return region.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  private getBeginnerRecommendations(): PersonalizedRecommendation[] {
    return [
      {
        id: "start-capitals",
        title: "Master World Capitals",
        description: "Build your foundation with capital cities - the cornerstone of geography knowledge",
        priority: "high",
        suggestedMode: "capitals",
        suggestedRegion: "global",
        reasoning: "Capital cities are the perfect starting point. Learn country-capital relationships that form the basis of all geographic knowledge.",
        type: "skill_building"
      },
      {
        id: "explore-europe",
        title: "Explore European Geography",
        description: "Start with Europe - familiar names, manageable size, rich history",
        priority: "high",
        suggestedMode: "capitals",
        suggestedRegion: "europe",
        reasoning: "Europe offers a perfect balance of challenge and familiarity, with countries you've likely heard of before.",
        type: "new_region"
      },
      {
        id: "try-asia",
        title: "Challenge Yourself with Asia",
        description: "Ready for something different? Test your knowledge of Asian capitals and cultures",
        priority: "medium",
        suggestedMode: "capitals",
        suggestedRegion: "asia",
        reasoning: "Asia provides an excellent challenge with diverse countries and fascinating capital cities.",
        type: "new_region"
      },
      {
        id: "flag-basics",
        title: "Learn Flag Patterns",
        description: "Discover the stories behind country flags and their unique quirks",
        priority: "medium",
        suggestedMode: "flag-quirks",
        suggestedRegion: "global",
        reasoning: "Flags are visual and memorable - a fun way to connect countries with their symbols and history.",
        type: "skill_building"
      },
      {
        id: "americas-focus",
        title: "Discover the Americas",
        description: "From Canada to Chile - explore North and South American geography",
        priority: "medium",
        suggestedMode: "capitals",
        suggestedRegion: "north-america",
        reasoning: "The Americas offer diverse geography and interesting capital cities to learn.",
        type: "new_region"
      },
      {
        id: "pronunciation-fun",
        title: "Pronunciation Challenge",
        description: "Think you know how to say those tricky capital names? Test yourself!",
        priority: "low",
        suggestedMode: "mispronounced-capitals",
        suggestedRegion: "global",
        reasoning: "Once you know the capitals, challenge yourself with correct pronunciation - it's trickier than you think!",
        type: "skill_building"
      }
    ];
  }
}

export const learningEngine = new LearningPathEngine();