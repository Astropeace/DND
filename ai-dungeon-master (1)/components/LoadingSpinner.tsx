import React from 'react';

interface LoadingSpinnerProps {
  size?: string; 
  color?: string;
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'w-8 h-8', color = 'text-amber-400', className }) => {
  // More thematic spinner - an attempt at a "rune-like" or "arcane" spinner
  return (
    <svg
      className={`animate-spin ${size} ${color} ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 100 100"
      aria-label="Loading..."
    >
      <defs>
        <linearGradient id="spinnerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{stopColor: "currentColor", stopOpacity: 0.1}} />
          <stop offset="100%" style={{stopColor: "currentColor", stopOpacity: 1}} />
        </linearGradient>
      </defs>
      <path
        strokeLinecap="round"
        strokeWidth="8"
        stroke="url(#spinnerGradient)"
        d="M50 10 A 40 40 0 0 1 90 50"
      />
      <path
        strokeLinecap="round"
        strokeWidth="8"
        stroke="currentColor"
        strokeOpacity="0.3"
        d="M50 10 A 40 40 0 0 1 90 50 L 50 50 Z"
      />
       <path
        strokeLinecap="round"
        strokeWidth="8"
        stroke="url(#spinnerGradient)"
        transform="rotate(120 50 50)"
        d="M50 10 A 40 40 0 0 1 90 50"
      />
       <path
        strokeLinecap="round"
        strokeWidth="8"
        stroke="currentColor"
        strokeOpacity="0.3"
        transform="rotate(120 50 50)"
        d="M50 10 A 40 40 0 0 1 90 50 L 50 50 Z"
      />
      <path
        strokeLinecap="round"
        strokeWidth="8"
        stroke="url(#spinnerGradient)"
        transform="rotate(240 50 50)"
        d="M50 10 A 40 40 0 0 1 90 50"
      />
      <path
        strokeLinecap="round"
        strokeWidth="8"
        stroke="currentColor"
        strokeOpacity="0.3"
        transform="rotate(240 50 50)"
        d="M50 10 A 40 40 0 0 1 90 50 L 50 50 Z"
      />
    </svg>
  );
};

export default LoadingSpinner;