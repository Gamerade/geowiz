import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy, Target, Zap, Home, RotateCcw } from "lucide-react";
import { getRankTitle } from "@/lib/gameData";

interface GameResultsProps {
  score: number;
  questionsAnswered: number;
  correctAnswers: number;
  currentStreak: number;
  maxStreak: number;
  gameMode: string;
  region: string;
  onPlayAgain: () => void;
  onBackToMenu: () => void;
}

export default function GameResults({
  score,
  questionsAnswered,
  correctAnswers,
  currentStreak,
  maxStreak,
  gameMode,
  region,
  onPlayAgain,
  onBackToMenu
}: GameResultsProps) {
  const accuracy = questionsAnswered > 0 ? Math.round((correctAnswers / questionsAnswered) * 100) : 0;
  const rank = getRankTitle(score);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardContent className="p-8">
          <div className="text-center space-y-6">
            {/* Trophy Icon */}
            <div className="flex justify-center">
              <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full p-4">
                <Trophy className="w-16 h-16 text-white" />
              </div>
            </div>

            {/* Title */}
            <div>
              <h1 className="text-4xl font-bold text-slate-800 mb-2">Game Complete!</h1>
              <p className="text-lg text-slate-600">
                Great job playing {gameMode.replace('-', ' ')} - {region}
              </p>
            </div>

            {/* Score Card */}
            <div className="bg-gradient-to-r from-emerald-500 to-blue-500 rounded-xl p-6 text-white">
              <div className="text-6xl font-bold mb-2">{score}</div>
              <div className="text-xl opacity-90">Total Points</div>
              <Badge className="mt-2 bg-white/20 text-white border-white/30">
                {rank}
              </Badge>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-center mb-2">
                  <Target className="w-5 h-5 text-emerald-500" />
                </div>
                <div className="text-2xl font-bold text-slate-800">{accuracy}%</div>
                <div className="text-sm text-slate-600">Accuracy</div>
              </div>

              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-center mb-2">
                  <Zap className="w-5 h-5 text-amber-500" />
                </div>
                <div className="text-2xl font-bold text-slate-800">{maxStreak}</div>
                <div className="text-sm text-slate-600">Best Streak</div>
              </div>

              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="text-2xl font-bold text-emerald-600">{correctAnswers}</div>
                <div className="text-sm text-slate-600">Correct</div>
              </div>

              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="text-2xl font-bold text-slate-800">{questionsAnswered}</div>
                <div className="text-sm text-slate-600">Total Questions</div>
              </div>
            </div>

            {/* Performance Message */}
            <div className="bg-blue-50 rounded-lg p-4">
              {accuracy >= 80 ? (
                <p className="text-blue-800">
                  🎉 Excellent performance! You're a geography expert!
                </p>
              ) : accuracy >= 60 ? (
                <p className="text-blue-800">
                  👍 Good work! Keep practicing to improve your skills!
                </p>
              ) : (
                <p className="text-blue-800">
                  📚 Great effort! Geography is challenging - keep learning!
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                onClick={onPlayAgain}
                size="lg"
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-8"
              >
                <RotateCcw className="w-5 h-5 mr-2" />
                Play Again
              </Button>
              
              <Button 
                onClick={onBackToMenu}
                variant="outline"
                size="lg"
                className="px-8"
              >
                <Home className="w-5 h-5 mr-2" />
                Back to Menu
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}