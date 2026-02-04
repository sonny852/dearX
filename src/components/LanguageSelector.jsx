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
    <div className="fixed top-8 left-8 z-[1000] flex gap-2 bg-dark/80 backdrop-blur-xl p-2 rounded-3xl border border-coral/20">
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => setLanguage(lang.code)}
          className={`px-4 py-2 border-none rounded-2xl cursor-pointer text-sm font-semibold transition-all duration-200 ${
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
