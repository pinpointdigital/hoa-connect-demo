import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useDemoContext } from '../../contexts/DemoContext';
import { Request, CCRSection } from '../../types';
import { 
  FileText, 
  CheckCircle, 
  AlertTriangle,
  Eye,
  X,
  Info
} from 'lucide-react';
import { getCCRSection } from '../../data/mockData';

interface CCRReviewProps {
  request: Request;
  onClose: () => void;
  onConfirmCompliance: () => void;
}

const CCRReview: React.FC<CCRReviewProps> = ({ request, onClose, onConfirmCompliance }) => {
  const { currentUser } = useAuth();
  const { updateRequest, addNotification } = useDemoContext();
  
  const [confirmedSections, setConfirmedSections] = useState<string[]>([]);
  const [showSection, setShowSection] = useState<string | null>(null);

  // Get relevant CC&R sections based on request type
  const getRelevantCCRs = (request: Request): CCRSection[] => {
    const sections: CCRSection[] = [];
    
    // Always include architectural modifications
    const archMod = getCCRSection('ccr-4-1');
    if (archMod) sections.push(archMod);
    
    // Include specific sections based on request type
    if (request.type === 'exterior_modification') {
      const colorGuidelines = getCCRSection('ccr-4-2');
      if (colorGuidelines) sections.push(colorGuidelines);
    }
    
    // Always include neighbor notification
    const neighborNotif = getCCRSection('ccr-3-1');
    if (neighborNotif) sections.push(neighborNotif);
    
    return sections.filter(Boolean);
  };

  const relevantCCRs = getRelevantCCRs(request);

  const handleSectionConfirmation = (sectionId: string, confirmed: boolean) => {
    if (confirmed) {
      setConfirmedSections(prev => [...prev.filter(id => id !== sectionId), sectionId]);
    } else {
      setConfirmedSections(prev => prev.filter(id => id !== sectionId));
    }
  };

  const handleSubmitCompliance = () => {
    if (confirmedSections.length !== relevantCCRs.length) {
      alert('Please confirm compliance with all relevant CC&R sections before proceeding.');
      return;
    }

    // Update request with CC&R compliance confirmation
    const updatedRequest = {
      ...request,
      ccrsReviewed: true,
      ccrsConfirmedSections: confirmedSections,
      timeline: [...request.timeline, {
        id: `timeline-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'reviewed' as const,
        userId: currentUser?.id || '',
        userName: currentUser?.name || '',
        description: 'Homeowner confirmed CC&R compliance for all relevant sections'
      }]
    };

    updateRequest(updatedRequest);
    addNotification(`✅ CC&R compliance confirmed for "${request.title}"`);
    onConfirmCompliance();
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative mx-auto my-4 p-6 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">CC&R Compliance Review</h2>
            <p className="text-gray-600 mt-1">Review and confirm compliance with relevant CC&R sections</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Request Summary */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-3">
            <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-900">{request.title}</h3>
              <p className="text-sm text-blue-700 mt-1">{request.description}</p>
              <div className="text-xs text-blue-600 mt-2">
                Request Type: {request.type} • Priority: {request.priority}
              </div>
            </div>
          </div>
        </div>

        {/* CC&R Sections Review */}
        <div className="space-y-4 mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            Relevant CC&R Sections for Your Request
          </h3>
          <p className="text-gray-600">
            Please review each section and confirm that your request complies with the requirements.
          </p>

          {relevantCCRs.map((ccr) => (
            <div key={ccr.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h4 className="font-medium text-gray-900">
                      Section {ccr.section}: {ccr.title}
                    </h4>
                    <button
                      onClick={() => setShowSection(showSection === ccr.id ? null : ccr.id)}
                      className="text-primary-600 hover:text-primary-700"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {showSection === ccr.id && (
                    <div className="bg-gray-50 border border-gray-200 rounded p-3 mb-3">
                      <p className="text-sm text-gray-700">{ccr.content}</p>
                    </div>
                  )}

                  <div className="flex items-center space-x-3">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={confirmedSections.includes(ccr.id)}
                        onChange={(e) => handleSectionConfirmation(ccr.id, e.target.checked)}
                        className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                      />
                      <span className="text-sm text-gray-700">
                        I confirm my request complies with this section
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Compliance Status */}
        <div className={`rounded-lg p-4 mb-6 ${
          confirmedSections.length === relevantCCRs.length 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-yellow-50 border border-yellow-200'
        }`}>
          <div className="flex items-center space-x-2">
            {confirmedSections.length === relevantCCRs.length ? (
              <>
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-green-800">
                  All CC&R compliance confirmed ({confirmedSections.length}/{relevantCCRs.length})
                </span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-800">
                  Please confirm compliance with all sections ({confirmedSections.length}/{relevantCCRs.length})
                </span>
              </>
            )}
          </div>
        </div>

        {/* Important Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-blue-800">What happens next?</h4>
              <p className="text-sm text-blue-700 mt-1">
                After confirming CC&R compliance, your request will proceed to the neighbor approval phase. 
                Adjacent neighbors will be notified and asked to approve your request before it goes to the Board of Directors.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between">
          <button
            onClick={onClose}
            className="btn-secondary"
          >
            Review Later
          </button>
          <button
            onClick={handleSubmitCompliance}
            disabled={confirmedSections.length !== relevantCCRs.length}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Confirm Compliance & Continue</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CCRReview;
