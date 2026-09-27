import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Play, Pause, RotateCcw, Check } from 'lucide-react';

interface ChallengeTimerProps {
  duration: number; // default 60 seconds
  stoppedTopic: string;
  onRollAgain: () => void;
}

export const ChallengeTimer: React.FC<ChallengeTimerProps> = ({
  duration = 60,
  stoppedTopic,
  onRollAgain,
}) => {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isRunning, setIsRunning] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const timerRef = useRef<number | null>(null);

  // Sync if duration changes
  useEffect(() => {
    setTimeLeft(duration);
    setIsRunning(false);
    setIsCompleted(false);
  }, [duration, stoppedTopic]);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      timerRef.current = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setIsRunning(false);
            setIsCompleted(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, timeLeft]);

  const handleStart = () => {
    if (timeLeft === 0) {
      setTimeLeft(duration);
      setIsCompleted(false);
    }
    setIsRunning(true);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setIsCompleted(false);
    setTimeLeft(duration);
  };

  const progressPercent = ((duration - timeLeft) / duration) * 100;
  const strokeDashoffset = 283 - (283 * progressPercent) / 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-md mx-auto mt-6 flex flex-col items-center select-none"
    >
      {/* High-visibility divider mark */}
      <div className="w-full flex items-center justify-center gap-3 my-2">
        <div className="h-[1.5px] w-12 bg-neutral-400" />
        <span className="text-[10px] font-mono-tabular tracking-[0.25em] text-neutral-300 font-bold uppercase">
          TOPIC LOCKED · 60s BREAKDOWN
        </span>
        <div className="h-[1.5px] w-12 bg-neutral-400" />
      </div>

      {/* Main Timer Display Unit */}
      <div className="relative w-full bg-neutral-900/90 border-2 border-neutral-300 p-6 sm:p-7 flex flex-col items-center mt-2 shadow-[0_4px_24px_rgba(0,0,0,0.5)]">
        
        {/* Subtle corner registration dots */}
        <span className="absolute top-2 left-2 w-1.5 h-1.5 bg-neutral-300" />
        <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-neutral-300" />
        <span className="absolute bottom-2 left-2 w-1.5 h-1.5 bg-neutral-300" />
        <span className="absolute bottom-2 right-2 w-1.5 h-1.5 bg-neutral-300" />

        {/* Circular Progress & Large Numeric Countdown */}
        <div className="relative flex items-center justify-center my-2">
          <svg className="w-32 h-32 sm:w-36 sm:h-36 -rotate-90 transform" viewBox="0 0 100 100">
            {/* Background Track */}
            <circle
              cx="50"
              cy="50"
              r="45"
              className="text-neutral-800"
              strokeWidth="4"
              stroke="currentColor"
              fill="transparent"
            />
            {/* Active Progress Track */}
            <circle
              cx="50"
              cy="50"
              r="45"
              className="text-white transition-all duration-300 ease-linear"
              strokeWidth="4"
              strokeDasharray={283}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
            />
          </svg>

          {/* Central Digits */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl sm:text-5xl font-mono-tabular font-bold tracking-tight text-white">
              {String(timeLeft).padStart(2, '0')}
            </span>
            <span className="text-[10px] font-mono-tabular tracking-widest text-neutral-400 font-semibold uppercase mt-0.5">
              SECONDS
            </span>
          </div>
        </div>

        {/* Completion Announcement */}
        {isCompleted && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="my-2 px-3 py-1 bg-white text-black font-mono-tabular text-xs font-bold tracking-wider uppercase flex items-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5 stroke-[3]" />
            <span>60s COMPLETE</span>
          </motion.div>
        )}

        {/* Action Controls */}
        <div className="w-full flex items-center justify-center gap-3 mt-4">
          {!isRunning && !isCompleted && timeLeft === duration && (
            <button
              onClick={handleStart}
              className="w-full py-3 px-6 bg-white hover:bg-neutral-200 text-black font-mono-tabular text-sm font-bold tracking-wider uppercase transition-all duration-150 active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              <Play className="w-4 h-4 fill-black" />
              <span>START {duration}s TIMER</span>
            </button>
          )}

          {isRunning && (
            <button
              onClick={handlePause}
              className="flex-1 py-2.5 px-4 bg-neutral-800 hover:bg-neutral-700 border border-neutral-400 text-white font-mono-tabular text-xs font-semibold tracking-wider uppercase transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Pause className="w-3.5 h-3.5" />
              <span>PAUSE</span>
            </button>
          )}

          {!isRunning && timeLeft < duration && !isCompleted && (
            <button
              onClick={handleStart}
              className="flex-1 py-2.5 px-4 bg-white hover:bg-neutral-200 text-black font-mono-tabular text-xs font-bold tracking-wider uppercase transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-black" />
              <span>RESUME</span>
            </button>
          )}

          {(timeLeft < duration || isCompleted) && (
            <button
              onClick={handleReset}
              className="py-2.5 px-4 bg-neutral-800 hover:bg-neutral-700 border border-neutral-500 text-neutral-300 hover:text-white font-mono-tabular text-xs font-semibold tracking-wider uppercase transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              title="Reset Timer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>RESET</span>
            </button>
          )}
        </div>

        {/* Secondary: Roll Again option */}
        <div className="mt-4 pt-3 border-t border-neutral-700/80 w-full flex items-center justify-between text-xs font-mono-tabular">
          <span className="text-neutral-400 text-[11px]">FOUNDER REEL REC</span>
          <button
            onClick={onRollAgain}
            className="text-neutral-300 hover:text-white underline decoration-neutral-500 hover:decoration-white font-semibold transition-colors cursor-pointer text-[11px] tracking-wider uppercase"
          >
            ← ROLL AGAIN
          </button>
        </div>
      </div>
    </motion.div>
  );
};
