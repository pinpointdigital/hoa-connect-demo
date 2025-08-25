import React, { useState, useEffect } from 'react';
import LogoFallback from './LogoFallback';

interface CompanyLogoProps {
  type: 'square' | 'rectangle';
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  alt?: string;
}

interface CompanyData {
  name: string;
  logos: {
    square?: string;
    rectangle?: string;
  };
}

const CompanyLogo: React.FC<CompanyLogoProps> = ({ 
  type, 
  className = '', 
  size = 'md',
  alt = 'Company Logo'
}) => {
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);

  useEffect(() => {
    // Load company data from localStorage
    const loadCompanyData = () => {
      try {
        const saved = localStorage.getItem('hoa-company-profile');
        if (saved) {
          const parsedData = JSON.parse(saved);
          // Ensure the data has the expected structure
          const validData = {
            name: parsedData.name || 'Seabreeze Management Company',
            logos: {
              square: parsedData.logos?.square, // ignore legacy logo field to avoid stale data
              rectangle: parsedData.logos?.rectangle
            }
          };
          setCompanyData(validData);
        } else {
          // Default fallback data
          setCompanyData({
            name: 'Seabreeze Management Company',
            logos: {
              square: undefined,
              rectangle: undefined
            }
          });
        }
      } catch (error) {
        console.error('Error loading company data for logo:', error);
        setCompanyData({
          name: 'Company',
          logos: {
            square: undefined,
            rectangle: undefined
          }
        });
      }
    };

    loadCompanyData();

    // Listen for company profile updates
    const handleProfileUpdate = () => {
      loadCompanyData();
    };

    window.addEventListener('company-profile-updated', handleProfileUpdate);
    return () => {
      window.removeEventListener('company-profile-updated', handleProfileUpdate);
    };
  }, []);

  if (!companyData) {
    return (
      <LogoFallback 
        type={type} 
        companyName="Loading..." 
        size={size}
        className={className}
      />
    );
  }

  const logoSrc = companyData?.logos?.[type];

  if (logoSrc) {
    // Size configurations for actual logos
    const sizeConfig = {
      sm: type === 'square' ? 'w-8 h-8' : 'w-16 h-4',
      md: type === 'square' ? 'w-12 h-12' : 'w-24 h-6',
      lg: type === 'square' ? 'w-16 h-16' : 'w-32 h-8'
    };

    return (
      <img
        src={logoSrc}
        alt={alt}
        className={`object-contain ${sizeConfig[size]} ${className}`}
      />
    );
  }

  // Fallback to generated logo
  return (
    <LogoFallback 
      type={type} 
      companyName={companyData?.name || 'Company'}
      size={size}
      className={className}
    />
  );
};

export default CompanyLogo;
