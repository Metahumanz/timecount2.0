import React, { useState, useEffect, useRef } from 'react';
import { TimezoneOption, Language, ClockStyle } from '../types';
import { translations } from '../utils/translations';

interface Props {
  isUiVisible: boolean;
  language: Language;
}

// --- ANALOG CLOCK COMPONENT ---
const AnalogClock: React.FC<{ time: Date }> = ({ time }) => {
  const seconds = time.getSeconds() + time.getMilliseconds() / 1000;
  const minutes = time.getMinutes() + seconds / 60;
  const hours = (time.getHours() % 12) + minutes / 60;

  return (
    <div className="relative w-[300px] h-[300px] md:w-[400px] md:h-[400px] lg:w-[500px] lg:h-[500px] animate-scale-up">
      {/* Clock Face Background */}
      <div className="absolute inset-0 rounded-full border-4 border-slate-800/10 dark:border-white/10 backdrop-blur-md bg-white/5 dark:bg-black/20 shadow-2xl" />
      
      {/* Hour Markers */}
      {Array.from({ length: 12 }).map((_, i) => (
        <div 
          key={i}
          className="absolute w-full h-full left-0 top-0 pointer-events-none"
          style={{ transform: `rotate(${i * 30}deg)` }}
        >
          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-1.5 h-6 bg-slate-400/50 dark:bg-white/30 rounded-full" />
        </div>
      ))}

      {/* Hands Container - Centered */}
      <div className="absolute inset-0">
         {/* Hour Hand */}
         <div 
           className="absolute bg-slate-800 dark:bg-white rounded-full shadow-lg z-10"
           style={{ 
             width: '6px',
             height: '25%', 
             left: '50%', 
             bottom: '50%',
             transformOrigin: 'bottom center',
             transform: `translateX(-50%) rotate(${hours * 30}deg)` 
           }}
         />
         {/* Minute Hand */}
         <div 
           className="absolute bg-slate-600 dark:bg-slate-300 rounded-full shadow-lg z-20"
           style={{ 
             width: '4px',
             height: '38%', 
             left: '50%', 
             bottom: '50%',
             transformOrigin: 'bottom center',
             transform: `translateX(-50%) rotate(${minutes * 6}deg)` 
           }}
         />
         {/* Second Hand */}
         <div 
           className="absolute bg-orange-500 rounded-full shadow-md z-30"
           style={{ 
             width: '2px',
             height: '42%', 
             left: '50%', 
             bottom: '50%',
             transformOrigin: 'bottom center',
             transform: `translateX(-50%) rotate(${seconds * 6}deg)` 
           }}
         />
         {/* Center Cap */}
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-white dark:bg-slate-800 border-2 border-orange-500 rounded-full z-40 shadow-sm" />
      </div>
    </div>
  );
};

// --- NIXIE TUBE COMPONENT ---
const NixieDigit: React.FC<{ char: string }> = ({ char }) => {
  if (char === ':') {
    return (
      <div className="flex items-center justify-center w-4 md:w-8 animate-pulse">
        <div className="flex flex-col gap-4">
          <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.8)]" />
          <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.8)]" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-16 h-28 sm:w-20 sm:h-36 md:w-24 md:h-44 bg-black/40 backdrop-blur-sm rounded-xl border border-stone-800 shadow-[inset_0_0_20px_rgba(0,0,0,0.8)] flex items-center justify-center overflow-hidden mx-1 group">
      {/* Glass Reflection */}
      <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
      
      {/* The Digit */}
      <span className="text-6xl sm:text-7xl md:text-8xl font-mono font-bold text-orange-500 drop-shadow-[0_0_15px_rgba(249,115,22,0.9)] z-10 animate-digit-pop">
        {char}
      </span>

      {/* Internal "mesh" texture */}
      <div className="absolute inset-0 opacity-20 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDUiLz4KPC9zdmc+')] pointer-events-none" />
    </div>
  );
};

// --- DIGITAL DIGIT COMPONENT ---
const DigitalDigit: React.FC<{ char: string }> = ({ char }) => {
  return (
    <span className="inline-block relative tabular-nums text-center transition-all duration-300 w-[0.6em]">
      <span key={char} className="block animate-digit-pop origin-bottom">
        {char}
      </span>
    </span>
  );
};

// Helper to generate zone options
const getMajorTimezones = (lang: Language): TimezoneOption[] => {
  const zones = [
    'UTC', 'Europe/London', 'Europe/Berlin', 'Europe/Moscow', 'Asia/Dubai',
    'Asia/Kolkata', 'Asia/Bangkok', 'Asia/Shanghai', 'Asia/Tokyo',
    'Australia/Sydney', 'Pacific/Auckland', 'America/New_York',
    'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'America/Sao_Paulo',
  ];
  const options: TimezoneOption[] = [{ value: 'local', label: translations[lang].localTime }];
  zones.forEach(zone => {
    try {
      const offsetPart = new Intl.DateTimeFormat('en-US', { timeZone: zone, timeZoneName: 'shortOffset' })
        .formatToParts(new Date()).find(p => p.type === 'timeZoneName')?.value;
      const regionName = zone.split('/')[1]?.replace('_', ' ') || zone;
      options.push({ value: zone, label: `${regionName} (${offsetPart})` });
    } catch (e) { }
  });
  return options;
};

