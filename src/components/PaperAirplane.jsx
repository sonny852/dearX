import React, { memo } from 'react';
import { useApp } from '../context/AppContext';

const PaperAirplane = memo(function PaperAirplane() {
  const { scrollProgress } = useApp();

  // 스크롤 0% ~ 100% 전체 구간에서 천천히 움직임
  const progress = scrollProgress;

  // 보이지 않으면 렌더링 안함
  if (progress <= 0.01 || progress >= 0.95) return null;

  // 위에서 아래로 수직 이동
  const startY = 10; // vh
  const endY = 85; // vh
  const currentY = startY + (endY - startY) * progress;
  const currentX = 50; // vw (중앙 고정)

  // 회전 (6시 방향 = 아래)
  const rotation = 135;

  // 페이드 인/아웃
  const opacity = progress < 0.1
    ? progress * 10
    : progress > 0.9
      ? (1 - progress) * 10
      : 1;

  // 스크롤 끝에 가까워지면 황금색으로
  const landingProgress = Math.max(0, (progress - 0.7) / 0.3);
  const color = {
    r: 255,
    g: Math.round(140 + (215 - 140) * landingProgress),
    b: Math.round(105 + (100 - 105) * landingProgress),
  };
  const strokeColor = `rgb(${color.r}, ${color.g}, ${color.b})`;
  const fillColor = `rgba(${color.r}, ${color.g}, ${color.b}, 0.3)`;

  return (
    <>
      {/* 일직선 긴 꼬리 */}
      <div
        className="fixed pointer-events-none z-[49]"
        style={{
          left: `${currentX}vw`,
          top: `${currentY}vh`,
          transform: 'translate(-50%, -100%)',
          opacity: opacity * 0.6,
        }}
      >
        <div
          style={{
            width: '2px',
            height: '120px',
            background: `linear-gradient(to top, ${strokeColor}, transparent)`,
            borderRadius: '2px',
          }}
        />
      </div>

      {/* 비행기 */}
      <div
        className="fixed pointer-events-none z-[50]"
        style={{
          left: `${currentX}vw`,
          top: `${currentY}vh`,
          transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
          opacity,
          transition: 'opacity 0.1s',
        }}
      >
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          style={{
            filter: landingProgress > 0
              ? `drop-shadow(0 0 ${8 + landingProgress * 12}px rgba(255, 215, 100, ${0.5 + landingProgress * 0.5}))`
              : 'drop-shadow(0 0 4px rgba(255, 140, 105, 0.4))',
          }}
        >
          <path
            d="M22 2L11 13"
            stroke={strokeColor}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M22 2L15 22L11 13L2 9L22 2Z"
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </>
  );
});

export default PaperAirplane;
