import React from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

const ReviewStars = ({ value = 0, onChange, size = 'md', interactive = false, className }) => {
  const [hoverValue, setHoverValue] = React.useState(0);

  const starSizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8'
  };

  const handleMouseEnter = (index) => {
    if (interactive) {
      setHoverValue(index);
    }
  };

  const handleMouseLeave = () => {
    if (interactive) {
      setHoverValue(0);
    }
  };

  const handleClick = (index) => {
    if (interactive && onChange) {
      onChange(index);
    }
  };

  const currentVal = interactive && hoverValue > 0 ? hoverValue : value;

  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      {[1, 2, 3, 4, 5].map((index) => {
        const filled = index <= currentVal;
        const isHalf = !Number.isInteger(currentVal) && index === Math.ceil(currentVal);

        return (
          <button
            key={index}
            type="button"
            disabled={!interactive}
            className={cn(
              "transition-transform focus:outline-none",
              interactive ? "cursor-pointer hover:scale-110" : "cursor-default"
            )}
            onMouseEnter={() => handleMouseEnter(index)}
            onMouseLeave={handleMouseLeave}
            onClick={() => handleClick(index)}
          >
            <div className="relative">
               <Star
                  className={cn(
                    starSizeClasses[size],
                    filled ? "fill-[#FCD34D] text-[#FCD34D]" : "fill-transparent text-gray-300",
                    "transition-colors duration-200"
                  )}
                />
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default ReviewStars;