import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Globe, Network, Mountain, Castle, Landmark, Sun, Waves, Plus } from "lucide-react";
import { regions } from "@/lib/gameData";
import { useGameState } from "@/hooks/useGameState";

interface RegionSelectorProps {
  onRegionSelect: (region: string) => void;
}

export default function RegionSelector({ onRegionSelect }: RegionSelectorProps) {
  const { gameState, setSelectedRegion } = useGameState();

  const getRegionIcon = (regionId: string) => {
    switch (regionId) {
      case "africa": return <Network className="text-white text-sm" />;
      case "asia": return <Mountain className="text-white text-sm" />;
      case "europe": return <Castle className="text-white text-sm" />;
      case "north-america": return <Landmark className="text-white text-sm" />;
      case "south-america": return <Sun className="text-white text-sm" />;
      case "oceania": return <Waves className="text-white text-sm" />;
      default: return <Globe className="text-white text-sm" />;
    }
  };

  const getRegionColor = (regionId: string) => {
    switch (regionId) {
      case "africa": return "bg-green-500";
      case "asia": return "bg-red-500";
      case "europe": return "bg-blue-500";
      case "north-america": return "bg-purple-500";
      case "south-america": return "bg-yellow-500";
      case "oceania": return "bg-teal-500";
      default: return "bg-slate-500";
    }
  };

  const handleRegionSelect = (region: any) => {
    setSelectedRegion(region.id);
    onRegionSelect(region.id);
  };

  const majorRegions = regions.filter(r => ['global', 'europe', 'asia', 'africa'].includes(r.id));
  const minorRegions = regions.filter(r => !['global', 'europe', 'asia', 'africa'].includes(r.id) && r.id !== 'custom');
  const customRegion = regions.find(r => r.id === 'custom');

  return (
    <section className="animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-slate-900 mb-4">Select Your Region</h2>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">Choose where you want to test your knowledge</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Major Regions */}
        {majorRegions.map((region) => (
          <Card 
            key={region.id}
            className={`cursor-pointer transition-all duration-300 transform hover:scale-105 hover:shadow-lg ${
              gameState.selectedRegion === region.id ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => handleRegionSelect(region)}
          >
            <CardContent className="p-6">
              {region.image && (
                <img 
                  src={region.image}
                  alt={`${region.name} map`}
                  className="w-full h-32 object-cover rounded-xl mb-4"
                />
              )}
              <h3 className="text-lg font-semibold text-slate-900 mb-2">{region.name}</h3>
              <p className="text-slate-600 text-sm mb-3">{region.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">{region.countryCount} countries</span>
                {region.badge && (
                  <Badge className={region.badgeColor}>
                    {region.badge}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Minor Regions */}
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        {minorRegions.map((region) => (
          <Card 
            key={region.id}
            className={`cursor-pointer transition-all duration-300 hover:shadow-md ${
              gameState.selectedRegion === region.id ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => handleRegionSelect(region)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 ${getRegionColor(region.id)} rounded-lg flex items-center justify-center`}>
                    {getRegionIcon(region.id)}
                  </div>
                  <div>
                    <h4 className="text-md font-semibold text-slate-900">{region.name}</h4>
                    <p className="text-slate-600 text-sm">{region.description}</p>
                  </div>
                </div>
                <span className="text-xs text-slate-500">{region.countryCount} countries</span>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Custom Region */}
        {customRegion && (
          <Card 
            className={`cursor-pointer transition-all duration-300 hover:shadow-md border-2 border-dashed border-slate-300 hover:border-slate-400 ${
              gameState.selectedRegion === customRegion.id ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => handleRegionSelect(customRegion)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-slate-500 rounded-lg flex items-center justify-center">
                    <Plus className="text-white text-sm" />
                  </div>
                  <div>
                    <h4 className="text-md font-semibold text-slate-900">{customRegion.name}</h4>
                    <p className="text-slate-600 text-sm">{customRegion.description}</p>
                  </div>
                </div>
                <span className="text-xs text-slate-500">Your choice</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </section>
  );
}
