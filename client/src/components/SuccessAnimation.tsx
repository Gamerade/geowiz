import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface SuccessAnimationProps {
  isVisible: boolean;
  onComplete?: () => void;
}

export default function SuccessAnimation({ isVisible, onComplete }: SuccessAnimationProps) {
  const [confettiPieces, setConfettiPieces] = useState<Array<{ id: number; x: number; y: number; color: string; rotation: number }>>([]);
  const [sparkles, setSparkles] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([]);

  useEffect(() => {
    if (isVisible) {
      // Generate confetti pieces
      const newConfetti = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: -10,
        color: ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'][Math.floor(Math.random() * 5)],
        rotation: Math.random() * 360
      }));

      // Generate sparkles
      const newSparkles = Array.from({ length: 8 }, (_, i) => ({
        id: i,
        x: 20 + Math.random() * 60,
        y: 20 + Math.random() * 60,
        delay: i * 0.1
      }));

      setConfettiPieces(newConfetti);
      setSparkles(newSparkles);

      // Clean up after animation
      const timer = setTimeout(() => {
        setConfettiPieces([]);
        setSparkles([]);
        onComplete?.();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isVisible, onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {/* Confetti */}
          {confettiPieces.map((piece) => (
            <motion.div
              key={piece.id}
              className="absolute w-3 h-3 rounded-sm"
              style={{
                backgroundColor: piece.color,
                left: `${piece.x}%`,
                top: `${piece.y}%`,
              }}
              initial={{
                y: -20,
                rotation: piece.rotation,
                opacity: 1,
                scale: 1
              }}
              animate={{
                y: window.innerHeight + 50,
                rotation: piece.rotation + 720,
                opacity: 0,
                scale: 0.5
              }}
              transition={{
                duration: 2.5,
                ease: "easeOut",
                delay: Math.random() * 0.5
              }}
            />
          ))}

          {/* Sparkles */}
          {sparkles.map((sparkle) => (
            <motion.div
              key={sparkle.id}
              className="absolute"
              style={{
                left: `${sparkle.x}%`,
                top: `${sparkle.y}%`,
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ 
                scale: [0, 1.5, 0],
                opacity: [0, 1, 0],
                rotate: [0, 180, 360]
              }}
              transition={{
                duration: 1.2,
                delay: sparkle.delay,
                ease: "easeOut"
              }}
            >
              <div className="w-4 h-4 relative">
                {/* Star shape using CSS */}
                <div className="absolute inset-0 bg-yellow-400 transform rotate-0" 
                     style={{
                       clipPath: "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)"
                     }} 
                />
              </div>
            </motion.div>
          ))}

          {/* Success burst */}
          <motion.div
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.2, 0], opacity: [0, 0.8, 0] }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="w-32 h-32 rounded-full bg-gradient-to-r from-emerald-400 to-blue-500 opacity-20" />
          </motion.div>

          {/* Success text */}
          <motion.div
            className="absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
            initial={{ scale: 0, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0, opacity: 0, y: -20 }}
            transition={{ duration: 0.6, ease: "backOut" }}
          >
            <div className="text-4xl font-bold text-emerald-600 text-center drop-shadow-lg">
              🎉 Correct! 🎉
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}