const ClockView: React.FC<Props> = ({ isUiVisible, language }) => {
  const [time, setTime] = useState(new Date());
  const [stayDuration, setStayDuration] = useState('00:00:00');
  const [selectedZone, setSelectedZone] = useState<string>('local');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [timezoneOptions, setTimezoneOptions] = useState<TimezoneOption[]>([]);
  const [clockStyle, setClockStyle] = useState<ClockStyle>(ClockStyle.DIGITAL);

  const mountedTimeRef = useRef(Date.now());

  useEffect(() => {
    setTimezoneOptions(getMajorTimezones(language));
  }, [language]);

  useEffect(() => {
    let frameId: number;
    const update = () => {
        const now = new Date();
        setTime(now);

        const diff = Date.now() - mountedTimeRef.current;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setStayDuration(
            `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        );
        frameId = requestAnimationFrame(update);
    };
    frameId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frameId);
  }, []);

  const formatTime = (date: Date, zone: string) => {
    try {
      const options: Intl.DateTimeFormatOptions = {
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: false, timeZone: zone === 'local' ? undefined : zone,
      };
      return new Intl.DateTimeFormat('en-US', options).format(date);
    } catch (e) { return "00:00:00"; }
  };

  const getLabel = (val: string) => timezoneOptions.find(z => z.value === val)?.label || val;
  
  const getDisplayDate = () => {
      if (selectedZone === 'local') return time;
      try {
          const str = time.toLocaleString('en-US', { timeZone: selectedZone });
          return new Date(str);
      } catch { return time; }
  }

  const displayTime = getDisplayDate();
  const timeString = formatTime(displayTime, selectedZone);

  const toggleStyle = () => {
      if (clockStyle === ClockStyle.DIGITAL) setClockStyle(ClockStyle.ANALOG);
      else if (clockStyle === ClockStyle.ANALOG) setClockStyle(ClockStyle.NIXIE);
      else setClockStyle(ClockStyle.DIGITAL);
  }

  const getStyleLabel = () => {
      if (clockStyle === ClockStyle.DIGITAL) return "Digital";
      if (clockStyle === ClockStyle.ANALOG) return "Analog";
      return "Nixie";
  }

  return (
    <div className="flex flex-col items-center justify-center animate-fade-in relative z-10 w-full max-w-full px-4">
      {/* Main Clock Display */}
      <div className="relative group cursor-default flex justify-center items-center py-8 min-h-[300px]">
        
        {clockStyle === ClockStyle.ANALOG && (
            <AnalogClock time={displayTime} />
        )}

        {clockStyle === ClockStyle.DIGITAL && (
            <div className="relative">
                {/* Removed text-transparent and bg-clip-text for better visibility compatibility */}
                <h1 className="flex justify-center text-7xl sm:text-8xl md:text-9xl lg:text-[10rem] 2xl:text-[14rem] font-black tracking-tighter leading-none drop-shadow-2xl text-slate-800 dark:text-slate-100 select-none transition-all duration-300 transform">
                    {timeString.split('').map((char, index) => (
                        <DigitalDigit key={index} char={char} />
                    ))}
                </h1>
                {/* Glow effect */}
                <div className="absolute -inset-10 bg-indigo-500/5 dark:bg-white/5 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10" />
            </div>
        )}

        {clockStyle === ClockStyle.NIXIE && (
             <div className="flex items-center justify-center gap-1 sm:gap-2 p-4 bg-black/20 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl">
                 {timeString.split('').map((char, index) => (
                     <NixieDigit key={`${index}-${char}`} char={char} />
                 ))}
             </div>
        )}

      </div>

      {/* Controls Container */}
      <div className="mt-6 md:mt-12 flex flex-col items-center space-y-6">
        
        <div 
          className={`flex gap-4 transition-all duration-1000 ${isUiVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}
        >
          {/* Timezone */}
          <div className="relative">
            <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="px-6 py-2 rounded-full bg-white/20 dark:bg-black/20 backdrop-blur-md border border-white/30 dark:border-white/10 text-sm md:text-base font-bold hover:bg-white/30 dark:hover:bg-white/10 transition-all active:scale-95 flex items-center gap-3 max-w-[200px] sm:max-w-[280px] justify-between shadow-sm dark:text-white text-slate-900"
            >
                <span className="truncate">{getLabel(selectedZone)}</span>
                <svg className={`w-4 h-4 flex-shrink-0 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
            </button>
            {isDropdownOpen && isUiVisible && (
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-72 max-h-72 overflow-y-auto bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-white/5 py-2 z-50 animate-slide-down scrollbar-thin scrollbar-thumb-slate-400 scrollbar-track-transparent">
                {timezoneOptions.map((zone) => (
                    <button
                    key={zone.value}
                    onClick={() => {
                        setSelectedZone(zone.value);
                        setIsDropdownOpen(false);
                    }}
                    className={`w-full text-left px-5 py-3 text-sm font-medium transition-colors border-b border-white/5 last:border-0 ${selectedZone === zone.value ? 'bg-indigo-500 text-white' : 'hover:bg-black/5 dark:hover:bg-white/5 dark:text-slate-200 text-slate-800'}`}
                    >
                    {zone.label}
                    </button>
                ))}
                </div>
            )}
          </div>
          
          {/* Toggle Style */}
          <button
            onClick={toggleStyle}
            className="w-12 h-10 md:w-auto md:px-5 md:py-2 rounded-full bg-white/20 dark:bg-black/20 backdrop-blur-md border border-white/30 dark:border-white/10 flex items-center justify-center gap-2 hover:bg-white/30 dark:hover:bg-white/10 transition-all active:scale-95 dark:text-white text-slate-900"
            aria-label="Toggle Clock Style"
          >
             <span className="text-sm font-bold hidden md:inline">{getStyleLabel()}</span>
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
          </button>
        </div>

        {/* Stay Duration */}
        <div className={`text-xs md:text-sm font-bold tracking-widest uppercase transition-opacity duration-1000 dark:text-slate-400 text-slate-500 ${isUiVisible ? 'opacity-50' : 'opacity-30'}`}>
          {translations[language].focusTime}: {stayDuration}
        </div>
      </div>
    </div>
  );
};

export default ClockView;