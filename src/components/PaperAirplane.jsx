import React, { useRef, useEffect, useState, useMemo, memo } from 'react';
import { useApp } from '../context/AppContext';

const PaperAirplane = memo(function PaperAirplane() {
  const { scrollProgress } = useApp();
  const pathRef = useRef(null);
  const [pathLength, setPathLength] = useState(0);
  const [dims, setDims] = useState({
    w: typeof window !== 'undefined' ? window.innerWidth : 1000,
    h: typeof window !== 'undefined' ? window.innerHeight : 800,
  });

  useEffect(() => {
    const onResize = () => setDims({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Simple descending S-curve from hero area to form area
  const pathD = useMemo(() => {
    const { w, h } = dims;
    const p = (px, py) => `${(px * w).toFixed(0)} ${(py * h).toFixed(0)}`;
    return [
      `M ${p(0.50, 0.22)}`,
      `C ${p(0.58, 0.28)} ${p(0.63, 0.36)} ${p(0.58, 0.44)}`,
      `C ${p(0.53, 0.52)} ${p(0.40, 0.54)} ${p(0.42, 0.62)}`,
      `C ${p(0.44, 0.70)} ${p(0.52, 0.76)} ${p(0.50, 0.84)}`,
    ].join(' ');
  }, [dims]);

  useEffect(() => {
    if (pathRef.current) {
      setPathLength(pathRef.current.getTotalLength());
    }
  }, [pathD]);

  // Airplane travels from scroll 5% to 48%
  const progress = Math.max(0, Math.min(1, (scrollProgress - 0.05) / 0.43));

  const fadeIn = Math.min(1, progress * 5);
  const fadeOut = Math.min(1, (1 - progress) * 4);
  const opacity = progress > 0 && progress < 1 ? Math.min(fadeIn, fadeOut) : 0;

  const { x, y, angle } = useMemo(() => {
    if (!pathRef.current || pathLength === 0) {
      return { x: dims.w * 0.5, y: dims.h * 0.22, angle: 90 };
    }
    const len = progress * pathLength;
    const pt = pathRef.current.getPointAtLength(len);
    const pt2 = pathRef.current.getPointAtLength(Math.min(len + 1, pathLength));
    const a = Math.atan2(pt2.y - pt.y, pt2.x - pt.x) * (180 / Math.PI);
    return { x: pt.x, y: pt.y, angle: a };
  }, [progress, pathLength, dims]);

  if (opacity <= 0) return null;

  const scale = Math.max(2, Math.min(3, dims.w / 700));

  return (
    <svg
      viewBox={`0 0 ${dims.w} ${dims.h}`}
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 3, opacity }}
      preserveAspectRatio="none"
    >
      <defs>
        <mask id="trailReveal">
          <path
            d={pathD}
            fill="none"
            stroke="white"
            strokeWidth="8"
            strokeDasharray={pathLength || 1000}
            strokeDashoffset={pathLength ? pathLength * (1 - progress) : 1000}
          />
        </mask>
      </defs>

      {/* Measurement path */}
      <path ref={pathRef} d={pathD} fill="none" stroke="none" />

      {/* Dashed trail drawn progressively */}
      <path
        d={pathD}
        fill="none"
        stroke="rgba(255,140,105,0.3)"
        strokeWidth="1.5"
        strokeDasharray="8 5"
        strokeLinecap="round"
        mask="url(#trailReveal)"
      />

      {/* Paper airplane */}
      <g transform={`translate(${x.toFixed(1)}, ${y.toFixed(1)}) rotate(${angle.toFixed(1)}) scale(${scale})`}>
        <path
          d="M 0 0 L -10 -4.5 L -5 0 Z"
          fill="rgba(255,140,105,0.2)"
          stroke="#ff8c69"
          strokeWidth="0.7"
          strokeLinejoin="round"
        />
        <path
          d="M 0 0 L -10 4.5 L -5 0 Z"
          fill="rgba(255,140,105,0.1)"
          stroke="#ff8c69"
          strokeWidth="0.7"
          strokeLinejoin="round"
        />
        <line
          x1="0" y1="0" x2="-5" y2="0"
          stroke="#ff8c69"
          strokeWidth="0.5"
          opacity="0.6"
        />
      </g>
    </svg>
  );
});

export default PaperAirplane;
