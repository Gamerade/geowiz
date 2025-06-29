import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useGameState } from "@/hooks/useGameState";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { X, Flag, Map, Mic, Clock, Trophy, Target, Zap, Percent, Bot, BookOpen } from "lucide-react";
import { getRankTitle } from "@/lib/gameData";
import type { Question } from "@shared/schema";
import GameResults from "@/components/GameResults";
import SuccessAnimation from "@/components/SuccessAnimation";

interface GameInterfaceProps {
  onBackToMenu: () => void;
  selectedMode?: string;
  selectedRegion?: string;
}

export default function GameInterface({ onBackToMenu, selectedMode, selectedRegion }: GameInterfaceProps) {
  const { gameState, updateScore, incrementQuestion, setCurrentQuestion, completeGame } = useGameState();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [timeRemaining, setTimeRemaining] = useState(60);
  const [showFeedback, setShowFeedback] = useState(false);
  const [lastAnswer, setLastAnswer] = useState<any>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [correctAnswerAnimation, setCorrectAnswerAnimation] = useState(false);
  const [useAIQuestions, setUseAIQuestions] = useState(false);
  const [aiQuestions, setAiQuestions] = useState<any[]>([]);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const goButtonRef = useRef<HTMLButtonElement>(null);

  // Use props first, then game state, then fallback
  const modeToUse = selectedMode || gameState.selectedMode || 'capitals';
  const regionToUse = selectedRegion || gameState.selectedRegion || 'global';

  const { data: questions, isLoading, error } = useQuery({
    queryKey: [`/api/questions/${modeToUse}/${regionToUse}`],
    enabled: true
  });

  // Generate one AI question at a time to save costs
  const generateNextAIQuestion = async () => {
    if (isGeneratingAI) return;

    setIsGeneratingAI(true);
    try {
      const response = await apiRequest("POST", "/api/ai/generate-question", {
        mode: modeToUse,
        region: regionToUse,
        difficulty: Math.floor(Math.random() * 3) + 2, // Difficulty 2-4
        previousQuestions: aiQuestions.map(q => q.questionText)
      });

      const aiQuestion = await response.json();
      const newQuestion = {
        id: Date.now(), // Unique ID for AI questions
        mode: modeToUse,
        region: regionToUse,
        questionText: aiQuestion.question,
        hint: aiQuestion.hint,
        answer: aiQuestion.answer,
        alternativeAnswers: aiQuestion.alternativeAnswers || [],
        funFact: aiQuestion.funFact,
        difficulty: aiQuestion.difficulty,
        visualType: "text",
        visualUrl: null
      };

      setAiQuestions(prev => [...prev, newQuestion]);
    } catch (error) {
      console.error("Failed to generate AI question:", error);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // Use AI questions if enabled, otherwise use static questions
  const questionsToUse = useAIQuestions ? aiQuestions : (questions as Question[] || []);
  const currentQuestion = questionsToUse[currentQuestionIndex];

  // Generate AI questions one at a time when needed
  useEffect(() => {
    if (useAIQuestions && currentQuestionIndex >= aiQuestions.length && !isGeneratingAI) {
      generateNextAIQuestion();
    }
  }, [useAIQuestions, currentQuestionIndex, aiQuestions.length]);

  // Submit answer mutation
  const submitAnswerMutation = useMutation({
    mutationFn: async (answerData: { sessionId: number; questionId: number; userAnswer: string; timeSpent: number }) => {
      const response = await apiRequest("POST", "/api/answers", answerData);
      return response.json();
    },
    onSuccess: (data) => {
      setLastAnswer(data);
      setShowFeedback(true);
      setHasSubmitted(true);
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
    setHasSubmitted(false);
    // Focus input when new question appears
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  }, [currentQuestionIndex]);

  const handleSubmitAnswer = () => {
    if (!currentQuestion || !userAnswer.trim() || showFeedback) return;

    // Immediate answer processing
    const userAnswerLower = userAnswer.trim().toLowerCase();
    const correctAnswer = currentQuestion.answer.toLowerCase();
    const alternativeAnswers = currentQuestion.alternativeAnswers || [];

    const isCorrect = userAnswerLower === correctAnswer || 
                     alternativeAnswers.some((alt: string) => alt.toLowerCase() === userAnswerLower);

    const answerResult = {
      isCorrect,
      question: currentQuestion,
      scoreEarned: isCorrect ? 100 : 0,
      timeSpent: 60 - timeRemaining
    };

    // Set all feedback state synchronously
    setLastAnswer(answerResult);
    setShowFeedback(true);
    setHasSubmitted(true);

    // Trigger satisfying green animation for correct answers
    if (isCorrect) {
      setCorrectAnswerAnimation(true);
      setTimeout(() => setCorrectAnswerAnimation(false), 900);
      setShowSuccessAnimation(true);
      updateScore(100);
    }

    // Optional: Save to API in background
    if (gameState.sessionId) {
      apiRequest("POST", "/api/answers", {
        sessionId: gameState.sessionId,
        questionId: currentQuestion.id,
        userAnswer,
        timeSpent: 60 - timeRemaining,
        isCorrect
      }).catch(err => console.log("API save failed (non-critical):", err));
    }
  };

  const handleContinue = () => {
    setShowFeedback(false);
    setLastAnswer(null);
    setUserAnswer('');
    setHasSubmitted(false);
    setShowSuccessAnimation(false);

    incrementQuestion();

    const minQuestions = 3;
    const hasEnoughQuestions = currentQuestionIndex >= minQuestions - 1;
    const isLastQuestion = currentQuestionIndex >= questionsToUse.length - 1;

    if (hasEnoughQuestions && isLastQuestion) {
      completeGame();
      setShowResults(true);
    } else {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setCurrentQuestion(currentQuestionIndex + 1);
    }
  };

  // Single unified keyboard handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle Enter key
      if (e.key !== 'Enter') return;

      // Prevent default form submission
      e.preventDefault();

      // Check if we're in feedback mode
      if (showFeedback) {
        handleContinue();
      } else if (userAnswer.trim() && !hasSubmitted) {
        handleSubmitAnswer();
      }
    };

    // Add listener to window to catch all Enter presses
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showFeedback, userAnswer, hasSubmitted]); // Important: Include all dependencies

  const handleSkipQuestion = () => {
    handleSubmitAnswer();
  };

  const handlePlayAgain = () => {
    setShowResults(false);
    setCurrentQuestionIndex(0);
    setCurrentQuestion(0);
    setUserAnswer("");
    setShowFeedback(false);
    setLastAnswer(null);
    setHasSubmitted(false);
    setTimeRemaining(60);
  };

  const handleBackToMenu = () => {
    setShowResults(false);
    onBackToMenu();
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
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-lg text-slate-600">Loading your geography challenge...</p>
        </div>
      </div>
    );
  }

  if (error || (!useAIQuestions && (!questions || (questions as Question[]).length === 0))) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <p className="text-lg text-red-600 mb-4">Unable to load questions. Please try again.</p>
          <Button onClick={onBackToMenu}>Back to Menu</Button>
        </div>
      </div>
    );
  }

  if (showResults) {
    return (
      <GameResults
        score={gameState.score}
        questionsAnswered={gameState.questionsAnswered}
        correctAnswers={gameState.correctAnswers}
        currentStreak={gameState.currentStreak}
        maxStreak={gameState.maxStreak}
        gameMode={selectedMode || "capital-cities"}
        region={selectedRegion || "global"}
        onPlayAgain={handlePlayAgain}
        onBackToMenu={handleBackToMenu}
      />
    );
  }

  if (!currentQuestion) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <p className="text-lg text-slate-600 mb-4">
            {useAIQuestions ? "Generating AI questions..." : "No more questions available."}
          </p>
          <Button onClick={onBackToMenu}>Back to Menu</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      {/* Header */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              {/* Progress */}
              <div className="flex items-center space-x-3">
                <Trophy className="w-6 h-6 text-amber-500" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-slate-700">Progress</span>
                  <div className="flex items-center space-x-2">
                    <Progress 
                      value={(currentQuestionIndex / (questionsToUse.length || 1)) * 100} 
                      className="w-24 h-2"
                    />
                    <span className="text-xs text-slate-500 font-mono">
                      {currentQuestionIndex + 1}/{questionsToUse.length || 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* Timer */}
              <div className="bg-slate-100 rounded-lg px-3 py-2 flex items-center space-x-2">
                <Clock className="w-4 h-4 text-slate-600" />
                <span className="text-sm font-medium text-slate-700">
                  {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
                </span>
              </div>

              {/* Score */}
              <div className="bg-slate-100 rounded-lg px-3 py-2">
                <span className="text-sm font-medium text-slate-700">
                  Score: <span className="font-mono">{gameState.score}</span>
                </span>
              </div>

              {/* AI Toggle */}
              <div className="flex items-center space-x-2 bg-slate-100 rounded-lg p-2">
                <Button
                  variant={!useAIQuestions ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setUseAIQuestions(false)}
                  className="text-xs"
                >
                  <BookOpen className="w-4 h-4 mr-1" />
                  Static
                </Button>
                <Button
                  variant={useAIQuestions ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setUseAIQuestions(true)}
                  className="text-xs"
                  disabled={isGeneratingAI}
                >
                  <Bot className="w-4 h-4 mr-1" />
                  AI {isGeneratingAI ? "..." : ""}
                </Button>
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

      {/* Main Game Content - Question or Feedback */}
      {!showFeedback ? (
        /* Question Card */
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
                    ref={inputRef}
                    type="text"
                    placeholder="Type answer..."
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    className="text-6xl py-8 pr-32 font-bold leading-tight placeholder:text-lg placeholder:text-slate-400"
                    style={{ fontSize: '48px', lineHeight: '1.1' }}
                    disabled={submitAnswerMutation.isPending || showFeedback}
                  />
                  <Button
                    ref={goButtonRef}
                    onClick={handleSubmitAnswer}
                    disabled={!userAnswer.trim() || submitAnswerMutation.isPending || showFeedback}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 h-16 w-20 rounded-lg bg-emerald-600 hover:bg-emerald-700"
                  >
                    <span className="text-white font-bold text-xl">GO</span>
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
      ) : (
        /* Feedback Card */
        <Card className="mb-6">
          <CardContent className="p-8">
            <div className="max-w-4xl mx-auto text-center space-y-6">
              {/* Result Header */}
              <div className="space-y-3">
                {lastAnswer?.isCorrect ? (
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
                      The answer was: <span className="font-bold text-slate-900">{lastAnswer?.question?.answer || 'Unknown'}</span>
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
                <p className="text-base text-slate-700 leading-relaxed">{lastAnswer?.question?.funFact || 'No fun fact available'}</p>
              </div>

              {/* Continue Button */}
              <div className="text-center">
                <p className="text-lg text-slate-600 mb-4">Press Enter or click Next to continue</p>
                <Button 
                  onClick={handleContinue}
                  size="lg"
                  className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-3 text-lg font-semibold"
                >
                  Next Question →
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timer and Stats */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-2 text-slate-600">
          <Clock className="w-4 h-4" />
          <span>Time remaining: <span className="font-mono font-semibold">{Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}</span></span>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className={`transition-all duration-600 ${
          correctAnswerAnimation 
            ? 'bg-green-300 border-green-500 shadow-green-400 shadow-2xl scale-110 opacity-90' 
            : ''
        }`}>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-emerald-600">{gameState.correctAnswers}</div>
            <div className="text-sm text-slate-600">Correct</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{gameState.questionsAnswered}</div>
            <div className="text-sm text-slate-600">Total</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-amber-600">{gameState.currentStreak}</div>
            <div className="text-sm text-slate-600">Streak</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {gameState.questionsAnswered > 0 ? Math.round((gameState.correctAnswers / gameState.questionsAnswered) * 100) : 0}%
            </div>
            <div className="text-sm text-slate-600">Accuracy</div>
          </CardContent>
        </Card>
      </div>

      {/* Success Animation */}
      <SuccessAnimation 
        isVisible={showSuccessAnimation} 
        onComplete={() => setShowSuccessAnimation(false)} 
      />
    </div>
  );
}