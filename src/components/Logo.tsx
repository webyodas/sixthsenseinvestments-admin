import React from 'react';

interface LogoProps {
  className?: string;
  variant?: 'gold' | 'white' | 'current';
}

export const Logo: React.FC<LogoProps> = ({ 
  className = 'w-7 h-7', 
  variant = 'gold' 
}) => {
  const colorClass = 
    variant === 'gold' ? 'text-[#d4af37]' : 
    variant === 'white' ? 'text-white' : 
    'currentColor';

  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 200 260" 
      fill="currentColor"
      className={`${colorClass} ${className} shrink-0`}
      aria-label="Sixth Sense Investments Official Monogram"
    >
      <path 
        d="M 102.1 10.5 L 99.0 10.5 L 35.9 73.6 L 35.3 76.7 L 40.5 83.4 L 114.5 156.9 L 115.0 162.1 L 105.7 171.4 L 102.6 171.9 L 97.4 167.8 L 22.4 92.2 L 18.3 91.7 L 10.0 100.5 L 10.5 104.7 L 101.6 195.7 L 105.7 195.7 L 128.4 173.4 L 131.0 174.0 L 139.8 182.8 L 139.8 185.9 L 101.0 225.2 L 98.4 225.2 L 42.6 169.8 L 37.9 168.8 L 30.2 177.1 L 31.2 182.8 L 94.3 245.9 L 100.0 249.5 L 164.1 186.4 L 164.1 182.8 L 88.1 106.2 L 84.0 100.5 L 94.8 89.1 L 98.4 89.1 L 178.1 168.8 L 182.2 168.3 L 190.0 160.0 L 189.5 155.3 L 98.4 64.8 L 93.8 65.3 L 71.6 87.1 L 69.0 86.6 L 60.2 78.3 L 60.2 74.7 L 99.0 35.3 L 101.0 34.8 L 158.4 91.7 L 162.6 90.7 L 169.8 83.4 L 168.8 77.8 Z" 
        fillRule="evenodd" 
      />
    </svg>
  );
};
