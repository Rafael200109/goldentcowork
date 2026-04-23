import React from 'react';

const PuzzlePieceGreen = ({ className = "" }) => {
  return (
    <svg
      viewBox="0 0 140 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <filter id="greenShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
          <feOffset dx="0" dy="2" result="offsetblur"/>
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.3"/>
          </feComponentTransfer>
          <feMerge>
            <feMergeNode/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      <path
        d="M 15 35 
           Q 15 15 35 15 
           L 50 15 
           Q 50 10 55 5 
           Q 60 0 65 5 
           Q 70 10 70 15 
           L 105 15 
           L 105 30 
           Q 110 30 115 35 
           Q 120 40 115 45 
           Q 110 50 105 50 
           L 105 105 
           Q 105 125 85 125 
           L 70 125 
           Q 70 130 65 135 
           Q 60 140 55 135 
           Q 50 130 50 125 
           L 35 125 
           Q 15 125 15 105 
           L 15 90 
           Q 10 90 5 85 
           Q 0 80 5 75 
           Q 10 70 15 70 
           Z"
        fill="#2D5016"
        filter="url(#greenShadow)"
      />
    </svg>
  );
};

export default PuzzlePieceGreen;