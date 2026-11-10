'use client';

import { useState } from 'react';

interface StarRatingProps {
  value?: number;
  onChange?: (value: number) => void;
  readOnly?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function StarRating({
  value = 0,
  onChange,
  readOnly = false,
  size = 'md',
}: StarRatingProps) {
  const [hovered, setHovered] = useState(0);

  const starSize =
    size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-8 h-8' : 'w-6 h-6';

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = (hovered || value) >= star;
        return (
          <button
            key={star}
            type="button"
            onClick={() => !readOnly && onChange?.(star)}
            onMouseEnter={() => !readOnly && setHovered(star)}
            onMouseLeave={() => !readOnly && setHovered(0)}
            disabled={readOnly}
            className={`${readOnly ? 'cursor-default' : 'cursor-pointer'} focus:outline-none`}
            aria-label={`${star} bintang`}
          >
            <svg
              className={`${starSize} ${filled ? 'text-yellow-400' : 'text-gray-300'} transition-colors`}
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </button>
        );
      })}
    </div>
  );
}

