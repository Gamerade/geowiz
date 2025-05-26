import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, TrendingDown, Target, BookOpen, Star, ArrowRight, Lightbulb, Trophy } from "lucide-react";

interface LearningInsight {
  type: "strength" | "weakness" | "opportunity";
  category: string;
  description: string;
  evidence: string;
}

interface PersonalizedRecommendation {
  id: string;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  suggestedMode: string | null;
  suggestedRegion: string | null;
  reasoning: string;
  type: "focus_area" | "difficulty_adjustment" | "new_region" | "skill_building";
}

interface LearningPathProps {
  onRecommendationClick: (mode: string, region: string) => void;
}

export default function LearningPath({ onRecommendationClick }: LearningPathProps) {
  const { data: insights, isLoading: insightsLoading } = useQuery<LearningInsight[]>({
    queryKey: ["/api/learning/insights"],
  });

  const { data: recommendations, isLoading: recommendationsLoading } = useQuery<PersonalizedRecommendation[]>({
    queryKey: ["/api/learning/recommendations"],
  });

  const getInsightIcon = (type: string) => {
    switch (type) {
      case "strength": return <TrendingUp className="w-5 h-5 text-green-500" />;
      case "weakness": return <TrendingDown className="w-5 h-5 text-red-500" />;
      case "opportunity": return <Target className="w-5 h-5 text-blue-500" />;
      default: return <BookOpen className="w-5 h-5 text-gray-500" />;
    }
  };

  const getInsightBadgeColor = (type: string) => {
    switch (type) {
      case "strength": return "bg-green-100 text-green-800";
      case "weakness": return "bg-red-100 text-red-800";
      case "opportunity": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "low": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case "focus_area": return <Target className="w-5 h-5 text-orange-500" />;
      case "difficulty_adjustment": return <TrendingUp className="w-5 h-5 text-purple-500" />;
      case "new_region": return <BookOpen className="w-5 h-5 text-blue-500" />;
      case "skill_building": return <Trophy className="w-5 h-5 text-amber-500" />;
      default: return <Lightbulb className="w-5 h-5 text-gray-500" />;
    }
  };

  const formatModeName = (mode: string) => {
    return mode.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const formatRegionName = (region: string) => {
    return region.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  if (insightsLoading || recommendationsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <Star className="w-6 h-6 text-amber-500" />
          <h2 className="text-2xl font-bold text-slate-900">Your Learning Path</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                <div className="h-4 bg-slate-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                <div className="h-4 bg-slate-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-2">
        <Star className="w-6 h-6 text-amber-500" />
        <h2 className="text-2xl font-bold text-slate-900">Your Learning Path</h2>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Performance Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              <span>Performance Insights</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!insights || insights.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600">Complete a few challenges to see your performance insights!</p>
              </div>
            ) : (
              insights.map((insight, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 rounded-lg bg-slate-50">
                  {getInsightIcon(insight.type)}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-medium text-slate-900">{insight.category}</h4>
                      <Badge className={getInsightBadgeColor(insight.type)}>
                        {insight.type}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-700 mb-2">{insight.description}</p>
                    <p className="text-xs text-slate-500">{insight.evidence}</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Personalized Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-green-500" />
              <span>Recommended for You</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!recommendations || recommendations.length === 0 ? (
              <div className="text-center py-8">
                <Lightbulb className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600">Play more games to get personalized recommendations!</p>
              </div>
            ) : (
              recommendations.map((rec) => (
                <div key={rec.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      {getRecommendationIcon(rec.type)}
                      <h4 className="font-medium text-slate-900">{rec.title}</h4>
                    </div>
                    <Badge className={getPriorityBadgeColor(rec.priority)}>
                      {rec.priority}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-slate-700">{rec.description}</p>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-slate-500">
                      {rec.suggestedMode && rec.suggestedRegion && (
                        <span>
                          {formatModeName(rec.suggestedMode)} • {formatRegionName(rec.suggestedRegion)}
                        </span>
                      )}
                    </div>
                    
                    {rec.suggestedMode && rec.suggestedRegion && (
                      <Button
                        size="sm"
                        onClick={() => onRecommendationClick(rec.suggestedMode!, rec.suggestedRegion!)}
                        className="text-xs"
                      >
                        Try Now
                        <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    )}
                  </div>
                  
                  <div className="text-xs text-slate-500 bg-slate-50 p-2 rounded">
                    <strong>Why:</strong> {rec.reasoning}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}