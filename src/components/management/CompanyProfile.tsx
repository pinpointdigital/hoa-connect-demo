import React, { useState, useEffect } from 'react';
import { useDemoContext } from '../../contexts/DemoContext';
import LogoFallback from '../shared/LogoFallback';
import { 
  Building, 
  Phone, 
  Mail, 
  MapPin, 
  User, 
  Upload,
  Save,
  X,
  FileText,
  Brain,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Zap,
  Clock,
  Image as ImageIcon,
  Trash2
} from 'lucide-react';

interface CompanyProfileProps {
  onClose: () => void;
}

interface CompanyData {
  name: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  mainContact: {
    name: string;
    title: string;
    phone: string;
    email: string;
  };
  logos: {
    square?: string; // 200x200px for website navigation
    rectangle?: string; // 350x75px for forms, PDFs, emails
  };
  ccrDocuments?: {
    id: string;
    name: string;
    type: 'master_ccr' | 'amendment' | 'architectural_guidelines' | 'community_rules';
    uploadDate: string;
    status: 'processing' | 'analyzed' | 'error';
    sectionsFound?: number;
    aiConfidence?: number;
  }[];
}

const CompanyProfile: React.FC<CompanyProfileProps> = ({ onClose }) => {
  const { addNotification } = useDemoContext();
  
  // Load saved company data or use defaults
  const loadCompanyData = (): CompanyData => {
    const defaultData: CompanyData = {
      name: 'Seabreeze Management Company',
      address: '26840 Aliso Viejo Pkwy, Suite 100, Aliso Viejo, CA 92656',
      phone: '(949) 855-9300',
      email: 'info@seabreezemgmt.com',
      website: 'www.seabreezemgmt.com',
      mainContact: {
        name: 'Allan Chua',
        title: 'Community Manager',
        phone: '(949) 855-9301',
        email: 'allan.chua@seabreezemgmt.com'
      },
      logos: {
        square: undefined,
        rectangle: undefined
      },
      ccrDocuments: [
        {
          id: 'ccr-master-2019',
          name: 'Rancho Madrina Master CC&Rs (2019)',
          type: 'master_ccr',
          uploadDate: '2024-01-15T10:30:00Z',
          status: 'analyzed',
          sectionsFound: 47,
          aiConfidence: 94
        },
        {
          id: 'ccr-arch-guidelines-2023',
          name: 'Architectural Design Guidelines (2023)',
          type: 'architectural_guidelines',
          uploadDate: '2024-02-10T14:20:00Z',
          status: 'analyzed',
          sectionsFound: 23,
          aiConfidence: 91
        },
        {
          id: 'ccr-amendment-2024',
          name: 'Amendment #3 - Solar Panel Guidelines',
          type: 'amendment',
          uploadDate: '2024-08-01T09:15:00Z',
          status: 'analyzed',
          sectionsFound: 8,
          aiConfidence: 97
        }
      ]
    };

    const saved = localStorage.getItem('hoa-company-profile');
    if (saved) {
      try {
        const parsedData = JSON.parse(saved);
        
        // Ensure the parsed data has all required fields, especially mainContact and logos
        if (parsedData && typeof parsedData === 'object') {
          // Handle legacy logo field migration
          const legacyLogo = parsedData.logo;
          
          // Merge with defaults to ensure all required fields exist
          return {
            ...defaultData,
            ...parsedData,
            mainContact: {
              ...defaultData.mainContact,
              ...(parsedData.mainContact || {})
            },
            logos: {
              ...defaultData.logos,
              ...(parsedData.logos || {}),
              // Migrate legacy logo to square if no logos exist
              ...(legacyLogo && !parsedData.logos ? { square: legacyLogo } : {})
            }
          };
        }
      } catch (error) {
        console.error('Error loading company profile:', error);
      }
    }
    
    return defaultData;
  };
  
  const [companyData, setCompanyData] = useState<CompanyData>(() => {
    const data = loadCompanyData();
    console.log('Loaded company data:', data);
    return data;
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [uploadingCCR, setUploadingCCR] = useState(false);
  const [showAIStats, setShowAIStats] = useState(false);
  // No cropper: direct upload with auto-scaling

  // Auto-save when component unmounts or data changes
  useEffect(() => {
    return () => {
      // Auto-save on unmount
      if (hasChanges) {
        localStorage.setItem('hoa-company-profile', JSON.stringify(companyData));
        window.dispatchEvent(new CustomEvent('company-profile-updated'));
      }
    };
  }, [companyData, hasChanges]);

  // Safety check to ensure companyData is properly initialized
  if (!companyData || !companyData.mainContact) {
    console.error('CompanyData not properly initialized:', companyData);
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md">
          <h3 className="text-lg font-semibold text-red-600 mb-2">Error Loading Company Profile</h3>
          <p className="text-gray-600 mb-4">There was an error loading the company profile data.</p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const handleInputChange = (field: string, value: string) => {
    setCompanyData(prev => ({
      ...prev,
      [field]: value
    }));
    setHasChanges(true);
  };

  const handleContactChange = (field: string, value: string) => {
    setCompanyData(prev => ({
      ...prev,
      mainContact: {
        ...prev.mainContact,
        [field]: value
      }
    }));
    setHasChanges(true);
  };

  const resizeImageToTarget = (img: HTMLImageElement, targetW: number, targetH: number): string => {
    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';
    // Transparent background by default; compute contain fit
    const ratio = Math.min(targetW / img.naturalWidth, targetH / img.naturalHeight);
    const drawW = Math.round(img.naturalWidth * ratio);
    const drawH = Math.round(img.naturalHeight * ratio);
    const dx = Math.round((targetW - drawW) / 2);
    const dy = Math.round((targetH - drawH) / 2);
    ctx.clearRect(0, 0, targetW, targetH);
    ctx.drawImage(img, dx, dy, drawW, drawH);
    return canvas.toDataURL('image/png');
  };

  const handleLogoFile = (file: File, logoType: 'square' | 'rectangle') => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const base64 = resizeImageToTarget(img, logoType === 'square' ? 200 : 350, logoType === 'square' ? 200 : 75);
        if (!base64) return;
        handleLogoSave(base64, logoType);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleLogoSave = (croppedImageData: string, logoType: 'square' | 'rectangle') => {
    setCompanyData(prev => ({
      ...prev,
      logos: {
        ...prev.logos,
        [logoType]: croppedImageData
      }
    }));
    setHasChanges(true);
    
    addNotification(`✅ ${logoType === 'square' ? 'Square' : 'Rectangle'} logo has been successfully updated.`);

    // Persist immediately so other parts of the app (navigation) update without waiting for save
    const updated = {
      ...companyData,
      logos: {
        ...companyData.logos,
        [logoType]: croppedImageData
      }
    } as CompanyData;
    localStorage.setItem('hoa-company-profile', JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('company-profile-updated'));
  };

  const handleLogoDelete = (logoType: 'square' | 'rectangle') => {
    setCompanyData(prev => ({
      ...prev,
      logos: {
        ...prev.logos,
        [logoType]: undefined
      }
    }));
    setHasChanges(true);
    
    addNotification(`🗑️ ${logoType === 'square' ? 'Square' : 'Rectangle'} logo has been removed.`);

    // Persist removal immediately and notify listeners
    const updated = {
      ...companyData,
      logos: {
        ...companyData.logos,
        [logoType]: undefined
      }
    } as CompanyData;
    localStorage.setItem('hoa-company-profile', JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('company-profile-updated'));
  };



  const handleCCRUpload = (event: React.ChangeEvent<HTMLInputElement>, type: 'master_ccr' | 'amendment' | 'architectural_guidelines' | 'community_rules') => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadingCCR(true);
      
      // Simulate AI processing
      const newDocument = {
        id: `ccr-${Date.now()}`,
        name: file.name,
        type,
        uploadDate: new Date().toISOString(),
        status: 'processing' as const
      };

      // Add document to list
      const updatedData = {
        ...companyData,
        ccrDocuments: [...(companyData.ccrDocuments || []), newDocument]
      };
      setCompanyData(updatedData);
      setHasChanges(true);

      addNotification('📄 CC&R document uploaded - AI analysis starting...');

      // Simulate AI processing time
      setTimeout(() => {
        const processedDocument = {
          ...newDocument,
          status: 'analyzed' as const,
          sectionsFound: Math.floor(Math.random() * 30) + 15, // 15-45 sections
          aiConfidence: Math.floor(Math.random() * 20) + 80 // 80-100% confidence
        };

        const finalData = {
          ...updatedData,
          ccrDocuments: updatedData.ccrDocuments!.map(doc => 
            doc.id === newDocument.id ? processedDocument : doc
          )
        };

        setCompanyData(finalData);
        localStorage.setItem('hoa-company-profile', JSON.stringify(finalData));
        setUploadingCCR(false);
        
        addNotification(`🤖 AI analysis complete! Found ${processedDocument.sectionsFound} sections with ${processedDocument.aiConfidence}% confidence`);
      }, 3000);
    }
  };

  const handleSave = () => {
    // In a real app, this would save to backend
    localStorage.setItem('hoa-company-profile', JSON.stringify(companyData));
    window.dispatchEvent(new CustomEvent('company-profile-updated'));
    
    addNotification('✅ Company profile updated successfully');
    alert('Company profile saved!\n\nChanges will be reflected in:\n• Downloaded ARC forms\n• Email signatures\n• Official documents\n• System branding');
    
    setHasChanges(false);
  };

  const handleClose = () => {
    // Auto-save before closing if there are changes
    if (hasChanges) {
      localStorage.setItem('hoa-company-profile', JSON.stringify(companyData));
      window.dispatchEvent(new CustomEvent('company-profile-updated'));
      addNotification('✅ Company profile auto-saved');
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white min-h-[80vh]">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Company Profile Management</h2>
            <p className="text-gray-600">Manage HOA management company information and branding</p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Company Information */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Building className="w-5 h-5 mr-2" />
              Company Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Name
                </label>
                <input
                  type="text"
                  value={companyData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="input-field"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Website
                </label>
                <input
                  type="text"
                  value={companyData.website || ''}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  className="input-field"
                  placeholder="www.example.com"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Business Address
                </label>
                <input
                  type="text"
                  value={companyData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  className="input-field"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone className="w-4 h-4 inline mr-1" />
                  Main Phone
                </label>
                <input
                  type="tel"
                  value={companyData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="input-field"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail className="w-4 h-4 inline mr-1" />
                  Main Email
                </label>
                <input
                  type="email"
                  value={companyData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="input-field"
                />
              </div>
            </div>
          </div>

          {/* Main Contact */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <User className="w-5 h-5 mr-2" />
              Main Point of Contact
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Name
                </label>
                <input
                  type="text"
                  value={companyData.mainContact.name}
                  onChange={(e) => handleContactChange('name', e.target.value)}
                  className="input-field"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title/Position
                </label>
                <input
                  type="text"
                  value={companyData.mainContact.title}
                  onChange={(e) => handleContactChange('title', e.target.value)}
                  className="input-field"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone className="w-4 h-4 inline mr-1" />
                  Direct Phone
                </label>
                <input
                  type="tel"
                  value={companyData.mainContact.phone}
                  onChange={(e) => handleContactChange('phone', e.target.value)}
                  className="input-field"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail className="w-4 h-4 inline mr-1" />
                  Direct Email
                </label>
                <input
                  type="email"
                  value={companyData.mainContact.email}
                  onChange={(e) => handleContactChange('email', e.target.value)}
                  className="input-field"
                />
              </div>
            </div>
          </div>

          {/* Company Logos */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <ImageIcon className="w-5 h-5 mr-2" />
              Company Logos
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Upload separate logos for different uses: square for website navigation, rectangle for forms and documents.
            </p>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Square Logo */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-md font-medium text-gray-900">Square Logo</h4>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">200×200px</span>
                </div>
                <p className="text-sm text-gray-600">Used for website navigation and branding</p>
                
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center justify-center h-32">
                    {companyData.logos.square ? (
                      <img
                        src={companyData.logos.square}
                        alt="Square Company Logo"
                        className="max-h-24 max-w-24 object-contain rounded-lg shadow-sm"
                      />
                    ) : (
                      <LogoFallback 
                        type="square" 
                        companyName={companyData.name}
                        size="lg"
                      />
                    )}
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <label className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer">
                    <Upload className="w-4 h-4" />
                    <span>{companyData.logos.square ? 'Replace' : 'Upload'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleLogoFile(file, 'square');
                        e.currentTarget.value = '';
                      }}
                    />
                  </label>
                  {companyData.logos.square && (
                    <button
                      onClick={() => handleLogoDelete('square')}
                      className="px-3 py-2 border border-red-300 rounded-lg text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Rectangle Logo */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-md font-medium text-gray-900">Rectangle Logo</h4>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">350×75px</span>
                </div>
                <p className="text-sm text-gray-600">Used for forms, PDFs, and email communications</p>
                
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center justify-center h-32">
                    {companyData.logos.rectangle ? (
                      <img
                        src={companyData.logos.rectangle}
                        alt="Rectangle Company Logo"
                        className="max-h-16 max-w-full object-contain rounded shadow-sm"
                      />
                    ) : (
                      <LogoFallback 
                        type="rectangle" 
                        companyName={companyData.name}
                        size="lg"
                      />
                    )}
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <label className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer">
                    <Upload className="w-4 h-4" />
                    <span>{companyData.logos.rectangle ? 'Replace' : 'Upload'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleLogoFile(file, 'rectangle');
                        e.currentTarget.value = '';
                      }}
                    />
                  </label>
                  {companyData.logos.rectangle && (
                    <button
                      onClick={() => handleLogoDelete('rectangle')}
                      className="px-3 py-2 border border-red-300 rounded-lg text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* CC&R Upload & AI Analysis moved to HOA Documents modal */}

          {/* Form Preview */}
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Form Preview
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Preview of how your company information will appear on generated ARC forms:
            </p>
            
            <div className="bg-white border border-gray-300 rounded p-6">
              {/* Header with company info on left, logo on right */}
              <div className="flex justify-between items-start mb-6">
                <div className="text-left">
                  <h4 className="font-bold text-gray-900 text-lg">{companyData.name.toUpperCase()}</h4>
                  <p className="text-sm text-gray-700 font-medium">RANCHO MADRINA COMMUNITY ASSOCIATION</p>
                  <div className="mt-2 text-xs text-gray-600">
                    <p>{companyData.address}</p>
                    <p>Phone: {companyData.phone} | Email: {companyData.email}</p>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  {companyData.logos.rectangle ? (
                    <img
                      src={companyData.logos.rectangle}
                      alt="Company Logo"
                      className="h-16 object-contain"
                    />
                  ) : (
                    <LogoFallback 
                      type="rectangle" 
                      companyName={companyData.name}
                      size="lg"
                    />
                  )}
                </div>
              </div>
              
              {/* Form Title */}
              <div className="text-center border-t border-gray-200 pt-4">
                <p className="text-lg font-bold text-gray-900">REQUEST FOR ARCHITECTURAL APPROVAL</p>
                <p className="text-sm text-gray-600 mt-1">All exterior modifications require prior approval</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between mt-6 pt-6 border-t border-gray-200">
          <button
            onClick={handleClose}
            className="btn-secondary"
          >
            {hasChanges ? 'Save & Close' : 'Close'}
          </button>
          
          <button
            onClick={handleSave}
            disabled={!hasChanges}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>{hasChanges ? 'Save Changes' : 'No Changes'}</span>
          </button>
        </div>
      </div>

      {/* No cropper modal in simplified flow */}
    </div>
  );
};

export default CompanyProfile;
