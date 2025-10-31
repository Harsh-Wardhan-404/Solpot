"use client";

import { motion, AnimatePresence } from 'motion/react';
import { useEffect, useState } from 'react';
import { Trophy, Sparkles, Coins, Crown, Zap } from 'lucide-react';

interface WinnerCelebrationProps {
  show: boolean;
  amount: number;
  winnerAmount: number;
  onComplete?: () => void;
}

export default function WinnerCelebration({ show, amount, winnerAmount, onComplete }: WinnerCelebrationProps) {
  const [crackedPieces, setCrackedPieces] = useState<Array<{ id: number; x: number; y: number; rotate: number }>>([]);
  const [confetti, setConfetti] = useState<Array<{ id: number; x: number; y: number; color: string; delay: number }>>([]);

  useEffect(() => {
    if (show) {
      // Generate pot crack pieces
      const pieces = Array.from({ length: 8 }, (_, i) => ({
        id: i,
        x: (Math.random() - 0.5) * 400,
        y: (Math.random() - 0.5) * 400,
        rotate: Math.random() * 720 - 360
      }));
      setCrackedPieces(pieces);

      // Generate confetti
      const confettiArray = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        x: Math.random() * window.innerWidth,
        y: -50,
        color: ['#84cc16', '#fbbf24', '#f59e0b', '#eab308', '#facc15'][Math.floor(Math.random() * 5)],
        delay: Math.random() * 0.5
      }));
      setConfetti(confettiArray);

      // Auto-complete after animation
      const timer = setTimeout(() => {
        onComplete?.();
      }, 6000);

      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
          style={{ pointerEvents: 'none' }}
        >
          {/* Dark overlay with gold shimmer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.95 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black"
          />

          {/* Radial gold glow */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 3, opacity: 0.3 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="absolute inset-0 bg-gradient-radial from-yellow-500/50 via-transparent to-transparent"
            style={{
              background: 'radial-gradient(circle, rgba(234, 179, 8, 0.5) 0%, transparent 70%)'
            }}
          />

          {/* Pot explosion animation */}
          <div className="relative w-64 h-64">
            {/* Intact pot (fades out) */}
            <motion.div
              initial={{ scale: 1, opacity: 1 }}
              animate={{ scale: 1.2, opacity: 0 }}
              transition={{ duration: 0.3, delay: 0.5 }}
              className="absolute inset-0"
            >
              <svg viewBox="0 0 200 200" className="w-full h-full">
                <defs>
                  <linearGradient id="goldGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.7" />
                  </linearGradient>
                </defs>
                <path
                  d="M 50 80 Q 50 60, 60 50 L 140 50 Q 150 60, 150 80 L 160 160 Q 160 170, 150 170 L 50 170 Q 40 170, 40 160 Z"
                  fill="url(#goldGradient)"
                  stroke="#fbbf24"
                  strokeWidth="3"
                />
              </svg>
            </motion.div>

            {/* Cracking effect */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 0.3, delay: 0.3 }}
              className="absolute inset-0"
            >
              <svg viewBox="0 0 200 200" className="w-full h-full">
                {/* Lightning crack lines */}
                <motion.path
                  d="M 100 50 L 95 80 L 105 85 L 100 120"
                  stroke="#fff"
                  strokeWidth="2"
                  fill="none"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.2, delay: 0.3 }}
                />
                <motion.path
                  d="M 60 70 L 70 100 L 60 130"
                  stroke="#fff"
                  strokeWidth="2"
                  fill="none"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.2, delay: 0.35 }}
                />
                <motion.path
                  d="M 140 70 L 130 100 L 140 130"
                  stroke="#fff"
                  strokeWidth="2"
                  fill="none"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.2, delay: 0.4 }}
                />
              </svg>
            </motion.div>

            {/* Exploding pot pieces */}
            {crackedPieces.map((piece, index) => (
              <motion.div
                key={piece.id}
                className="absolute"
                style={{
                  top: '50%',
                  left: '50%',
                  width: '50px',
                  height: '50px',
                }}
                initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 1 }}
                animate={{
                  x: piece.x,
                  y: piece.y,
                  rotate: piece.rotate,
                  opacity: 0,
                  scale: 0.5
                }}
                transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
              >
                <svg viewBox="0 0 50 50" className="w-full h-full">
                  <path
                    d={`M ${10 + index * 5} ${10 + index * 3} L ${30 + index * 2} ${15 + index} L ${25 - index} ${35 + index * 2} Z`}
                    fill="#fbbf24"
                    stroke="#f59e0b"
                    strokeWidth="2"
                  />
                </svg>
              </motion.div>
            ))}

            {/* Explosion flash */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 4, opacity: [0, 1, 0] }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="absolute inset-0 bg-yellow-300 rounded-full blur-xl"
            />
          </div>

          {/* Confetti rain */}
          {confetti.map((piece) => (
            <motion.div
              key={piece.id}
              className="absolute w-3 h-3 rounded-sm"
              style={{
                left: piece.x,
                backgroundColor: piece.color,
                boxShadow: `0 0 10px ${piece.color}`
              }}
              initial={{ y: piece.y, opacity: 1, rotate: 0 }}
              animate={{
                y: window.innerHeight + 100,
                rotate: 360 * 3,
                opacity: [1, 1, 0]
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                delay: 0.5 + piece.delay,
                ease: "easeIn"
              }}
            />
          ))}

          {/* Winner announcement - slides up after explosion */}
          <motion.div
            initial={{ y: 100, opacity: 0, scale: 0.8 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            transition={{ delay: 1, type: 'spring', stiffness: 200, damping: 20 }}
            className="absolute"
          >
            <div className="relative">
              {/* Glowing background */}
              <motion.div
                animate={{
                  boxShadow: [
                    '0 0 40px rgba(234, 179, 8, 0.5)',
                    '0 0 80px rgba(234, 179, 8, 0.8)',
                    '0 0 40px rgba(234, 179, 8, 0.5)'
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-3xl blur-xl"
              />

              {/* Main card */}
              <div className="relative bg-gradient-to-br from-yellow-500/30 via-orange-500/20 to-yellow-600/30 backdrop-blur-xl border-4 border-yellow-400 rounded-3xl p-12 shadow-2xl">
                {/* Crown animation */}
                <motion.div
                  initial={{ y: 20, rotate: -10 }}
                  animate={{
                    y: [0, -10, 0],
                    rotate: [-10, 10, -10]
                  }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="flex justify-center mb-6"
                >
                  <div className="relative">
                    <Crown className="text-yellow-400" size={80} fill="#fbbf24" />
                    {/* Sparkles around crown */}
                    {[...Array(6)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute"
                        style={{
                          top: '50%',
                          left: '50%',
                          transform: `rotate(${i * 60}deg) translateY(-50px)`
                        }}
                        animate={{
                          scale: [0, 1.5, 0],
                          opacity: [0, 1, 0]
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          delay: i * 0.2
                        }}
                      >
                        <Sparkles className="text-yellow-300" size={20} />
                      </motion.div>
                    ))}
                  </div>
                </motion.div>

                {/* Winner text */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 1.2, type: 'spring', stiffness: 300 }}
                  className="text-center mb-6"
                >
                  <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-yellow-400 to-orange-400 mb-4 drop-shadow-lg">
                    🎉 WINNER! 🎉
                  </h1>
                  <p className="text-2xl text-yellow-100 font-bold mb-2">
                    You Made The Winning Deposit!
                  </p>
                  <p className="text-lg text-gray-300">
                    Your deposit of <span className="text-yellow-400 font-bold">{amount.toFixed(4)} SOL</span> sealed the pot!
                  </p>
                </motion.div>

                {/* Prize amount */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 1.5, type: 'spring', stiffness: 200 }}
                  className="bg-gradient-to-r from-yellow-600/30 to-orange-600/30 rounded-2xl p-8 border-2 border-yellow-400/50 mb-6"
                >
                  <div className="text-center">
                    <p className="text-yellow-200 text-sm mb-2 font-semibold">YOUR PRIZE</p>
                    <div className="flex items-center justify-center gap-3 mb-2">
                      <Trophy className="text-yellow-400" size={40} />
                      <p className="text-6xl font-black text-yellow-400 drop-shadow-lg">
                        {winnerAmount.toFixed(4)}
                      </p>
                      <Coins className="text-yellow-400" size={40} />
                    </div>
                    <p className="text-3xl font-bold text-yellow-300">SOL</p>
                    <p className="text-sm text-gray-400 mt-2">
                      (90% of the pot)
                    </p>
                  </div>
                </motion.div>

                {/* Lightning bolts */}
                <div className="flex justify-center gap-6">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      animate={{
                        scale: [1, 1.3, 1],
                        rotate: [0, 15, -15, 0]
                      }}
                      transition={{
                        duration: 0.5,
                        repeat: Infinity,
                        delay: i * 0.15,
                        repeatDelay: 1
                      }}
                    >
                      <Zap className="text-yellow-400" size={32} fill="#fbbf24" />
                    </motion.div>
                  ))}
                </div>

                {/* Subtitle */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 2 }}
                  className="text-center text-yellow-200 text-sm mt-6 font-semibold"
                >
                  🏆 Perfect Timing! You're The Champion! 🏆
                </motion.p>
              </div>
            </div>
          </motion.div>

          {/* Fireworks */}
          {[...Array(10)].map((_, i) => (
            <motion.div
              key={`firework-${i}`}
              className="absolute"
              style={{
                left: `${20 + i * 8}%`,
                top: `${20 + (i % 3) * 20}%`
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{
                scale: [0, 2, 0],
                opacity: [0, 1, 0]
              }}
              transition={{
                duration: 1.5,
                delay: 1 + i * 0.2,
                repeat: Infinity,
                repeatDelay: 2
              }}
            >
              <div className="w-2 h-2 bg-yellow-400 rounded-full shadow-lg shadow-yellow-400" />
            </motion.div>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
