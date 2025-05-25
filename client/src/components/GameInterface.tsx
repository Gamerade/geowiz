import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useGameState } from "@/hooks/useGameState";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { X, Flag, Map, Mic, Clock, Trophy, Target, Zap, Percent } from "lucide-react";
import { getRankTitle } from "@/lib/gameData";
import type { Question } from "@shared/schema";

interface GameInterfaceProps {
  onBackToMenu: () => void;
}

export default function GameInterface({ onBackToMenu }: GameInterfaceProps) {
  const { gameState, updateScore, incrementQuestion, setCurrentQuestion, completeGame } = useGameState();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [timeRemaining, setTimeRemaining] = useState(60);
  const [showFeedback, setShowFeedback] = useState(false);
  const [lastAnswer, setLastAnswer] = useState<any>(null);

  // Fetch questions for current game - using direct values since state sync is broken
  const { data: questions, isLoading, error } = useQuery({
    queryKey: [`/api/questions/mispronounced-capitals/global`],
    enabled: true // Always enable for now to test
  });

  console.log('Game state:', gameState);
  console.log('Selected mode:', gameState.selectedMode);
  console.log('Selected region:', gameState.selectedRegion);
  console.log('Query enabled:', !!(gameState.selectedMode && gameState.selectedRegion));
  console.log('Questions data:', questions);
  console.log('Loading state:', isLoading);
  console.log('Error:', error);

  // Submit answer mutation
  const submitAnswerMutation = useMutation({
    mutationFn: async (answerData: { sessionId: number; questionId: number; userAnswer: string; timeSpent: number }) => {
      const response = await apiRequest("POST", "/api/answers", answerData);
      return response.json();
    },
    onSuccess: (data) => {
      setLastAnswer(data);
      setShowFeedback(true);
      updateScore(data.scoreEarned || 0);
      if (data.isCorrect) {
        incrementQuestion();
      }
    }
  });

  // Timer effect
  useEffect(() => {
    if (timeRemaining > 0 && !showFeedback) {
      const timer = setTimeout(() => setTimeRemaining(timeRemaining - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeRemaining === 0 && !showFeedback) {
      handleSubmitAnswer();
    }
  }, [timeRemaining, showFeedback]);

  // Reset timer when question changes
  useEffect(() => {
    setTimeRemaining(60);
    setUserAnswer("");
    setShowFeedback(false);
    setLastAnswer(null);
  }, [currentQuestionIndex]);

  const currentQuestion: Question | undefined = questions?.[currentQuestionIndex];

  const handleSubmitAnswer = () => {
    if (!currentQuestion || !userAnswer.trim() || submitAnswerMutation.isPending) return;

    // Simple answer checking for immediate gameplay
    const userAnswerLower = userAnswer.trim().toLowerCase();
    const correctAnswer = currentQuestion.answer.toLowerCase();
    const alternativeAnswers = currentQuestion.alternativeAnswers || [];
    
    const isCorrect = userAnswerLower === correctAnswer || 
                     alternativeAnswers.some(alt => alt.toLowerCase() === userAnswerLower);

    const mockAnswer = {
      isCorrect,
      question: currentQuestion, // Include the full question object
      scoreEarned: isCorrect ? 100 : 0,
      timeSpent: 60 - timeRemaining
    };

    console.log('Setting feedback data:', mockAnswer);
    console.log('Current showFeedback before:', showFeedback);
    
    setLastAnswer(mockAnswer);
    setShowFeedback(true);
    
    console.log('Should show feedback now');
    
    if (isCorrect) {
      updateScore(100);
    }
  };

  const handleContinue = () => {
    setShowFeedback(false);
    setLastAnswer(null);
    setUserAnswer(''); // Clear the input for next question
    
    // Always increment question when continuing
    incrementQuestion();
    
    if (currentQuestionIndex >= (questions?.length || 0) - 1) {
      // Game complete
      completeGame();
      onBackToMenu();
    } else {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setCurrentQuestion(currentQuestionIndex + 1);
    }
  }

  // Add global keyboard listener for Enter-to-continue when feedback is shown
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && showFeedback) {
        e.preventDefault();
        e.stopPropagation();
        handleContinue();
      }
    };

    if (showFeedback) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showFeedback]);

  const handleSkipQuestion = () => {
    handleSubmitAnswer(); // Submit empty answer
  };

  const getQuestionIcon = (type: string | null) => {
    switch (type) {
      case 'flag': return <Flag className="w-5 h-5" />;
      case 'outline': return <Map className="w-5 h-5" />;
      case 'audio': return <Mic className="w-5 h-5" />;
      default: return <Target className="w-5 h-5" />;
    }
  };

  const getModeColor = (mode: string) => {
    switch (mode) {
      case 'mispronounced-capitals': return 'bg-red-100 text-red-800';
      case 'multiple-capitals': return 'bg-blue-100 text-blue-800';
      case 'hidden-outlines': return 'bg-green-100 text-green-800';
      case 'flag-quirks': return 'bg-purple-100 text-purple-800';
      case 'mystery-mix': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-slate-600">Loading questions...</p>
        </div>
      </div>
    );
  }

  if (!questions || questions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600 mb-4">No questions available for this mode and region.</p>
        <Button onClick={onBackToMenu}>Back to Menu</Button>
      </div>
    );
  }

  const progressPercentage = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Game Header */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-blue-600 rounded-xl flex items-center justify-center">
                {getQuestionIcon(currentQuestion?.visualType || null)}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 capitalize">
                  {gameState.selectedMode?.replace('-', ' ')}
                </h3>
                <p className="text-sm text-slate-600 capitalize">
                  {gameState.selectedRegion?.replace('-', ' ')} Challenge
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Progress */}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-slate-600">Progress:</span>
                <div className="w-24">
                  <Progress value={progressPercentage} className="h-2" />
                </div>
                <span className="text-sm font-mono text-slate-600">
                  {currentQuestionIndex + 1}/{questions.length}
                </span>
              </div>

              {/* Score */}
              <div className="bg-slate-100 rounded-lg px-3 py-2">
                <span className="text-sm font-medium text-slate-700">
                  Score: <span className="font-mono">{gameState.score}</span>
                </span>
              </div>

              {/* Close Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={onBackToMenu}
                className="text-slate-500 hover:text-red-600"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Question Card */}
      <Card className="mb-6">
        <CardContent className="p-8">
          <div className="max-w-4xl mx-auto">
            {/* Question Type Badge */}
            <div className="text-center mb-6">
              <Badge className={`${getModeColor(gameState.selectedMode || '')} mb-4`}>
                {getQuestionIcon(currentQuestion?.visualType || null)}
                <span className="ml-2 capitalize">
                  {currentQuestion?.mode?.replace('-', ' ')} Challenge
                </span>
              </Badge>
            </div>

            {/* Visual Content */}
            {currentQuestion?.visualUrl && (
              <div className="text-center mb-8">
                {currentQuestion.visualType === 'flag' && (
                  <div className="mb-6">
                    <img 
                      src={currentQuestion.visualUrl}
                      alt="Country flag"
                      className="w-64 h-48 object-cover rounded-xl shadow-lg mx-auto border-4 border-slate-200"
                    />
                  </div>
                )}
                {currentQuestion.visualType === 'outline' && (
                  <div className="mb-6">
                    <img 
                      src={currentQuestion.visualUrl}
                      alt="Country outline"
                      className="w-64 h-48 object-cover rounded-xl shadow-lg mx-auto filter blur-sm"
                    />
                    <p className="text-sm text-slate-500 mt-2">Can you identify this country from its outline?</p>
                  </div>
                )}
              </div>
            )}

            {/* Question Text */}
            <div className="text-center mb-8">
              <h2 className="text-2xl lg:text-3xl font-semibold text-slate-900 mb-4">
                {currentQuestion?.questionText}
              </h2>
              {currentQuestion?.hint && (
                <p className="text-lg text-slate-600">
                  {currentQuestion.hint}
                </p>
              )}
            </div>

            {/* Answer Input */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Type answer..."
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (showFeedback && lastAnswer) {
                        // Continue to next question if showing feedback
                        handleContinue();
                      } else if (userAnswer.trim() && !showFeedback) {
                        // Submit answer if we have an answer and not showing feedback
                        handleSubmitAnswer();
                      }
                    }
                  }}
                  className="text-6xl py-8 pr-32 font-bold leading-tight placeholder:text-lg placeholder:text-slate-400"
                  style={{ fontSize: '48px', lineHeight: '1.1' }}
                  disabled={submitAnswerMutation.isPending}
                />
                <Button
                  onClick={() => {
                    console.log('GO button clicked!');
                    handleSubmitAnswer();
                  }}
                  disabled={!userAnswer.trim() || submitAnswerMutation.isPending || showFeedback}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 h-16 w-20 rounded-lg bg-emerald-600 hover:bg-emerald-700"
                  size="lg"
                >
                  {submitAnswerMutation.isPending ? "..." : "GO!"}
                </Button>
              </div>
              <div className="mt-4 text-center space-x-4">
                <p className="text-sm text-slate-500">Press Enter or click GO!</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSkipQuestion}
                  className="text-slate-500 hover:text-slate-700"
                  disabled={submitAnswerMutation.isPending || showFeedback}
                >
                  Skip this question
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timer and Stats */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-2 text-slate-600">
          <Clock className="w-4 h-4" />
          <span>Time remaining: <span className="font-mono font-semibold">{Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}</span></span>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{gameState.correctAnswers}</div>
            <div className="text-sm text-slate-600">Correct</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-500">{gameState.questionsAnswered - gameState.correctAnswers}</div>
            <div className="text-sm text-slate-600">Incorrect</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-amber-500">{gameState.currentStreak}</div>
            <div className="text-sm text-slate-600">Streak</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-emerald-500">
              {gameState.questionsAnswered > 0 ? Math.round((gameState.correctAnswers / gameState.questionsAnswered) * 100) : 100}%
            </div>
            <div className="text-sm text-slate-600">Accuracy</div>
          </CardContent>
        </Card>
      </div>

      {/* Inline Feedback - replaces question area when showing feedback */}
      {console.log('Render check - showFeedback:', showFeedback, 'lastAnswer:', lastAnswer)}
      {showFeedback && lastAnswer && (
        <div className="max-w-4xl mx-auto text-center space-y-6">
          {/* Result Header */}
          <div className="space-y-3">
            {lastAnswer.isCorrect ? (
              <div>
                <div className="text-6xl mb-3">🎉</div>
                <h2 className="text-3xl font-bold text-emerald-500">Excellent!</h2>
                <p className="text-lg text-slate-700 mt-1">
                  +{lastAnswer.scoreEarned} points! You're {getRankTitle(gameState.score)}!
                </p>
              </div>
            ) : (
              <div>
                <div className="text-6xl mb-3">📚</div>
                <h2 className="text-3xl font-bold text-blue-600">Good Try!</h2>
                <p className="text-lg text-slate-700 mt-1">
                  The answer was: <span className="font-bold text-slate-900">{lastAnswer.question?.answer || 'Unknown'}</span>
                </p>
              </div>
            )}
          </div>

          {/* Fun Fact */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 max-w-2xl mx-auto">
            <h3 className="text-xl font-bold text-blue-800 mb-3 flex items-center justify-center">
              <Zap className="text-amber-500 mr-2 w-5 h-5" />
              Did you know?
            </h3>
            <p className="text-base text-slate-700 leading-relaxed">{lastAnswer.question?.funFact || 'No fun fact available'}</p>
          </div>

          {/* Continue Instruction */}
          <div className="text-center">
            <p className="text-lg text-slate-600 mb-4">Press Enter to continue to the next question</p>
            <div className="animate-pulse">
              <div className="w-16 h-1 bg-emerald-500 rounded mx-auto"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
