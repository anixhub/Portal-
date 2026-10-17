import React from 'react';

interface SholawatCartoucheFrameProps {
  text?: string;
  className?: string;
}

/**
 * Ornate Islamic Cartouche Frame for "اللَّهُمَّ صَلِّ وَسَلِّمْ وَبَارِكْ عَلَيْهِ"
 * Inspired by classical Medina & Cairo Mushaf title borders.
 */
export const SholawatCartoucheFrame: React.FC<SholawatCartoucheFrameProps> = ({
  text = "اللَّهُمَّ صَلِّ وَسَلِّمْ وَبَارِكْ عَلَيْهِ",
  className = "w-full max-w-sm mx-auto my-2"
}) => {
  return (
    <div className={`relative flex items-center justify-center p-3 select-none ${className}`}>
      {/* Authentic Ornate Islamic Cartouche Frame SVG */}
      <svg
        viewBox="0 0 420 100"
        className="w-full h-auto max-w-[380px] drop-shadow-2xs text-slate-800"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outer Decorative Double Border */}
        <rect
          x="12"
          y="12"
          width="396"
          height="76"
          rx="12"
          stroke="currentColor"
          strokeWidth="2.5"
          className="text-slate-800"
        />
        <rect
          x="18"
          y="18"
          width="384"
          height="64"
          rx="8"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeDasharray="4 2"
          className="text-slate-800"
        />

        {/* 4 Corner Arabesque Ornaments */}
        {/* Top-Left */}
        <g transform="translate(14, 14)">
          <path
            d="M 2 18 C 2 8 8 2 18 2 C 12 6 6 12 2 18 Z"
            fill="currentColor"
          />
          <circle cx="8" cy="8" r="2.5" fill="currentColor" />
          <path d="M 4 22 Q 10 10 22 4" stroke="currentColor" strokeWidth="1.2" fill="none" />
        </g>
        {/* Top-Right */}
        <g transform="translate(406, 14) scale(-1, 1)">
          <path
            d="M 2 18 C 2 8 8 2 18 2 C 12 6 6 12 2 18 Z"
            fill="currentColor"
          />
          <circle cx="8" cy="8" r="2.5" fill="currentColor" />
          <path d="M 4 22 Q 10 10 22 4" stroke="currentColor" strokeWidth="1.2" fill="none" />
        </g>
        {/* Bottom-Left */}
        <g transform="translate(14, 86) scale(1, -1)">
          <path
            d="M 2 18 C 2 8 8 2 18 2 C 12 6 6 12 2 18 Z"
            fill="currentColor"
          />
          <circle cx="8" cy="8" r="2.5" fill="currentColor" />
          <path d="M 4 22 Q 10 10 22 4" stroke="currentColor" strokeWidth="1.2" fill="none" />
        </g>
        {/* Bottom-Right */}
        <g transform="translate(406, 86) scale(-1, -1)">
          <path
            d="M 2 18 C 2 8 8 2 18 2 C 12 6 6 12 2 18 Z"
            fill="currentColor"
          />
          <circle cx="8" cy="8" r="2.5" fill="currentColor" />
          <path d="M 4 22 Q 10 10 22 4" stroke="currentColor" strokeWidth="1.2" fill="none" />
        </g>

        {/* Center Crest Top & Bottom */}
        <path
          d="M 195 12 Q 210 2 225 12 Q 210 7 195 12 Z"
          fill="currentColor"
        />
        <circle cx="210" cy="5" r="2" fill="currentColor" />
        <path
          d="M 195 88 Q 210 98 225 88 Q 210 93 195 88 Z"
          fill="currentColor"
        />
        <circle cx="210" cy="95" r="2" fill="currentColor" />

        {/* Calligraphic Arabic Text Inside Cartouche */}
        <text
          x="50%"
          y="56%"
          dominantBaseline="middle"
          textAnchor="middle"
          className="font-arabic font-bold"
          fill="currentColor"
          style={{
            fontFamily: "'Amiri Quran', 'Scheherazade New', serif",
            fontSize: '28px',
            letterSpacing: '0.5px',
            direction: 'rtl'
          }}
        >
          {text}
        </text>
      </svg>
    </div>
  );
};
