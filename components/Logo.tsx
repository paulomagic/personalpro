
import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
  variant?: 'default' | 'white';
}

// Logo de infinito estilizado baseado nas referências do usuário
const Logo: React.FC<LogoProps> = ({ className = "", size = 48, variant = 'default' }) => {
  const color = variant === 'white' ? '#ffffff' : '#3B5998';

  return (
    <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size * 0.67 }}>
      <svg
        viewBox="0 0 48 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* Infinity symbol */}
        <path
          d="M12 16C12 9.373 17.373 4 24 4C30.627 4 36 9.373 36 16C36 22.627 30.627 28 24 28"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M36 16C36 22.627 30.627 28 24 28C17.373 28 12 22.627 12 16"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    </div>
  );
};

export default Logo;
