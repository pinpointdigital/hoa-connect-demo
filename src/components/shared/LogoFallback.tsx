import React from 'react';
import { Home } from 'lucide-react';

interface LogoFallbackProps {
  type: 'square' | 'rectangle';
  companyName?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const LogoFallback: React.FC<LogoFallbackProps> = ({ 
  type, 
  companyName = 'Company', 
  className = '',
  size = 'md'
}) => {
  // Generate initials from company name
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Size configurations
  const sizeConfig = {
    sm: {
      square: { width: 32, height: 32, fontSize: '12px', iconSize: 18 },
      rectangle: { width: 80, height: 20, iconSize: 22 }
    },
    md: {
      square: { width: 48, height: 48, fontSize: '18px', iconSize: 24 },
      rectangle: { width: 140, height: 30, iconSize: 30 }
    },
    lg: {
      square: { width: 64, height: 64, fontSize: '24px', iconSize: 32 },
      rectangle: { width: 200, height: 43, iconSize: 40 }
    }
  };

  const config = sizeConfig[size];
  const initials = getInitials(companyName);

  if (type === 'square') {
    return (
      <div
        className={`flex items-center justify-center bg-gray-800 text-white font-semibold rounded-lg shadow-sm ${className}`}
        style={{
          width: config.square.width,
          height: config.square.height,
          fontSize: config.square.fontSize
        }}
        title={`${companyName} Logo`}
      >
        <Home size={config.square.iconSize} className="text-white" strokeWidth={1.5} />
      </div>
    );
  }

  // Rectangle type - house icon
  return (
    <div
      className={`flex items-center justify-center text-gray-800 ${className}`}
      style={{
        width: config.rectangle.width,
        height: config.rectangle.height
      }}
      title={`${companyName} Logo`}
    >
      <Home size={config.rectangle.iconSize} className="text-gray-800" strokeWidth={1.5} />
    </div>
  );
};

export default LogoFallback;
