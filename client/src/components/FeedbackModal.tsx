import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Lightbulb, Trophy } from "lucide-react";

interface FeedbackModalProps {
  isOpen: boolean;
  isCorrect: boolean;
  correctAnswer: string;
  funFact: string;
  scoreEarned: number;
  newRank: string;
  onContinue: () => void;
  onClose: () => void;
}

export default function FeedbackModal({
  isOpen,
  isCorrect,
  correctAnswer,
  funFact,
  scoreEarned,
  newRank,
  onContinue,
  onClose
}: FeedbackModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-md w-full transform animate-slide-up">
        <CardContent className="p-8 text-center">
          {/* Correct Answer State */}
          {isCorrect ? (
            <div>
              <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="text-white text-2xl" />
              </div>
              <h3 className="text-2xl font-bold text-emerald-500 mb-2">Excellent!</h3>
              <p className="text-lg text-slate-700 mb-4">
                +{scoreEarned} points! You're now a <span className="font-semibold text-amber-500">{newRank}</span>!
              </p>
            </div>
          ) : (
            /* Incorrect Answer State */
            <div>
              <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="text-white text-2xl" />
              </div>
              <h3 className="text-2xl font-bold text-red-500 mb-2">Not quite!</h3>
              <p className="text-lg text-slate-700 mb-4">
                The answer was <span className="font-semibold text-primary">{correctAnswer}</span>
              </p>
              <p className="text-slate-600 mb-4">
                But hey, you're still a <span className="font-semibold text-amber-500">{newRank}</span>!
              </p>
            </div>
          )}

          {/* Fun Fact */}
          <div className="bg-slate-50 rounded-xl p-4 mb-6">
            <h4 className="font-semibold text-slate-900 mb-2 flex items-center justify-center">
              <Lightbulb className="text-amber-500 mr-2 w-4 h-4" />
              Did you know?
            </h4>
            <p className="text-sm text-slate-600">{funFact}</p>
          </div>

          {/* New Rank Display */}
          <div className="text-center mb-6">
            <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2">
              <Trophy className="mr-2 w-4 h-4" />
              {newRank}
            </Badge>
          </div>

          {/* Continue Button */}
          <Button
            onClick={onContinue}
            className="w-full bg-primary hover:bg-blue-600 text-white font-semibold py-3 rounded-xl"
          >
            Continue Adventure
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
