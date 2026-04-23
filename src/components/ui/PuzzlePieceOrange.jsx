import React from 'react';

const PuzzlePieceOrange = ({ className = "" }) => {
  return (
    <svg
      viewBox="0 0 140 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <filter id="orangeShadow" x="-20%" y="-20%" width="140%" height="140%">
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
        d="M 35 15 
           Q 15 15 15 35 
           L 15 50 
           Q 10 50 5 55 
           Q 0 60 5 65 
           Q 10 70 15 70 
           L 15 105 
           Q 15 125 35 125 
           L 50 125 
           Q 50 130 55 135 
           Q 60 140 65 135 
           Q 70 130 70 125 
           L 105 125 
           Q 125 125 125 105 
           L 125 70 
           Q 130 70 135 65 
           Q 140 60 135 55 
           Q 130 50 125 50 
           L 125 35 
           Q 125 15 105 15 
           L 70 15 
           Q 70 10 65 5 
           Q 60 0 55 5 
           Q 50 10 50 15 
           Z"
        fill="#FF6B35"
        filter="url(#orangeShadow)"
      />
    </svg>
  );
};

export default PuzzlePieceOrange;