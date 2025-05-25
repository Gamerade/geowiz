import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import GameModeSelector from "@/components/GameModeSelector";
import RegionSelector from "@/components/RegionSelector";
import GameInterface from "@/components/GameInterface";
import FeedbackModal from "@/components/FeedbackModal";
import { useGameState } from "@/hooks/useGameState";
import { Trophy, Star, Globe, MapPin, Flag, Clock, Flame, Crown } from "lucide-react";

export default function Home() {
  const { gameState, startGame, resetGame, setSelectedMode, setSelectedRegion } = useGameState();
  const [currentSection, setCurrentSection] = useState<'welcome' | 'modes' | 'regions' | 'game'>('welcome');

  const handleStartAdventure = () => {
    setCurrentSection('modes');
  };

  const handleModeSelect = (mode: string) => {
    console.log('Home: Mode selected:', mode);
    setSelectedMode(mode as any);
    setCurrentSection('regions');
  };

  const handleRegionSelect = (region: string) => {
    console.log('Home: Region selected:', region);
    setSelectedRegion(region as any);
    setCurrentSection('game');
    startGame();
  };

  const handleBackToMenu = () => {
    setCurrentSection('welcome');
    resetGame();
  };

  const getRankTitle = (score: number) => {
    if (score >= 2000) return "Cartography Sorcerer";
    if (score >= 1500) return "Geography Gladiator";
    if (score >= 1000) return "Atlas Explorer";
    if (score >= 500) return "Map Navigator";
    if (score >= 200) return "Compass Cadet";
    return "Geography Novice";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-blue-600 rounded-xl flex items-center justify-center">
                <Globe className="text-white text-lg" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">GeoWiz</h1>
                <p className="text-sm text-slate-500">Ultimate Geography Challenge</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex items-center space-x-2 bg-slate-100 rounded-lg px-3 py-2">
                <Trophy className="text-amber-500 w-4 h-4" />
                <span className="text-sm font-medium text-slate-700">Score: {gameState.score}</span>
              </div>
              <div className="hidden sm:flex items-center space-x-2 bg-slate-100 rounded-lg px-3 py-2">
                <Star className="text-emerald-500 w-4 h-4" />
                <span className="text-sm font-medium text-slate-700">{getRankTitle(gameState.score)}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        {currentSection === 'welcome' && (
          <section className="text-center mb-12">
            <div className="max-w-4xl mx-auto">
              {/* Hero Image */}
              <div className="relative rounded-3xl overflow-hidden mb-8 shadow-2xl">
                <img 
                  src="https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=800" 
                  alt="Satellite view of Earth" 
                  className="w-full h-80 lg:h-96 object-cover" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-slate-900/30 to-transparent"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-white px-6">
                    <h2 className="text-4xl lg:text-6xl font-bold mb-4">
                      Think You Know Your World?
                    </h2>
                    <p className="text-xl lg:text-2xl font-medium opacity-90 mb-6">
                      Test your geography knowledge across capitals, flags, and country outlines
                    </p>
                    <Button 
                      onClick={handleStartAdventure}
                      size="lg"
                      className="bg-primary hover:bg-blue-600 text-white font-semibold px-8 py-3 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
                    >
                      <Globe className="mr-2 w-5 h-5" />
                      Start Your Adventure
                    </Button>
                  </div>
                </div>
              </div>

              {/* Features */}
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <Card className="hover:shadow-md transition-shadow duration-200">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary to-blue-600 rounded-xl flex items-center justify-center mb-4 mx-auto">
                      <MapPin className="text-white text-xl" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">5 Unique Game Modes</h3>
                    <p className="text-slate-600">From mispronounced capitals to hidden country outlines</p>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow duration-200">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center mb-4 mx-auto">
                      <Flag className="text-white text-xl" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">Visual Challenges</h3>
                    <p className="text-slate-600">Interactive flags, maps, and cultural insights</p>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow duration-200">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center mb-4 mx-auto">
                      <Trophy className="text-white text-xl" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">Earn Ranks & Facts</h3>
                    <p className="text-slate-600">Unlock quirky nicknames and discover fun facts</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>
        )}

        {/* Game Mode Selection */}
        {currentSection === 'modes' && (
          <GameModeSelector onModeSelect={handleModeSelect} />
        )}

        {/* Region Selection */}
        {currentSection === 'regions' && (
          <RegionSelector onRegionSelect={handleRegionSelect} />
        )}

        {/* Game Interface */}
        {currentSection === 'game' && (
          <GameInterface onBackToMenu={handleBackToMenu} />
        )}

        {/* Statistics Section */}
        {currentSection === 'welcome' && (
          <section className="py-16 bg-white rounded-3xl shadow-sm">
            <div className="max-w-6xl mx-auto px-8">
              <div className="text-center mb-12">
                <h3 className="text-3xl font-bold text-slate-900 mb-4">Your Geography Journey</h3>
                <p className="text-lg text-slate-600">Track your progress and celebrate achievements</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mx-auto mb-4">
                      <Trophy className="text-white text-xl" />
                    </div>
                    <div className="text-2xl font-bold text-slate-900">{gameState.score}</div>
                    <div className="text-sm text-slate-600">Total Score</div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 bg-emerald-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <Star className="text-white text-xl" />
                    </div>
                    <div className="text-2xl font-bold text-slate-900">87%</div>
                    <div className="text-sm text-slate-600">Accuracy Rate</div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <Flame className="text-white text-xl" />
                    </div>
                    <div className="text-2xl font-bold text-slate-900">{gameState.maxStreak}</div>
                    <div className="text-sm text-slate-600">Best Streak</div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-amber-50 to-amber-100">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 bg-amber-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <Clock className="text-white text-xl" />
                    </div>
                    <div className="text-2xl font-bold text-slate-900">1m 34s</div>
                    <div className="text-sm text-slate-600">Avg. Response</div>
                  </CardContent>
                </Card>
              </div>

              {/* Achievement Badges */}
              <Card className="bg-slate-50">
                <CardContent className="p-8">
                  <h4 className="text-xl font-bold text-slate-900 mb-6 text-center">Recent Achievements</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {[
                      { icon: Star, name: "Flag Master", unlocked: true, color: "bg-yellow-400" },
                      { icon: Globe, name: "World Explorer", unlocked: true, color: "bg-emerald-400" },
                      { icon: MapPin, name: "Peak Climber", unlocked: true, color: "bg-red-400" },
                      { icon: Flag, name: "Navigator", unlocked: true, color: "bg-blue-400" },
                      { icon: Crown, name: "Geography King", unlocked: false, color: "bg-gray-300" },
                      { icon: Flame, name: "Speed Demon", unlocked: false, color: "bg-gray-300" }
                    ].map((achievement, index) => (
                      <Card key={index} className={`hover:shadow-md transition-shadow ${achievement.unlocked ? '' : 'opacity-50'}`}>
                        <CardContent className="p-4 text-center">
                          <div className={`w-10 h-10 ${achievement.color} rounded-full flex items-center justify-center mx-auto mb-2`}>
                            <achievement.icon className={`${achievement.unlocked ? 'text-white' : 'text-gray-500'}`} size={16} />
                          </div>
                          <div className={`text-xs font-medium ${achievement.unlocked ? 'text-slate-900' : 'text-gray-500'}`}>
                            {achievement.name}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>
        )}
      </main>

      <FeedbackModal />
    </div>
  );
}
