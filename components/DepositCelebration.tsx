"use client";

import { motion, AnimatePresence } from 'motion/react';
import { useEffect, useState } from 'react';
import { Coins, TrendingUp, Sparkles, Zap } from 'lucide-react';

interface DepositCelebrationProps {
  show: boolean;
  amount: number;
  onComplete?: () => void;
}

export default function DepositCelebration({ show, amount, onComplete }: DepositCelebrationProps) {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([]);

  useEffect(() => {
    if (show) {
      // Generate random particles
      const newParticles = Array.from({ length: 30 }, (_, i) => ({
        id: i,
        x: Math.random() * 200 - 100,
        y: Math.random() * 200 - 100,
        delay: Math.random() * 0.2
      }));
      setParticles(newParticles);

      // Auto-complete after animation
      const timer = setTimeout(() => {
        onComplete?.();
      }, 3000);

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
          className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
        >
          {/* Overlay with gradient pulse */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.8 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-gradient-to-r from-lime-500/20 via-lime-400/30 to-lime-500/20"
          />

          {/* Central success message */}
          <motion.div
            initial={{ scale: 0, rotate: -180, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            exit={{ scale: 0, rotate: 180, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="relative z-10"
          >
            <div className="bg-gradient-to-br from-lime-500/20 to-lime-600/30 backdrop-blur-xl border-2 border-lime-400 rounded-2xl p-8 shadow-2xl">
              {/* Success Icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
                className="flex justify-center mb-4"
              >
                <div className="relative">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    className="absolute inset-0 rounded-full border-4 border-t-lime-400 border-r-transparent border-b-lime-400 border-l-transparent"
                  />
                  <div className="w-20 h-20 bg-lime-500/30 rounded-full flex items-center justify-center">
                    <Coins className="text-lime-400" size={40} />
                  </div>
                </div>
              </motion.div>

              {/* Success Text */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-center"
              >
                <h3 className="text-3xl font-bold text-lime-400 mb-2">
                  Deposit Successful!
                </h3>
                <p className="text-2xl font-mono text-white mb-1">
                  {amount.toFixed(4)} SOL
                </p>
                <p className="text-sm text-gray-300">
                  You're in the running! 🏆
                </p>
              </motion.div>

              {/* Sparkle effects */}
              <div className="flex justify-center gap-4 mt-4">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: [0, 1.5, 1], opacity: [0, 1, 0] }}
                    transition={{ delay: 0.4 + i * 0.1, duration: 1, repeat: Infinity }}
                  >
                    <Sparkles className="text-lime-400" size={20} />
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Particle explosion effect */}
          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
              animate={{
                x: particle.x * 3,
                y: particle.y * 3,
                scale: 0,
                opacity: 0
              }}
              transition={{
                delay: particle.delay,
                duration: 1.5,
                ease: 'easeOut'
              }}
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
            >
              {particle.id % 3 === 0 ? (
                <Coins className="text-lime-400" size={16} />
              ) : particle.id % 3 === 1 ? (
                <Zap className="text-lime-400" size={16} />
              ) : (
                <TrendingUp className="text-lime-400" size={16} />
              )}
            </motion.div>
          ))}

          {/* Ripple effect */}
          {[0, 1, 2].map((i) => (
            <motion.div
              key={`ripple-${i}`}
              initial={{ scale: 0, opacity: 0.8 }}
              animate={{ scale: 3, opacity: 0 }}
              transition={{
                delay: i * 0.3,
                duration: 1.5,
                ease: 'easeOut'
              }}
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 border-4 border-lime-400 rounded-full"
            />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
