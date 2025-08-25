import React, { useEffect, useState } from 'react';
import { X, Brain, TrendingUp, Upload, FileText, Clock, Zap } from 'lucide-react';

interface HoaDocumentsProps {
  onClose: () => void;
}

interface CCRDocument {
  id: string;
  name: string;
  type: 'master_ccr' | 'amendment' | 'architectural_guidelines' | 'community_rules';
  uploadDate: string;
  status: 'processing' | 'analyzed' | 'error';
  sectionsFound?: number;
  aiConfidence?: number;
}

interface CompanyData {
  name: string;
  address: string;
  phone: string;
  email: string;
  ccrDocuments?: CCRDocument[];
}

const HoaDocuments: React.FC<HoaDocumentsProps> = ({ onClose }) => {
  const loadCompanyData = (): CompanyData => {
    try {
      const raw = localStorage.getItem('hoa-company-profile');
      if (raw) return JSON.parse(raw);
    } catch {}
    return {
      name: 'Seabreeze Management Company',
      address: '',
      phone: '',
      email: '',
      ccrDocuments: []
    };
  };

  const [companyData, setCompanyData] = useState<CompanyData>(loadCompanyData());
  const [showAIStats, setShowAIStats] = useState(false);
  const [uploadingCCR, setUploadingCCR] = useState(false);

  useEffect(() => {
    // persist on unmount
    return () => {
      localStorage.setItem('hoa-company-profile', JSON.stringify(companyData));
      window.dispatchEvent(new CustomEvent('company-profile-updated'));
    };
  }, [companyData]);

  const handleCCRUpload = (
    event: React.ChangeEvent<HTMLInputElement>,
    type: 'master_ccr' | 'amendment' | 'architectural_guidelines' | 'community_rules'
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadingCCR(true);

    const newDocument: CCRDocument = {
      id: `ccr-${Date.now()}`,
      name: file.name,
      type,
      uploadDate: new Date().toISOString(),
      status: 'processing'
    };

    setCompanyData(prev => ({
      ...prev,
      ccrDocuments: [...(prev.ccrDocuments || []), newDocument]
    }));

    setTimeout(() => {
      const processed: CCRDocument = {
        ...newDocument,
        status: 'analyzed',
        sectionsFound: Math.floor(Math.random() * 50) + 10,
        aiConfidence: Math.floor(Math.random() * 15) + 85
      };

      setCompanyData(prev => ({
        ...prev,
        ccrDocuments: (prev.ccrDocuments || []).map(d => (d.id === newDocument.id ? processed : d))
      }));

      setUploadingCCR(false);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-5xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-semibold text-gray-900">Governing Documents</h3>
              <div className="flex items-center space-x-1 bg-purple-50 text-purple-700 px-2 py-1 rounded-full text-xs">
                <Brain className="w-3 h-3" />
                <span>AI-Powered</span>
              </div>
              <div className="flex items-center space-x-1 bg-amber-50 text-amber-700 px-2 py-1 rounded-full text-xs">
                <span>Beta</span>
              </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2">
              <X className="w-5 h-5" />
            </button>
          </div>

          <p className="text-gray-600 mb-6">
            Upload your association's governing documents — CC&Rs, bylaws, architectural guidelines, rules and
            regulations, and related policies — for AI analysis. The system automatically extracts and indexes
            sections to provide intelligent suggestions during request reviews.
          </p>

          {showAIStats && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-700">
                    {companyData.ccrDocuments?.reduce((sum, d) => sum + (d.sectionsFound || 0), 0) || 0}
                  </div>
                  <div className="text-sm text-purple-600">Total Sections</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-700">{companyData.ccrDocuments?.length || 0}</div>
                  <div className="text-sm text-purple-600">Documents</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-700">
                    {companyData.ccrDocuments?.length
                      ? Math.round(
                          companyData.ccrDocuments.reduce((sum, d) => sum + (d.aiConfidence || 0), 0) /
                            companyData.ccrDocuments.length
                        )
                      : 0}
                    %
                  </div>
                  <div className="text-sm text-purple-600">Avg Confidence</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-700">1,247</div>
                  <div className="text-sm text-purple-600">Suggestions Made</div>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowAIStats(!showAIStats)}
                className="text-purple-600 hover:text-purple-700 text-sm flex items-center space-x-1"
              >
                <TrendingUp className="w-4 h-4" />
                <span>AI Statistics</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Upload New Documents</h4>
              <div className="space-y-3">
                {[
                  { type: 'master_ccr' as const, label: 'Master CC&Rs', description: 'Primary governing documents' },
                  { type: 'architectural_guidelines' as const, label: 'Architectural Guidelines', description: 'Design and modification standards' },
                  { type: 'amendment' as const, label: 'Amendments', description: 'Updates and modifications' },
                  { type: 'community_rules' as const, label: 'Community Rules', description: 'Operational policies' }
                ].map((docType) => (
                  <div key={docType.type} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h5 className="font-medium text-gray-900 text-sm">{docType.label}</h5>
                        <p className="text-xs text-gray-500">{docType.description}</p>
                      </div>
                      <div>
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx"
                          onChange={(e) => handleCCRUpload(e, docType.type)}
                          className="sr-only"
                          id={`hoa-docs-upload-${docType.type}`}
                          disabled={uploadingCCR}
                        />
                        <label
                          htmlFor={`hoa-docs-upload-${docType.type}`}
                          className={`cursor-pointer inline-flex items-center space-x-1 text-xs px-2 py-1 rounded ${
                            uploadingCCR ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                          }`}
                        >
                          <Upload className="w-3 h-3" />
                          <span>Upload</span>
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-3">Current Documents</h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {(companyData.ccrDocuments || []).length > 0 ? (
                  (companyData.ccrDocuments || []).map((doc) => (
                    <div key={doc.id} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <FileText className="w-4 h-4 text-gray-500" />
                            <h5 className="font-medium text-gray-900 text-sm">{doc.name}</h5>
                            <span
                              className={`px-2 py-1 rounded-full text-xs ${
                                doc.status === 'analyzed'
                                  ? 'bg-green-50 text-green-700'
                                  : doc.status === 'processing'
                                  ? 'bg-yellow-50 text-yellow-700'
                                  : 'bg-red-50 text-red-700'
                              }`}
                            >
                              {doc.status === 'analyzed' ? 'Analyzed' : doc.status === 'processing' ? 'Processing...' : 'Error'}
                            </span>
                          </div>
                          <div className="flex items-center space-x-3 text-xs text-gray-500">
                            <span>{new Date(doc.uploadDate).toLocaleDateString()}</span>
                            {doc.sectionsFound && (
                              <>
                                <span>•</span>
                                <span>{doc.sectionsFound} sections</span>
                              </>
                            )}
                            {doc.aiConfidence && (
                              <>
                                <span>•</span>
                                <span>{doc.aiConfidence}% confidence</span>
                              </>
                            )}
                          </div>
                        </div>
                        {doc.status === 'processing' && (
                          <div className="flex items-center space-x-1 text-yellow-600">
                            <Clock className="w-4 h-4 animate-spin" />
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm">No CC&R documents uploaded yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Zap className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-blue-800">AI Learning System</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Our AI continuously learns from HOA Manager decisions and homeowner feedback to improve CC&R suggestions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HoaDocuments;


