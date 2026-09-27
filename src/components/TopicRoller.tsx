import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';

interface TopicRollerProps {
  mainTopic: string;
  stopOn: string;
  topicPool: string[];
  timerDuration: number;
  onOpenCreator?: () => void;
}

const TOTAL_STEPS = 29; // Matches "SEQ 0000 / 0029" exactly from screenshots
const DESKTOP_ROW_HEIGHT = 92;
const MOBILE_ROW_HEIGHT = 74;

export const TopicRoller: React.FC<TopicRollerProps> = ({
  mainTopic,
  stopOn,
  topicPool,
  timerDuration = 60,
}) => {
  // Application execution states: 'idle' | 'running' | 'stopped'
  const [state, setState] = useState<'idle' | 'running' | 'stopped'>('idle');

  // Track viewport width for responsive row height
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const rowHeight = isMobile ? MOBILE_ROW_HEIGHT : DESKTOP_ROW_HEIGHT;
  const viewportHeight = rowHeight * 3; // Exactly 3 visible rows (top preview, center focal, bottom preview)
  const centerFocalY = rowHeight; // Center row begins at 1 * rowHeight

  // DOM Refs for Direct GPU Compositor Animation (Zero React Re-render jank during the roll!)
  const tapeRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const seqTextRef = useRef<HTMLSpanElement>(null);
  const velTextRef = useRef<HTMLSpanElement>(null);
  const gaugeTrackRef = useRef<HTMLDivElement>(null);

  const animFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  // 60-Second Challenge Timer Countdown
  const [secondsLeft, setSecondsLeft] = useState(timerDuration);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const countdownIntervalRef = useRef<number | null>(null);

  // Sync timer if duration changes
  useEffect(() => {
    setSecondsLeft(timerDuration);
  }, [timerDuration]);

  // Construct deterministic tape of 30 items (index 0 to 29)
  const tape = useMemo(() => {
    const pool = topicPool.filter(
      (t) => t.toLowerCase() !== stopOn.toLowerCase() && t.toLowerCase() !== mainTopic.toLowerCase()
    );
    const sequence: string[] = [];

    // Step 0: Main Topic
    sequence.push(mainTopic);

    // Intermediate rollout topics (step 1 to 28)
    for (let i = 1; i < TOTAL_STEPS; i++) {
      const item = pool[i % pool.length] || `Topic ${i}`;
      sequence.push(item);
    }

    // Step 29: Predetermined Stop On Topic (Guaranteed deterministic landing)
    sequence.push(stopOn);
    return sequence;
  }, [mainTopic, stopOn, topicPool]);

  const targetOffset = TOTAL_STEPS * rowHeight;

  // Ultra-Smooth 60/120fps Kinetic Deceleration Roll Engine
  const startRoll = useCallback(() => {
    if (state === 'running') return;
    setState('running');
    setIsTimerRunning(false);
    setSecondsLeft(timerDuration);

    const rollDuration = 3850; // ~3.85 seconds, strictly in the 3-5s window
    startTimeRef.current = performance.now();

    // Custom Quintic Deceleration: starts with high velocity and settles naturally with physical inertia
    const easeOutQuintic = (t: number) => 1 - Math.pow(1 - t, 4.4);

    const loop = (now: number) => {
      const elapsed = now - startTimeRef.current;
      const progress = Math.min(elapsed / rollDuration, 1);
      const eased = easeOutQuintic(progress);

      const currentScrollY = eased * targetOffset;
      const currentStep = Math.min(Math.floor(eased * TOTAL_STEPS), TOTAL_STEPS);

      // Direct GPU Compositor Update for the moving tape:
      if (tapeRef.current) {
        tapeRef.current.style.transform = `translate3d(0, ${centerFocalY - currentScrollY}px, 0)`;
      }

      // Direct GPU Compositor Update for the orange cursor needle:
      if (cursorRef.current && gaugeTrackRef.current) {
        const trackWidth = gaugeTrackRef.current.offsetWidth || 280;
        const needleX = eased * trackWidth;
        cursorRef.current.style.transform = `translate3d(${needleX}px, 0, 0)`;
      }

      // Direct Text Updates (skipping React VDOM overhead for maximum FPS)
      if (seqTextRef.current) {
        seqTextRef.current.textContent = String(currentStep).padStart(4, '0');
      }
      if (velTextRef.current) {
        const velocity = (1 - progress) * 16.5 * (1 - Math.pow(progress, 1.8));
        velTextRef.current.textContent = velocity > 0.1 ? velocity.toFixed(1).padStart(4, '0') : '00.0';
      }

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(loop);
      } else {
        // Firm clamp on the final stopOn coordinate
        if (tapeRef.current) {
          tapeRef.current.style.transform = `translate3d(0, ${centerFocalY - targetOffset}px, 0)`;
        }
        if (seqTextRef.current) {
          seqTextRef.current.textContent = String(TOTAL_STEPS).padStart(4, '0');
        }
        if (velTextRef.current) {
          velTextRef.current.textContent = '00.0';
        }
        setState('stopped');
      }
    };

    animFrameRef.current = requestAnimationFrame(loop);
  }, [state, targetOffset, centerFocalY, timerDuration]);

  // Reset to initial idle state
  const resetToIdle = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    setState('idle');
    setSecondsLeft(timerDuration);
    setIsTimerRunning(false);

    // Reset direct DOM positions
    if (tapeRef.current) {
      tapeRef.current.style.transform = `translate3d(0, ${centerFocalY}px, 0)`;
    }
    if (cursorRef.current) {
      cursorRef.current.style.transform = `translate3d(0px, 0, 0)`;
    }
    if (seqTextRef.current) {
      seqTextRef.current.textContent = '0000';
    }
    if (velTextRef.current) {
      velTextRef.current.textContent = '00.0';
    }
  }, [centerFocalY, timerDuration]);

  // Keep tape in correct position on resize
  useEffect(() => {
    if (state === 'idle' && tapeRef.current) {
      tapeRef.current.style.transform = `translate3d(0, ${centerFocalY}px, 0)`;
    } else if (state === 'stopped' && tapeRef.current) {
      tapeRef.current.style.transform = `translate3d(0, ${centerFocalY - targetOffset}px, 0)`;
    }
  }, [rowHeight, centerFocalY, targetOffset, state]);

  // Countdown timer effect
  useEffect(() => {
    if (isTimerRunning && secondsLeft > 0) {
      countdownIntervalRef.current = window.setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(countdownIntervalRef.current!);
            setIsTimerRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    }

    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [isTimerRunning, secondsLeft]);

  const toggleTimer = () => {
    if (secondsLeft === 0) {
      setSecondsLeft(timerDuration);
      setIsTimerRunning(true);
      return;
    }
    setIsTimerRunning((prev) => !prev);
  };

  // Helper to dynamically adjust typography size based on topic word length so text NEVER wraps on mobile
  const getTopicFontSize = (text: string) => {
    const len = text.length;
    if (len > 18) return 'text-2xl sm:text-4xl md:text-5xl';
    if (len > 14) return 'text-3xl sm:text-5xl md:text-6xl';
    if (len > 10) return 'text-4xl sm:text-6xl md:text-7xl';
    return 'text-4xl sm:text-6xl md:text-7xl lg:text-8xl';
  };

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col items-center select-none pt-2 sm:pt-4 px-2 sm:px-4">
      
      {/* 
        1. TOP METRICS BAR (Matches screenshot layout)
        SEQ 0000 / 0029   |   + 0.000 / 0.500   |   VEL 00.0 /S
      */}
      <div className="w-full flex items-center justify-between text-[10px] sm:text-xs font-mono-tabular tracking-wider text-neutral-500 mb-6 sm:mb-10 px-2 sm:px-6">
        <div className="flex items-center gap-1">
          <span>SEQ </span>
          <span ref={seqTextRef} className="text-neutral-900 font-bold">
            0000
          </span>
          <span className="text-neutral-400"> / 0029</span>
        </div>

        <div className="text-neutral-400 tracking-widest hidden xs:block text-[11px]">
          + 0.000 / 0.500
        </div>

        <div className="flex items-center gap-1">
          <span>VEL </span>
          <span ref={velTextRef} className="text-neutral-900 font-bold">
            00.0
          </span>
          <span className="text-neutral-400"> /S</span>
        </div>
      </div>

      {/* 
        2. KINETIC ROLLER VIEWPORT & FOCAL BRACKETS
        Responsive padding, buttery-smooth hardware-accelerated translation
      */}
      <div className="relative w-full flex items-center justify-center my-2 sm:my-4">
        
        {/* LEFT FOCAL BRACKETS */}
        <div
          className="absolute left-1 xs:left-3 sm:left-6 md:left-12 top-0 bottom-0 flex flex-col justify-between items-start pointer-events-none z-30 py-3"
          style={{ height: `${viewportHeight}px` }}
        >
          {/* Top Square: turns bright orange #ff3e00 when stopped */}
          <div
            className={`w-3 h-3 sm:w-3.5 sm:h-3.5 border-[1.5px] transition-colors duration-300 ${
              state === 'stopped' ? 'border-[#ff3e00]' : 'border-neutral-800'
            }`}
          />

          {/* Middle Indicator: Horizontal line with arrowhead —► */}
          <div className="flex items-center gap-0.5">
            <div className="w-4 sm:w-7 h-[1.5px] bg-neutral-800" />
            <span
              className={`text-[10px] sm:text-xs transform transition-colors duration-300 ${
                state === 'running' || state === 'stopped' ? 'text-[#ff3e00]' : 'text-neutral-900'
              }`}
            >
              ▶
            </span>
          </div>

          {/* Bottom Square: turns bright orange #ff3e00 when stopped */}
          <div
            className={`w-3 h-3 sm:w-3.5 sm:h-3.5 border-[1.5px] transition-colors duration-300 ${
              state === 'stopped' ? 'border-[#ff3e00]' : 'border-neutral-800'
            }`}
          />
        </div>

        {/* RIGHT FOCAL BRACKETS */}
        <div
          className="absolute right-1 xs:right-3 sm:right-6 md:right-12 top-0 bottom-0 flex flex-col justify-between items-end pointer-events-none z-30 py-3"
          style={{ height: `${viewportHeight}px` }}
        >
          {/* Top Square: turns bright orange #ff3e00 when stopped */}
          <div
            className={`w-3 h-3 sm:w-3.5 sm:h-3.5 border-[1.5px] transition-colors duration-300 ${
              state === 'stopped' ? 'border-[#ff3e00]' : 'border-neutral-800'
            }`}
          />

          {/* Middle Indicator: Left arrowhead ◄ */}
          <div className="flex items-center">
            <span
              className={`text-[10px] sm:text-xs transform transition-colors duration-300 ${
                state === 'running' || state === 'stopped' ? 'text-[#ff3e00]' : 'text-neutral-900'
              }`}
            >
              ◀
            </span>
          </div>

          {/* Bottom Square: turns bright orange #ff3e00 when stopped */}
          <div
            className={`w-3 h-3 sm:w-3.5 sm:h-3.5 border-[1.5px] transition-colors duration-300 ${
              state === 'stopped' ? 'border-[#ff3e00]' : 'border-neutral-800'
            }`}
          />
        </div>

        {/* 
          CONTINUOUS KINETIC TYPOGRAPHY TAPE
          Always mounted with zero DOM destruction on stop for maximum visual fluidity.
          Top and bottom gradient masks create authentic analog optical fade!
        */}
        <div
          className="relative w-full overflow-hidden flex flex-col items-center justify-start px-8 xs:px-12 sm:px-20 md:px-28"
          style={{
            height: `${viewportHeight}px`,
            WebkitMaskImage:
              state === 'stopped'
                ? 'none'
                : 'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.4) 15%, rgba(0,0,0,1) 32%, rgba(0,0,0,1) 68%, rgba(0,0,0,0.4) 85%, rgba(0,0,0,0) 100%)',
            maskImage:
              state === 'stopped'
                ? 'none'
                : 'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.4) 15%, rgba(0,0,0,1) 32%, rgba(0,0,0,1) 68%, rgba(0,0,0,0.4) 85%, rgba(0,0,0,0) 100%)',
          }}
        >
          {/* Hardware-Accelerated Tape Track */}
          <div
            ref={tapeRef}
            className="w-full flex flex-col items-center will-change-transform"
            style={{
              transform: `translate3d(0, ${centerFocalY}px, 0)`,
            }}
          >
            {tape.map((topic, idx) => {
              const isMain = idx === 0;
              const isTargetStop = idx === TOTAL_STEPS;

              // In stopped state, smoothly fade out all items except the terminal stopOn topic
              const isHiddenWhenStopped = state === 'stopped' && !isTargetStop;

              return (
                <div
                  key={`${idx}-${topic}`}
                  className={`flex flex-col items-center justify-center text-center w-full px-2 transition-opacity duration-300 ${
                    isHiddenWhenStopped ? 'opacity-0' : 'opacity-100'
                  }`}
                  style={{
                    height: `${rowHeight}px`,
                  }}
                >
                  <div className="relative flex flex-col items-center justify-center max-w-full">
                    <span
                      className={`font-display font-[800] uppercase tracking-[-0.035em] leading-none select-none whitespace-nowrap overflow-hidden text-ellipsis transition-colors duration-200 ${
                        isTargetStop && state === 'stopped'
                          ? `text-[#121316] ${getTopicFontSize(topic)}`
                          : isMain && state === 'idle'
                          ? `text-[#121316] ${getTopicFontSize(topic)}`
                          : `text-neutral-800 ${getTopicFontSize(topic)}`
                      }`}
                    >
                      {topic}
                    </span>

                    {/* Solid Bright Orange Underline from Screenshot (Image 3) */}
                    {isTargetStop && (
                      <div
                        className={`w-full h-[3.5px] sm:h-[4px] bg-[#ff3e00] mt-3 sm:mt-5 origin-center transition-all duration-300 ease-out ${
                          state === 'stopped'
                            ? 'opacity-100 scale-x-100'
                            : 'opacity-0 scale-x-0'
                        }`}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 60-Second Challenge Timer Display (·T· 60 'SEC') pinned right beneath the stopped target */}
          <div
            className={`absolute bottom-3 left-0 right-0 flex items-center justify-center gap-2 sm:gap-3 font-mono-tabular select-none pointer-events-none transition-all duration-300 ${
              state === 'stopped'
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-4 pointer-events-none'
            }`}
          >
            <span className="text-[10px] sm:text-[11px] text-neutral-400 tracking-wider">
              ·T·
            </span>
            <span className="text-3xl sm:text-4xl md:text-5xl font-bold text-neutral-800 tracking-tight">
              {String(secondsLeft).padStart(2, '0')}
            </span>
            <span className="text-[10px] sm:text-[11px] text-neutral-400 tracking-wider">
              'SEC'
            </span>
          </div>
        </div>
      </div>

      {/* 
        3. HORIZONTAL GAUGE / TICKS RULER (Matches tick marks in screenshots)
        Shows graduation lines with smooth hardware-accelerated orange needle cursor during roll
      */}
      <div className="relative w-full max-w-xs sm:max-w-md mx-auto my-4 sm:my-6 px-4 flex items-center justify-center">
        <div ref={gaugeTrackRef} className="relative flex items-end justify-between w-full h-4 sm:h-5 overflow-hidden">
          {[...Array(41)].map((_, i) => {
            const isMajor = i % 5 === 0;
            return (
              <div
                key={`tick-${i}`}
                className={`w-[1px] bg-neutral-800 ${
                  isMajor ? 'h-3.5 sm:h-4' : 'h-2 sm:h-2.5'
                }`}
              />
            );
          })}

          {/* Smooth Orange Progress Cursor Needle driven directly on GPU compositor */}
          <div
            ref={cursorRef}
            className={`absolute top-0 bottom-0 left-0 w-[2.5px] bg-[#ff3e00] z-10 will-change-transform transition-opacity duration-200 ${
              state === 'running' ? 'opacity-100' : 'opacity-0'
            }`}
            style={{
              transform: 'translate3d(0px, 0, 0)',
            }}
          />
        </div>
      </div>

      {/* 
        4. ACTION BUTTONS (Matches clean outline aesthetic from screenshots)
        - Idle: [ START → ]
        - Running: [ ● RUNNING ]
        - Stopped: [ START → ] and [ ↺ ROLL AGAIN ]
      */}
      <div className="flex flex-col items-center gap-2.5 sm:gap-3 mt-1 sm:mt-3 w-full">
        {state === 'idle' && (
          <button
            onClick={startRoll}
            className="w-48 sm:w-56 py-3 sm:py-3.5 border border-neutral-900 hover:bg-neutral-900/5 active:scale-[0.98] transition-all font-mono-tabular text-xs tracking-[0.25em] text-neutral-900 uppercase font-semibold cursor-pointer text-center"
          >
            START →
          </button>
        )}

        {state === 'running' && (
          <div className="w-48 sm:w-56 py-3 sm:py-3.5 border border-neutral-400/80 font-mono-tabular text-xs tracking-[0.25em] text-neutral-600 uppercase font-semibold flex items-center justify-center gap-2 cursor-default">
            <span className="w-1.5 h-1.5 rounded-full bg-[#ff3e00] animate-pulse" />
            <span>RUNNING</span>
          </div>
        )}

        {state === 'stopped' && (
          <div className="flex flex-col items-center gap-2.5 w-full">
            {/* START TIMER BUTTON (Image 3) */}
            <button
              onClick={toggleTimer}
              className="w-48 sm:w-56 py-3 sm:py-3.5 border border-neutral-900 hover:bg-neutral-900/5 active:scale-[0.98] transition-all font-mono-tabular text-xs tracking-[0.25em] text-neutral-900 uppercase font-semibold cursor-pointer text-center"
            >
              {isTimerRunning
                ? 'PAUSE ||'
                : secondsLeft < timerDuration && secondsLeft > 0
                ? 'RESUME →'
                : secondsLeft === 0
                ? 'RESTART →'
                : 'START →'}
            </button>

            {/* ROLL AGAIN BUTTON (Image 3) */}
            <button
              onClick={resetToIdle}
              className="w-44 sm:w-52 py-2 sm:py-2.5 border border-neutral-400 hover:border-neutral-700 active:scale-[0.98] transition-all font-mono-tabular text-[11px] tracking-[0.2em] text-neutral-600 hover:text-black uppercase font-medium cursor-pointer flex items-center justify-center gap-2"
            >
              <span>↺</span>
              <span>ROLL AGAIN</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
