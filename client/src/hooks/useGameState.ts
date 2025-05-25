import { useState, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { GameMode, Region, GameSession } from "@shared/schema";

interface GameState {
  selectedMode: GameMode | null;
  selectedRegion: Region | null;
  sessionId: number | null;
  isPlaying: boolean;
  score: number;
  questionsAnswered: number;
  correctAnswers: number;
  currentStreak: number;
  maxStreak: number;
  currentQuestion: number;
}

export function useGameState() {
  const [gameState, setGameState] = useState<GameState>({
    selectedMode: null,
    selectedRegion: null,
    sessionId: null,
    isPlaying: false,
    score: 0,
    questionsAnswered: 0,
    correctAnswers: 0,
    currentStreak: 0,
    maxStreak: 0,
    currentQuestion: 0,
  });

  // Create game session mutation
  const createSessionMutation = useMutation({
    mutationFn: async (sessionData: { mode: GameMode; region: Region; userId?: number }) => {
      const response = await apiRequest("POST", "/api/sessions", sessionData);
      return response.json();
    },
    onSuccess: (session: GameSession) => {
      setGameState(prev => ({
        ...prev,
        sessionId: session.id,
        isPlaying: true
      }));
    }
  });

  // Complete game session mutation
  const completeSessionMutation = useMutation({
    mutationFn: async (sessionId: number) => {
      const response = await apiRequest("POST", `/api/sessions/${sessionId}/complete`);
      return response.json();
    },
    onSuccess: () => {
      setGameState(prev => ({
        ...prev,
        isPlaying: false
      }));
    }
  });

  const setSelectedMode = useCallback((mode: GameMode) => {
    setGameState(prev => ({ ...prev, selectedMode: mode }));
  }, []);

  const setSelectedRegion = useCallback((region: Region) => {
    setGameState(prev => ({ ...prev, selectedRegion: region }));
  }, []);

  const startGame = useCallback(() => {
    if (!gameState.selectedMode || !gameState.selectedRegion) return;
    
    createSessionMutation.mutate({
      mode: gameState.selectedMode,
      region: gameState.selectedRegion,
      userId: 1 // Default user for demo
    });
  }, [gameState.selectedMode, gameState.selectedRegion]);

  const updateScore = useCallback((points: number) => {
    setGameState(prev => ({
      ...prev,
      score: prev.score + points
    }));
  }, []);

  const incrementQuestion = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      questionsAnswered: prev.questionsAnswered + 1,
      correctAnswers: prev.correctAnswers + 1,
      currentStreak: prev.currentStreak + 1,
      maxStreak: Math.max(prev.maxStreak, prev.currentStreak + 1)
    }));
  }, []);

  const setCurrentQuestion = useCallback((questionIndex: number) => {
    setGameState(prev => ({
      ...prev,
      currentQuestion: questionIndex
    }));
  }, []);

  const completeGame = useCallback(() => {
    if (gameState.sessionId) {
      completeSessionMutation.mutate(gameState.sessionId);
    }
  }, [gameState.sessionId]);

  const resetGame = useCallback(() => {
    setGameState({
      selectedMode: null,
      selectedRegion: null,
      sessionId: null,
      isPlaying: false,
      score: 0,
      questionsAnswered: 0,
      correctAnswers: 0,
      currentStreak: 0,
      maxStreak: 0,
      currentQuestion: 0,
    });
  }, []);

  return {
    gameState,
    setSelectedMode,
    setSelectedRegion,
    startGame,
    updateScore,
    incrementQuestion,
    setCurrentQuestion,
    completeGame,
    resetGame,
    isCreatingSession: createSessionMutation.isPending,
    isCompletingSession: completeSessionMutation.isPending
  };
}
