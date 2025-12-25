import React, { useState, useEffect } from 'react';
import ParticleBackground from './components/ParticleBackground';
import ClockView from './components/ClockView';
import CountdownView from './components/CountdownView';
import { AppMode, Language } from './types';
import { useFullscreen } from './hooks/useFullscreen';
import { useInactivity } from './hooks/useInactivity';
import { translations } from './utils/translations';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppMode>(AppMode.CLOCK);
  const [isDark, setIsDark] = useState(true);
  const [isFlashing, setIsFlashing] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [language, setLanguage] = useState<Language>(Language.EN);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  
  const { isFullscreen, toggleFullscreen } = useFullscreen();
  // Hide UI after 5 seconds of inactivity
  const isInactive = useInactivity(5000); 

  const isUiVisible = !isInactive || isFlashing; // Always show if alarming

  const t = translations[language];

  // Handle system preference initially
  useEffect(() => {
    // Theme preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      setIsDark(false);
    }
    
    // Language preference
    const browserLang = navigator.language.slice(0, 2);
    const supportedLangs = Object.values(Language) as string[];
    if (supportedLangs.includes(browserLang)) {
        setLanguage(browserLang as Language);
    }
  }, []);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'f') {
        toggleFullscreen();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleFullscreen]);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  useEffect(() => {
    if (isFullscreen) {
      showNotification(t.enterZen);
    }
  }, [isFullscreen, language]);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleDoubleTap = () => {
    toggleFullscreen();
    if (isFullscreen) {
      showNotification(t.exitZen);
    }
  };

  const languageLabels: Record<Language, string> = {
      [Language.EN]: 'English',
      [Language.ZH]: '中文',
      [Language.DE]: 'Deutsch',
      [Language.ES]: 'Español',
      [Language.FR]: 'Français',
      [Language.JA]: '日本語',
  };

  return (
    <div 
      className={`relative w-full h-screen overflow-hidden transition-colors duration-500 ease-in-out font-sans select-none
        ${isDark ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-800'}
      `}
    >
      {/* Alarm Flash Overlay */}
      <div className={`absolute inset-0 pointer-events-none z-40 bg-red-500/20 mix-blend-overlay transition-opacity duration-100 ${isFlashing ? 'opacity-100 animate-pulse' : 'opacity-0'}`} />

      {/* Particle Canvas Layer */}
      <div className="absolute inset-0 z-0">
        <ParticleBackground isDark={isDark} onDoubleClick={handleDoubleTap} />
      </div>

      {/* UI Content Layer */}
      <div className="relative z-10 flex flex-col h-full pointer-events-none">
        
        {/* Header / Nav - Fades Out */}
        <header 
          className={`flex justify-between items-center p-6 md:p-10 pointer-events-auto transition-all duration-1000 transform ${isUiVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10 pointer-events-none'}`}
        >
          {/* Tabs */}
          <nav className="flex bg-white/10 dark:bg-black/20 backdrop-blur-md rounded-full p-1 border border-white/20 shadow-lg">
            <button
              onClick={() => setActiveTab(AppMode.CLOCK)}
              className={`px-6 py-2 rounded-full text-sm font-bold transition-all duration-300 ${
                activeTab === AppMode.CLOCK 
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {t.clock}
            </button>
            <button
              onClick={() => setActiveTab(AppMode.COUNTDOWN)}
              className={`px-6 py-2 rounded-full text-sm font-bold transition-all duration-300 ${
                activeTab === AppMode.COUNTDOWN 
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {t.timer}
            </button>
          </nav>

          <div className="flex gap-4 items-center relative">
             {/* Language Toggle (Globe) */}
             <div className="relative">
                <button 
                  onClick={() => setIsLangMenuOpen(!isLangMenuOpen)} 
                  className="w-10 h-10 rounded-full bg-white/10 dark:bg-black/20 backdrop-blur-md flex items-center justify-center border border-white/20 hover:bg-white/20 transition-all"
                >
                    <svg className="w-5 h-5 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </button>
                
                {isLangMenuOpen && (
                    <div className="absolute top-full right-0 mt-2 w-40 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 overflow-hidden animate-slide-down">
                        {Object.values(Language).map((lang) => (
                            <button
                                key={lang}
                                onClick={() => {
                                    setLanguage(lang);
                                    setIsLangMenuOpen(false);
                                }}
                                className={`w-full text-left px-4 py-2 text-sm font-semibold transition-colors ${language === lang ? 'bg-indigo-500 text-white' : 'hover:bg-black/5 dark:hover:bg-white/5'}`}
                            >
                                {languageLabels[lang]}
                            </button>
                        ))}
                    </div>
                )}
             </div>

            {/* Theme Toggle */}
            <button
              onClick={() => setIsDark(!isDark)}
              className="w-10 h-10 rounded-full bg-white/10 dark:bg-black/20 backdrop-blur-md flex items-center justify-center border border-white/20 hover:scale-110 transition-transform active:rotate-90"
              aria-label="Toggle Theme"
            >
              {isDark ? (
                <svg className="w-5 h-5 text-yellow-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              ) : (
                <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
              )}
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-grow flex items-center justify-center pointer-events-auto p-4 w-full">
           {activeTab === AppMode.CLOCK ? (
             <ClockView 
               isUiVisible={isUiVisible} 
               language={language}
             />
           ) : (
             <CountdownView 
               onAlarmStart={() => setIsFlashing(true)} 
               onAlarmStop={() => setIsFlashing(false)} 
               isUiVisible={isUiVisible}
               language={language}
             />
           )}
        </main>
        
        {/* Footer Hint - Fades Out */}
        <footer className={`p-6 text-center text-xs font-mono tracking-widest pointer-events-none transition-opacity duration-1000 ${isUiVisible ? 'opacity-40' : 'opacity-0'}`}>
          {t.zenModeHint}
        </footer>
      </div>

      {/* Toast Notification */}
      <div 
        className={`fixed bottom-10 left-1/2 -translate-x-1/2 px-6 py-3 bg-slate-900/80 dark:bg-white/90 text-white dark:text-slate-900 backdrop-blur-lg rounded-2xl shadow-2xl z-50 transition-all duration-500 transform ${notification ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'}`}
      >
        <span className="text-sm font-semibold flex items-center gap-2">
          {notification}
        </span>
      </div>
    </div>
  );
};

export default App;