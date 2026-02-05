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

      {/* Main content */}
      <div
        className="text-center z-[2] transition-all duration-300 flex flex-col items-center"
        style={{
          transform: `translateY(${scrollProgress * -100}px)`,
          opacity: 1 - scrollProgress * 1.5,
        }}
      >
        {/* Hero Image with vignette blend */}
        <div
          className="fade-in-up mb-4"
          style={{ animationDelay: '0s', opacity: 0 }}
        >
          <img
            src="/main.png"
            alt=""
            className="w-[220px] sm:w-[260px] md:w-[300px]"
            style={{
              maskImage: 'radial-gradient(ellipse 90% 85% at 50% 40%, black 45%, transparent 85%)',
              WebkitMaskImage: 'radial-gradient(ellipse 90% 85% at 50% 40%, black 45%, transparent 85%)',
            }}
          />
        </div>

        <h1
          className="fade-in-up text-[clamp(4rem,10vw,9rem)] font-display font-black m-0 bg-gradient-to-br from-white via-coral to-gold bg-clip-text tracking-tight leading-tight"
          style={{
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            animationDelay: '0.3s',
            opacity: 0,
          }}
        >
          {t.mainTitle}
        </h1>
        <p
          className="fade-in-up text-[clamp(1.2rem,2.5vw,1.8rem)] font-light mt-6 text-cream/80"
          style={{ animationDelay: '0.7s', opacity: 0 }}
        >
          {t.mainSubtitle}
        </p>
        <p
          className="fade-in-up text-[clamp(0.9rem,1.5vw,1.1rem)] font-light mt-3 text-coral/60"
          style={{ animationDelay: '0.9s', opacity: 0 }}
        >
          {t.worryMessage}
        </p>

        {/* Scroll indicator */}
        <div className="scroll-indicator mt-12 opacity-50 flex flex-col items-center gap-2">
          <span className="text-sm text-cream/60">{t.scrollHint}</span>
          <ChevronDown size={32} className="text-cream" />
        </div>
      </div>
    </div>
  );
});

export default LandingHero;
