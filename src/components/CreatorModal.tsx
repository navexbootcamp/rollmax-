import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, RefreshCw, Plus, Trash2, Check, Lock, Unlock, Eye, Sparkles } from 'lucide-react';
import { RolloutConfig } from '../constants/config';
import { generateRelatedTopics } from '../services/topicGenerator';
import { verifyCreatorPasscode, isCreatorAuthenticated, clearCreatorSession } from '../services/auth';

interface CreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: RolloutConfig;
  onSaveConfig: (newConfig: RolloutConfig) => void;
  onPreviewRollout: () => void;
}

export const CreatorModal: React.FC<CreatorModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  onPreviewRollout,
}) => {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passcodeInput, setPasscodeInput] = useState('');
  const [authError, setAuthError] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // Form states
  const [mainTopic, setMainTopic] = useState(config.mainTopic);
  const [stopOn, setStopOn] = useState(config.stopOn);
  const [topics, setTopics] = useState<string[]>(config.generatedTopics);
  const [timerDuration, setTimerDuration] = useState(config.timerDuration || 60);
  const [newTopicInput, setNewTopicInput] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Check existing session
  useEffect(() => {
    if (isOpen) {
      setIsAuthenticated(isCreatorAuthenticated());
      setMainTopic(config.mainTopic);
      setStopOn(config.stopOn);
      setTopics(config.generatedTopics);
      setTimerDuration(config.timerDuration || 60);
      setPasscodeInput('');
      setAuthError(false);
    }
  }, [isOpen, config]);

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!passcodeInput.trim()) return;

    setIsVerifying(true);
    setAuthError(false);

    const valid = await verifyCreatorPasscode(passcodeInput);
    setIsVerifying(false);

    if (valid) {
      setIsAuthenticated(true);
      setPasscodeInput('');
    } else {
      setAuthError(true);
    }
  };

  const handleLock = () => {
    clearCreatorSession();
    setIsAuthenticated(false);
  };

  const handleRegenerate = () => {
    if (!mainTopic.trim() || !stopOn.trim()) return;
    const fresh = generateRelatedTopics(mainTopic, stopOn);
    setTopics(fresh);
  };

  const handleAddTopic = () => {
    if (!newTopicInput.trim()) return;
    if (!topics.includes(newTopicInput.trim())) {
      setTopics([...topics, newTopicInput.trim()]);
    }
    setNewTopicInput('');
  };

  const handleRemoveTopic = (indexToRemove: number) => {
    const updated = topics.filter((_, idx) => idx !== indexToRemove);
    setTopics(updated);
  };

  const handleSave = () => {
    // Ensure stopOn is in topics
    let finalTopics = [...topics];
    if (!finalTopics.map((t) => t.toLowerCase()).includes(stopOn.trim().toLowerCase())) {
      finalTopics.unshift(stopOn.trim());
    }

    const updatedConfig: RolloutConfig = {
      mainTopic: mainTopic.trim(),
      stopOn: stopOn.trim(),
      generatedTopics: finalTopics,
      timerDuration: timerDuration,
      rollDuration: config.rollDuration || 4,
    };

    onSaveConfig(updatedConfig);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleNewRollout = (presetMain: string, presetStop: string) => {
    setMainTopic(presetMain);
    setStopOn(presetStop);
    const fresh = generateRelatedTopics(presetMain, presetStop);
    setTopics(fresh);
  };

  const handlePreviewAndRoll = () => {
    handleSave();
    onClose();
    onPreviewRollout();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-2xl bg-[#0f1015] border-2 border-neutral-300 text-white shadow-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-neutral-700/80 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 bg-white inline-block" />
            <h2 className="text-sm sm:text-base font-mono-tabular font-bold tracking-widest uppercase">
              CREATOR CONTROLS · WOW_NAVEX
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <button
                onClick={handleLock}
                className="px-2.5 py-1 text-[11px] font-mono-tabular text-neutral-400 hover:text-white border border-neutral-700 hover:border-neutral-500 transition-colors flex items-center gap-1 cursor-pointer"
                title="Lock creator session"
              >
                <Lock className="w-3 h-3" />
                <span>LOCK</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 text-neutral-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* VIEW 1: AUTHENTICATION PROMPT */}
        {!isAuthenticated ? (
          <div className="py-6 flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-neutral-900 border border-neutral-400 flex items-center justify-center mb-4">
              <Lock className="w-5 h-5 text-neutral-200" />
            </div>
            <h3 className="text-base font-bold font-mono-tabular tracking-wider uppercase mb-1">
              CREATOR PASSCODE
            </h3>
            <p className="text-xs text-neutral-400 max-w-sm mb-6 font-mono-tabular">
              Verification required to access rollout configurations and topic ecosystems.
            </p>

            <form onSubmit={handleVerify} className="w-full max-w-xs flex flex-col gap-3">
              <input
                type="password"
                autoFocus
                value={passcodeInput}
                onChange={(e) => {
                  setPasscodeInput(e.target.value);
                  setAuthError(false);
                }}
                placeholder="ENTER PASSCODE"
                className={`w-full px-4 py-3 bg-neutral-900 border font-mono-tabular text-center text-sm tracking-widest placeholder:text-neutral-600 focus:outline-none transition-colors ${
                  authError ? 'border-red-500 text-red-300' : 'border-neutral-400 focus:border-white'
                }`}
              />

              {authError && (
                <span className="text-[11px] font-mono-tabular text-red-400">
                  INVALID PASSCODE · ACCESS DENIED
                </span>
              )}

              <button
                type="submit"
                disabled={isVerifying || !passcodeInput.trim()}
                className="w-full py-3 bg-white hover:bg-neutral-200 text-black font-mono-tabular text-xs font-bold tracking-widest uppercase transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Unlock className="w-3.5 h-3.5" />
                <span>{isVerifying ? 'VERIFYING...' : 'UNLOCK CREATOR PANEL'}</span>
              </button>
            </form>
          </div>
        ) : (
          /* VIEW 2: CREATOR CONTROLS */
          <div className="flex flex-col gap-6">
            
            {/* Quick Rollout Presets */}
            <div className="flex items-center justify-between text-xs font-mono-tabular pb-3 border-b border-neutral-800">
              <span className="text-neutral-400 uppercase tracking-wider font-semibold">
                PRESETS / NEW ROLLOUT:
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleNewRollout('AI Startups', 'AI Agents')}
                  className="px-2 py-1 bg-neutral-900 border border-neutral-700 hover:border-neutral-400 text-neutral-300 hover:text-white transition-colors cursor-pointer text-[10px]"
                >
                  AI → Agents
                </button>
                <button
                  type="button"
                  onClick={() => handleNewRollout('Fitness', 'Calisthenics')}
                  className="px-2 py-1 bg-neutral-900 border border-neutral-700 hover:border-neutral-400 text-neutral-300 hover:text-white transition-colors cursor-pointer text-[10px]"
                >
                  Fitness → Calisthenics
                </button>
                <button
                  type="button"
                  onClick={() => handleNewRollout('Technology', 'Robotics')}
                  className="px-2 py-1 bg-neutral-900 border border-neutral-700 hover:border-neutral-400 text-neutral-300 hover:text-white transition-colors cursor-pointer text-[10px]"
                >
                  Tech → Robotics
                </button>
              </div>
            </div>

            {/* Inputs: Main Topic & Stop On Topic */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-mono-tabular font-bold tracking-widest text-neutral-300 uppercase mb-2">
                  01. MAIN TOPIC
                </label>
                <input
                  type="text"
                  value={mainTopic}
                  onChange={(e) => setMainTopic(e.target.value)}
                  placeholder="e.g. AI Startups"
                  className="w-full px-3.5 py-2.5 bg-neutral-900 border border-neutral-400 focus:border-white font-mono-tabular text-sm text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono-tabular font-bold tracking-widest text-neutral-300 uppercase mb-2">
                  02. STOP ON (DETERMINISTIC)
                </label>
                <input
                  type="text"
                  value={stopOn}
                  onChange={(e) => setStopOn(e.target.value)}
                  placeholder="e.g. AI Agents"
                  className="w-full px-3.5 py-2.5 bg-neutral-900 border-2 border-white focus:border-white font-mono-tabular text-sm text-white font-bold focus:outline-none"
                />
                <span className="text-[10px] font-mono-tabular text-neutral-400 mt-1 block">
                  Roller will always stop exactly on this topic.
                </span>
              </div>
            </div>

            {/* Timer Duration Setting */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-neutral-900/60 border border-neutral-700">
              <div>
                <span className="text-xs font-mono-tabular font-bold uppercase tracking-wider text-neutral-200 block">
                  COUNTDOWN CHALLENGE TIMER
                </span>
                <span className="text-[11px] text-neutral-400 font-mono-tabular">
                  Appears under the stopped topic when roller halts.
                </span>
              </div>
              <div className="flex items-center gap-1.5 font-mono-tabular">
                {[30, 45, 60, 90].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setTimerDuration(d)}
                    className={`px-3 py-1.5 text-xs font-bold border transition-colors cursor-pointer ${
                      timerDuration === d
                        ? 'bg-white text-black border-white'
                        : 'bg-neutral-800 text-neutral-300 border-neutral-600 hover:border-neutral-400'
                    }`}
                  >
                    {d}s
                  </button>
                ))}
              </div>
            </div>

            {/* Generated Topics Ecosystem */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[11px] font-mono-tabular font-bold tracking-widest text-neutral-300 uppercase flex items-center gap-2">
                  <span>GENERATED TOPIC ECOSYSTEM ({topics.length})</span>
                </label>
                <button
                  type="button"
                  onClick={handleRegenerate}
                  className="text-xs font-mono-tabular text-neutral-300 hover:text-white flex items-center gap-1.5 cursor-pointer underline decoration-neutral-600 hover:decoration-white transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>GENERATE AGAIN</span>
                </button>
              </div>

              {/* Tag / Chip Grid */}
              <div className="p-3 bg-neutral-900/50 border border-neutral-700 max-h-48 overflow-y-auto flex flex-wrap gap-2">
                {topics.map((t, idx) => {
                  const isStop = t.toLowerCase() === stopOn.toLowerCase();
                  return (
                    <div
                      key={`${t}-${idx}`}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono-tabular border transition-all ${
                        isStop
                          ? 'bg-neutral-200 text-black border-white font-bold'
                          : 'bg-neutral-900 text-neutral-300 border-neutral-700'
                      }`}
                    >
                      <span>{t}</span>
                      {isStop ? (
                        <span className="text-[9px] px-1 bg-black text-white font-semibold">
                          STOP
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleRemoveTopic(idx)}
                          className="text-neutral-500 hover:text-red-400 transition-colors cursor-pointer ml-1"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Manual Add Topic Input */}
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="text"
                  value={newTopicInput}
                  onChange={(e) => setNewTopicInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddTopic()}
                  placeholder="ADD CUSTOM TOPIC..."
                  className="flex-1 px-3 py-1.5 bg-neutral-900 border border-neutral-600 focus:border-white font-mono-tabular text-xs text-white focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddTopic}
                  disabled={!newTopicInput.trim()}
                  className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 border border-neutral-600 text-white font-mono-tabular text-xs font-semibold uppercase transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-40"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>ADD</span>
                </button>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="border-t border-neutral-800 pt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-[11px] font-mono-tabular text-neutral-400">
                {saveSuccess ? '✓ CONFIG SAVED & PERSISTED' : 'PERSISTED LOCALLY'}
              </span>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleSave}
                  className="flex-1 sm:flex-none px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 border border-neutral-400 text-white font-mono-tabular text-xs font-bold tracking-wider uppercase transition-colors cursor-pointer"
                >
                  SAVE CONFIG
                </button>

                <button
                  type="button"
                  onClick={handlePreviewAndRoll}
                  className="flex-1 sm:flex-none px-5 py-2.5 bg-white hover:bg-neutral-200 text-black font-mono-tabular text-xs font-bold tracking-wider uppercase transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>PREVIEW & ROLL</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
