import React, { memo } from 'react';
import { useApp } from '../context/AppContext';

const LanguageSelector = memo(function LanguageSelector() {
  const { language, setLanguage } = useApp();

  const languages = [
    { code: 'ko', label: '한' },
    { code: 'en', label: 'EN' },
    { code: 'ja', label: '日' },
  ];

  return (
    <div className="fixed top-4 left-4 z-[1000] flex gap-1 bg-dark/80 backdrop-blur-xl p-1 rounded-full border border-coral/20">
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => setLanguage(lang.code)}
          className={`px-2.5 py-1 border-none rounded-full cursor-pointer text-[11px] font-semibold transition-all duration-200 ${
            language === lang.code
              ? 'bg-gradient-to-br from-coral to-gold text-white'
              : 'bg-transparent text-coral hover:bg-coral/10'
          }`}
        >
          {lang.label}
        </button>
      ))}
    </div>
  );
});

export default LanguageSelector;
