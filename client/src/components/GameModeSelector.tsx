import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Users, Brain, Eye, Palette, Flame, Plus, Mic, Building, Search, Flag, HelpCircle, Settings } from "lucide-react";
import { gameModes } from "@/lib/gameData";
import { useGameState } from "@/hooks/useGameState";

interface GameModeSelectorProps {
  onModeSelect: (mode: string) => void;
}

export default function GameModeSelector({ onModeSelect }: GameModeSelectorProps) {
  const { gameState, setSelectedMode } = useGameState();

  const getIcon = (iconString: string) => {
    switch (iconString) {
      case "fas fa-microphone": return <Mic className="text-white text-2xl" />;
      case "fas fa-city": return <Building className="text-white text-2xl" />;
      case "fas fa-search": return <Search className="text-white text-2xl" />;
      case "fas fa-flag": return <Flag className="text-white text-2xl" />;
      case "fas fa-question": return <HelpCircle className="text-white text-2xl" />;
      case "fas fa-cogs": return <Settings className="text-white text-2xl" />;
      default: return <Star className="text-white text-2xl" />;
    }
  };

  const getBadgeIcon = (badge: string) => {
    switch (badge) {
      case "Popular Choice": return <Users className="mr-1 w-3 h-3" />;
      case "Mind Bender": return <Brain className="mr-1 w-3 h-3" />;
      case "Visual Challenge": return <Eye className="mr-1 w-3 h-3" />;
      case "Colorful Fun": return <Palette className="mr-1 w-3 h-3" />;
      case "Expert Level": return <Flame className="mr-1 w-3 h-3" />;
      case "Build Your Own": return <Plus className="mr-1 w-3 h-3" />;
      default: return null;
    }
  };

  const handleModeSelect = (mode: any) => {
    console.log('Mode selected:', mode.id);
    setSelectedMode(mode.id);
    onModeSelect(mode.id);
  };

  return (
    <section className="animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-slate-900 mb-4">Choose Your Challenge</h2>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">Select a game mode that matches your geography expertise level</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {gameModes.map((mode) => (
          <Card 
            key={mode.id}
            className={`cursor-pointer transition-all duration-300 transform hover:scale-105 hover:shadow-lg ${
              gameState.selectedMode === mode.id ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => handleModeSelect(mode)}
          >
            <CardContent className="p-6">
              <div className="text-center">
                <div className={`w-16 h-16 bg-gradient-to-br ${mode.color} rounded-2xl flex items-center justify-center mb-4 mx-auto`}>
                  {getIcon(mode.icon)}
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">{mode.title}</h3>
                <p className="text-slate-600 mb-4">{mode.description}</p>
                
                {/* Difficulty Stars */}
                <div className="flex items-center justify-center space-x-1 mb-3">
                  {mode.difficultyStars > 0 ? (
                    Array.from({ length: 5 }).map((_, index) => (
                      <Star 
                        key={index}
                        className={`w-4 h-4 ${
                          index < mode.difficultyStars 
                            ? 'text-amber-400 fill-current' 
                            : 'text-slate-300'
                        }`}
                      />
                    ))
                  ) : (
                    <span className="text-sm text-slate-500">Difficulty: Your Choice</span>
                  )}
                  {mode.difficultyStars > 0 && (
                    <span className="text-sm text-slate-500 ml-2">Difficulty: {mode.difficulty}</span>
                  )}
                </div>

                {/* Badge */}
                <Badge className={`inline-flex items-center ${mode.badgeColor}`}>
                  {getBadgeIcon(mode.badge)}
                  {mode.badge}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
