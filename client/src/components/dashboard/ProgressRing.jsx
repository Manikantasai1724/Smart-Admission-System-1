import React, { useEffect, useState } from 'react';

function ProgressRing({
  percentage = 0,
  size = 120,
  strokeWidth = 8,
  color = '#6366f1',
  secondaryColor = '#e2e8f0',
  className = '',
  showLabel = true,
  animated = false,
}) {
  const [animatedPercentage, setAnimatedPercentage] = useState(percentage);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (animatedPercentage / 100) * circumference;

  useEffect(() => {
    setAnimatedPercentage(percentage);
  }, [percentage]);

  const getColor = () => {
    if (typeof color === 'string') return color;
    if (percentage >= 100) return '#22c55e';
    if (percentage >= 50) return '#3b82f6';
    if (percentage > 0) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg width={size} height={size} className="transform -rotate-90">
        <defs>
          <linearGradient id={`progress-gradient-${percentage}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={getColor()} stopOpacity="0.8" />
            <stop offset="100%" stopColor={getColor()} stopOpacity="1" />
          </linearGradient>
        </defs>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={secondaryColor}
          strokeWidth={strokeWidth}
          className="dark:opacity-20"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#progress-gradient-${percentage})`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-none"
        />
      </svg>
      {showLabel && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-gray-900 dark:text-white">
            {Math.round(animatedPercentage)}%
          </span>
        </div>
      )}
    </div>
  );
}

export default ProgressRing;
