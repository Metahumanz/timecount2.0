import React, { useState, useEffect, useRef } from 'react';
import { useSound } from '../hooks/useSound';
import { SoundType, Language } from '../types';
import { translations } from '../utils/translations';

interface Props {
  onAlarmStart: () => void;
  onAlarmStop: () => void;
  isUiVisible: boolean;
  language: Language;
}

const AnimatedDigit: React.FC<{ char: string }> = ({ char }) => {
  return (
    <span className="inline-block relative tabular-nums text-center transition-all duration-300 w-[0.6em]">
      <span key={char} className="block animate-digit-pop origin-bottom">
        {char}
      </span>
    </span>
  );
};

const CountdownView: React.FC<Props> = ({ onAlarmStart, onAlarmStop, isUiVisible, language }) => {
  const [duration, setDuration] = useState<number>(5 * 60); 
  const [remaining, setRemaining] = useState<number>(5 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [selectedSound, setSelectedSound] = useState<SoundType>(SoundType.CHIME);
  const [editMode, setEditMode] = useState(false);
  
  const [isCustomInput, setIsCustomInput] = useState(false);
  const [customMinutes, setCustomMinutes] = useState<string>('5');
  const [customSeconds, setCustomSeconds] = useState<string>('00');

  const endTimeRef = useRef<number | null>(null);
  const animationRef = useRef<number | null>(null);
  const { playSound } = useSound();
  const soundIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const t = translations[language];

  const startTimer = () => {
    let targetSeconds = remaining;
    
    if (isCustomInput && !isRunning && remaining === duration) {
       const m = parseInt(customMinutes) || 0;
       const s = parseInt(customSeconds) || 0;
       targetSeconds = m * 60 + s;
       if (targetSeconds <= 0) return;
       setDuration(targetSeconds);
       setRemaining(targetSeconds);
    } else if (remaining <= 0) {
        return;
    }

    setIsRunning(true);
    setEditMode(false);
    setIsCustomInput(false); 
    
    endTimeRef.current = Date.now() + (targetSeconds * 1000);
    
    const tick = () => {
      if (!endTimeRef.current) return;
      const now = Date.now();
      const left = Math.ceil((endTimeRef.current - now) / 1000);
      
      if (left <= 0) {
        setRemaining(0);
        handleFinish();
      } else {
        setRemaining(left);
        animationRef.current = requestAnimationFrame(tick);
      }
    };
    animationRef.current = requestAnimationFrame(tick);
  };

  const pauseTimer = () => {
    setIsRunning(false);
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    endTimeRef.current = null;
  };

  const resetTimer = () => {
    pauseTimer();
    setIsFinished(false);
    onAlarmStop();
    if (soundIntervalRef.current) clearInterval(soundIntervalRef.current);
    
    const m = parseInt(customMinutes) || 0;
    const s = parseInt(customSeconds) || 0;
    const resetVal = isCustomInput ? (m * 60 + s) : duration;
    
    setRemaining(resetVal > 0 ? resetVal : duration);
  };

  const handleFinish = () => {
    setIsRunning(false);
    setIsFinished(true);
    onAlarmStart();
    
    playSound(selectedSound);
    soundIntervalRef.current = setInterval(() => {
      playSound(selectedSound);
    }, 2000);
  };

  const stopAlarm = () => {
    setIsFinished(false);
    onAlarmStop();
    if (soundIntervalRef.current) clearInterval(soundIntervalRef.current);
    resetTimer();
  };

  useEffect(() => {
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (soundIntervalRef.current) clearInterval(soundIntervalRef.current);
    };
  }, []);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const setPreset = (mins: number) => {
    const secs = mins * 60;
    setDuration(secs);
    setRemaining(secs);
    setEditMode(false);
    setIsCustomInput(false);
  };

  const enableCustomInput = () => {
      setIsCustomInput(true);
      if (isRunning) pauseTimer();
  };

  if (isFinished) {
    return (
      <div className="flex flex-col items-center justify-center z-50 animate-pulse-fast w-full max-w-[95vw]">
        <h2 className="text-6xl md:text-8xl lg:text-9xl font-black mb-12 text-red-500 dark:text-red-400 drop-shadow-2xl text-center">
          {t.timesUp}
        </h2>
        <button
          onClick={stopAlarm}
          className="px-10 py-5 bg-white text-black text-2xl font-bold rounded-full shadow-2xl hover:scale-110 transition-transform active:scale-95"
        >
          {t.acknowledge}
        </button>
      </div>
    );
  }

  const timeString = formatTime(remaining);

  return (
    <div className="flex flex-col items-center animate-fade-in z-10 w-full max-w-[95vw] px-4">
      
      {/* Timer Display */}
      {isCustomInput && !isRunning ? (
          <div className="flex items-center gap-2 sm:gap-4 text-6xl sm:text-8xl md:text-9xl lg:text-[10rem] font-black text-slate-800 dark:text-slate-100 animate-scale-up">
              <input 
                type="number" 
                value={customMinutes}
                onChange={(e) => setCustomMinutes(e.target.value)}
                className="bg-transparent text-center w-[1.5em] focus:outline-none border-b-4 border-indigo-500/50 focus:border-indigo-500 p-0 text-slate-800 dark:text-slate-100"
                placeholder="00"
                min="0"
                max="999"
              />
              <span className="-translate-y-1 md:-translate-y-4 text-slate-800 dark:text-slate-100">:</span>
              <input 
                 type="number" 
                 value={customSeconds}
                 onChange={(e) => setCustomSeconds(e.target.value)}
                 className="bg-transparent text-center w-[1.5em] focus:outline-none border-b-4 border-indigo-500/50 focus:border-indigo-500 p-0 text-slate-800 dark:text-slate-100"
                 placeholder="00"
                 min="0"
                 max="59"
              />
          </div>
      ) : (
        <div 
            className="relative group cursor-pointer"
            onClick={() => !isRunning && setEditMode(!editMode)}
        >
            <h1 className={`flex justify-center text-8xl sm:text-8xl md:text-9xl lg:text-[10rem] 2xl:text-[14rem] font-black tracking-tighter leading-none tabular-nums transition-colors duration-300 space-x-1 md:space-x-2 drop-shadow-2xl ${isRunning ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-800 dark:text-slate-100'}`}>
                {timeString.split('').map((char, index) => (
                    <AnimatedDigit key={index} char={char} />
                ))}
            </h1>
            
            {!isRunning && !editMode && (
            <div className={`absolute -bottom-6 left-1/2 -translate-x-1/2 text-sm font-bold transition-opacity duration-1000 whitespace-nowrap text-slate-500 dark:text-slate-400 ${isUiVisible ? 'opacity-50' : 'opacity-0'}`}>
                {t.clickToPreset}
            </div>
            )}
        </div>
      )}

      {/* Preset / Edit Controls */}
      {editMode && !isRunning && !isCustomInput && (
        <div className={`mt-8 flex flex-col items-center gap-6 animate-slide-down w-full transition-opacity duration-1000 ${isUiVisible ? 'opacity-100' : 'opacity-0'}`}>
          <div className="flex flex-wrap justify-center gap-3">
            {[5, 10, 25, 45, 60].map(m => (
                <button
                key={m}
                onClick={() => setPreset(m)}
                className="px-5 py-3 rounded-2xl bg-white/10 dark:bg-white/5 border border-white/20 hover:bg-indigo-500 hover:text-white transition-all text-base font-bold shadow-sm text-slate-800 dark:text-white"
                >
                {m} {t.min}
                </button>
            ))}
            <button
                onClick={enableCustomInput}
                className="px-5 py-3 rounded-2xl bg-white/10 dark:bg-white/5 border border-white/20 hover:bg-indigo-500 hover:text-white transition-all text-base font-bold shadow-sm text-slate-800 dark:text-white"
            >
                {t.custom}
            </button>
          </div>

          <div className="w-auto flex justify-center gap-4 items-center p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-white/10">
             <label className="text-xs font-bold uppercase opacity-60 text-slate-600 dark:text-slate-400">{t.sound}:</label>
             <select 
               value={selectedSound} 
               onChange={(e) => setSelectedSound(e.target.value as SoundType)}
               className="bg-transparent border-none text-sm font-bold focus:outline-none dark:text-white text-slate-900 cursor-pointer"
             >
               <option value={SoundType.CHIME}>{t.softChime}</option>
               <option value={SoundType.BEEP}>{t.digitalBeep}</option>
               <option value={SoundType.ALARM}>{t.alertAlarm}</option>
             </select>
          </div>
        </div>
      )}
      
      {/* Custom Input Actions */}
      {isCustomInput && !isRunning && (
           <div className="mt-8 flex gap-4 animate-slide-down">
               <button 
                onClick={startTimer}
                className="px-8 py-3 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg transition-transform hover:scale-105"
               >
                   {t.start}
               </button>
               <button 
                onClick={() => { setIsCustomInput(false); setEditMode(true); }}
                className="px-8 py-3 rounded-full bg-transparent border border-slate-400 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white font-bold transition-colors"
               >
                   Back
               </button>
           </div>
      )}

      {/* Play Controls */}
      {!isCustomInput && (
        <div className={`mt-12 flex gap-8 transition-all duration-1000 ${isUiVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none'}`}>
            {!isRunning ? (
            <button
                onClick={startTimer}
                className="w-20 h-20 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-xl shadow-indigo-500/30 transition-all hover:scale-110 active:scale-95"
            >
                <svg className="w-10 h-10 translate-x-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            </button>
            ) : (
            <button
                onClick={pauseTimer}
                className="w-20 h-20 rounded-full bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white flex items-center justify-center shadow-xl transition-all hover:scale-110 active:scale-95"
            >
                <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
            </button>
            )}
            
            <button
            onClick={resetTimer}
            className="w-20 h-20 rounded-full bg-transparent border-2 border-slate-300 dark:border-slate-700 text-slate-400 hover:text-red-500 hover:border-red-500 flex items-center justify-center transition-all hover:rotate-180 active:scale-95"
            >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            </button>
        </div>
      )}
    </div>
  );
};

export default CountdownView;