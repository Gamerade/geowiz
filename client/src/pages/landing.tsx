import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Globe, MapPin, Flag, Trophy, Star, Users, Brain, Eye, Palette, Flame } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
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
            <Button 
              onClick={handleLogin}
              className="bg-primary hover:bg-blue-600 text-white font-semibold px-6 py-2 rounded-lg"
            >
              Sign In
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
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
                    onClick={handleLogin}
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

        {/* Game Modes Preview */}
        <section className="py-16 bg-white rounded-3xl shadow-sm mb-12">
          <div className="max-w-6xl mx-auto px-8">
            <div className="text-center mb-12">
              <h3 className="text-3xl font-bold text-slate-900 mb-4">Challenge Modes</h3>
              <p className="text-lg text-slate-600">Choose your adventure across different geography challenges</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { icon: Users, title: "Mispronounced Capitals", desc: "Test capitals people often say wrong", color: "from-red-500 to-pink-600" },
                { icon: Brain, title: "Multiple Capitals", desc: "Countries with multiple capitals", color: "from-blue-500 to-indigo-600" },
                { icon: Eye, title: "Hidden Outlines", desc: "Identify countries from map shapes", color: "from-green-500 to-emerald-600" },
                { icon: Palette, title: "Flag Quirks", desc: "Visual oddities and flag histories", color: "from-purple-500 to-violet-600" },
                { icon: Flame, title: "Mystery Mix", desc: "Unexpected geography trivia", color: "from-orange-500 to-red-600" },
                { icon: Star, title: "Custom Challenge", desc: "Create your own adventure", color: "from-slate-500 to-slate-600" }
              ].map((mode, index) => (
                <Card key={index} className="hover:shadow-md transition-shadow duration-200 opacity-75">
                  <CardContent className="p-6 text-center">
                    <div className={`w-12 h-12 bg-gradient-to-br ${mode.color} rounded-xl flex items-center justify-center mb-4 mx-auto`}>
                      <mode.icon className="text-white text-xl" />
                    </div>
                    <h4 className="text-lg font-semibold text-slate-900 mb-2">{mode.title}</h4>
                    <p className="text-slate-600 text-sm">{mode.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center mt-8">
              <Button 
                onClick={handleLogin}
                className="bg-primary hover:bg-blue-600 text-white font-semibold px-8 py-3 rounded-xl"
              >
                Sign In to Play
              </Button>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="text-center py-12">
          <div className="max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-slate-900 mb-4">
              Ready to Test Your Geography Knowledge?
            </h3>
            <p className="text-lg text-slate-600 mb-6">
              Join thousands of geography enthusiasts and start your journey to become a GeoWiz master!
            </p>
            <Button 
              onClick={handleLogin}
              size="lg"
              className="bg-primary hover:bg-blue-600 text-white font-semibold px-8 py-3 rounded-xl transition-all duration-200 transform hover:scale-105"
            >
              <Globe className="mr-2 w-5 h-5" />
              Get Started Now
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}