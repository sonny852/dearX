import React, { memo } from 'react';
import { ChevronDown } from 'lucide-react';
import { useApp } from '../context/AppContext';

const LandingHero = memo(function LandingHero() {
  const { scrollProgress, t } = useApp();

  return (
    <div className="h-screen flex flex-col justify-center items-center sticky top-0 z-[1]">
      {/* Background gradient */}
      <div
        className="absolute inset-0 transition-opacity duration-300"
        style={{
          background: `radial-gradient(circle at ${50 + scrollProgress * 20}% ${50 - scrollProgress * 20}%, rgba(255, 140, 105, 0.15) 0%, transparent 50%)`,
          opacity: 1 - scrollProgress * 0.7,
        }}
      />

      {/* Paper airplane logo */}
      <div
        className="absolute top-[15%] opacity-15 transition-transform duration-300"
        style={{
          transform: `rotate(${scrollProgress * 180}deg) scale(${1 + scrollProgress * 0.5})`,
        }}
      >
        <svg width="300" height="300" viewBox="0 0 1080 1080" fill="none">
          <path
            d="M850 250L400 500L250 350L850 250Z"
            stroke="#ff8c69"
            strokeWidth="20"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M400 500L550 750L850 250L400 500Z"
            stroke="#ff8c69"
            strokeWidth="20"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M250 350L400 500L550 750"
            stroke="#ff8c69"
            strokeWidth="20"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle
            cx="300"
            cy="650"
            r="80"
            stroke="#ff8c69"
            strokeWidth="15"
            strokeDasharray="20 20"
            fill="none"
            opacity="0.6"
          />
          <circle
            cx="450"
            cy="750"
            r="60"
            stroke="#ff8c69"
            strokeWidth="15"
            strokeDasharray="15 15"
            fill="none"
            opacity="0.6"
          />
        </svg>
      </div>

      {/* Main content */}
      <div
        className="text-center z-[2] transition-all duration-300"
        style={{
          transform: `translateY(${scrollProgress * -100}px)`,
          opacity: 1 - scrollProgress * 1.5,
        }}
      >
        <h1
          className="fade-in-up text-[clamp(4rem,10vw,9rem)] font-display font-black m-0 bg-gradient-to-br from-white via-coral to-gold bg-clip-text tracking-tight leading-tight"
          style={{
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            animationDelay: '0.2s',
            opacity: 0,
          }}
        >
          {t.mainTitle}
        </h1>
        <p
          className="fade-in-up text-[clamp(1.2rem,2.5vw,1.8rem)] font-light mt-8 text-cream/80"
          style={{ animationDelay: '0.6s', opacity: 0 }}
        >
          {t.mainSubtitle}
        </p>
        <p
          className="fade-in-up text-[clamp(0.9rem,1.5vw,1.1rem)] font-light mt-4 text-coral/60"
          style={{ animationDelay: '0.8s', opacity: 0 }}
        >
          {t.worryMessage}
        </p>

        {/* Scroll indicator */}
        <div className="scroll-indicator mt-16 opacity-50 flex flex-col items-center gap-2">
          <span className="text-sm text-cream/60">{t.scrollHint}</span>
          <ChevronDown size={32} className="text-cream" />
        </div>
      </div>
    </div>
  );
});

export default LandingHero;
