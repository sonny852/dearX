import React, { memo } from 'react';
import { useApp } from '../context/AppContext';

const LandingHero = memo(function LandingHero({ onStart }) {
  const { t } = useApp();

  return (
    <div className="flex flex-col justify-center items-center pb-20 pt-16 sm:pt-0">
      {/* Background gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(circle at 50% 50%, rgba(255, 140, 105, 0.15) 0%, transparent 50%)',
        }}
      />

      {/* Main content */}
      <div className="text-center z-[2] flex flex-col items-center">
        {/* Hero Image with vignette blend */}
        <div
          className="fade-in-up mb-4"
          style={{ animationDelay: '0s', opacity: 0 }}
        >
          <img
            id="dearx-logo"
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

        {/* 클릭 버튼 */}
        <div
          className="fade-in-up mt-8"
          style={{ animationDelay: '1s', opacity: 0 }}
        >
          <button
            onClick={onStart}
            className="group relative px-7 py-3.5 rounded-full bg-transparent border border-coral/40 text-coral font-medium text-base cursor-pointer hover:border-coral/80 hover:bg-coral/5 active:scale-95 transition-all flex items-center gap-2 btn-glow"
          >
            <span className="relative z-10">{t.worryMessage}</span>
            <span className="relative z-10 arrow-slide text-lg transition-transform group-hover:translate-x-1">→</span>
          </button>
        </div>
      </div>

      <style>{`
        .fade-in-up {
          animation: fadeInUp 0.8s ease-out forwards;
        }
        .btn-glow {
          animation: btnGlow 3s ease-in-out infinite;
        }
        .arrow-slide {
          display: inline-block;
          animation: arrowSlide 1.5s ease-in-out infinite;
        }
        @keyframes btnGlow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(255, 140, 105, 0.15);
          }
          50% {
            box-shadow: 0 0 30px rgba(255, 140, 105, 0.3);
          }
        }
        @keyframes arrowSlide {
          0%, 100% { transform: translateX(0); opacity: 1; }
          50% { transform: translateX(4px); opacity: 0.7; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
});

export default LandingHero;
