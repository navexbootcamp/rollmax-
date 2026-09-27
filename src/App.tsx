import React, { useState, useCallback } from 'react';
import { TopBar } from './components/TopBar';
import { TopicRoller } from './components/TopicRoller';
import { CreatorModal } from './components/CreatorModal';
import { DEFAULT_CONFIG, RolloutConfig, STORAGE_KEY } from './constants/config';

export default function App() {
  // Load saved configuration from localStorage or use default
  const [config, setConfig] = useState<RolloutConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // fallback
    }
    return DEFAULT_CONFIG;
  });

  const [isCreatorOpen, setIsCreatorOpen] = useState(false);

  // Save config to localStorage
  const handleSaveConfig = useCallback((newConfig: RolloutConfig) => {
    setConfig(newConfig);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));
    } catch (err) {
      console.error('Failed to persist config', err);
    }
  }, []);

  return (
    <div className="relative min-h-[100dvh] w-full flex flex-col justify-between dot-grid text-[#121316] overflow-x-hidden selection:bg-neutral-800 selection:text-white">
      {/* Subtle Hairline Vertical Center Guide seen in screenshots */}
      <div className="w-[1px] bg-black/[0.06] absolute inset-y-0 left-1/2 pointer-events-none z-0" />

      {/* Top Bar with creator signature and hidden creator trigger */}
      <TopBar onTriggerCreator={() => setIsCreatorOpen(true)} />

      {/* Main Focus Canvas: Topic Roller + 60s Challenge Timer + Ticks Bar + Action Controls */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-2 sm:px-6 py-2 sm:py-6 w-full max-w-4xl mx-auto">
        <TopicRoller
          key={`${config.mainTopic}-${config.stopOn}-${config.timerDuration}-${config.generatedTopics.length}-${config.generatedTopics[0] || ''}`}
          mainTopic={config.mainTopic}
          stopOn={config.stopOn}
          topicPool={config.generatedTopics}
          timerDuration={config.timerDuration || 60}
          onOpenCreator={() => setIsCreatorOpen(true)}
        />
      </main>

      {/* Understated Minimalist Footer */}
      <footer className="relative z-20 w-full px-4 sm:px-12 py-3 sm:py-4 flex items-center justify-between text-[10px] font-mono-tabular tracking-widest text-neutral-400 select-none uppercase">
        <div
          onClick={() => setIsCreatorOpen(true)}
          className="text-neutral-400 cursor-default select-none"
        >
          SYS // 001
        </div>
        <div className="text-neutral-400">
          FOUNDER REEL INSTRUMENT
        </div>
      </footer>

      {/* Secret Creator Modal (Protected by passcode NAVERAJ7988) */}
      <CreatorModal
        isOpen={isCreatorOpen}
        onClose={() => setIsCreatorOpen(false)}
        config={config}
        onSaveConfig={handleSaveConfig}
        onPreviewRollout={() => {
          setIsCreatorOpen(false);
        }}
      />
    </div>
  );
}
