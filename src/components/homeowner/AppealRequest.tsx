import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useDemoContext } from '../../contexts/DemoContext';
import { Request } from '../../types';
import { 
  AlertTriangle, 
  FileText, 
  MessageSquare,
  XCircle,
  Scale,
  Clock
} from 'lucide-react';

interface AppealRequestProps {
  request: Request;
  onClose?: () => void;
  onAppealSubmitted?: (request: Request) => void;
}

const AppealRequest: React.FC<AppealRequestProps> = ({ request, onClose, onAppealSubmitted }) => {
  const { currentUser } = useAuth();
  const { updateRequest, addNotification } = useDemoContext();
  
  const [appealReason, setAppealReason] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitAppeal = async () => {
    if (!appealReason.trim() || !currentUser) return;
    
    setIsSubmitting(true);
    
    try {
      const updatedRequest = {
        ...request,
        status: 'appeal_requested' as const,
        appealData: {
          reason: appealReason,
          additionalInfo: additionalInfo,
          submittedAt: new Date().toISOString(),
          submittedBy: currentUser.id
        },
        timeline: [...request.timeline, {
          id: `timeline-${Date.now()}`,
          timestamp: new Date().toISOString(),
          type: 'comment' as const,
          userId: currentUser.id,
          userName: currentUser.name,
          description: `Appeal request submitted: ${appealReason.substring(0, 100)}${appealReason.length > 100 ? '...' : ''}`
        }]
      };

      updateRequest(updatedRequest);
      addNotification(`📋 Appeal submitted for: ${request.title}`);
      
      alert('Appeal submitted successfully!\n\nYour appeal will be reviewed by the Board of Directors. You will receive notification when the board schedules your appeal hearing.\n\nThe board will reconsider your request based on the additional information provided.');
      
      onAppealSubmitted?.(updatedRequest);
      onClose?.();
      
    } catch (error) {
      console.error('Error submitting appeal:', error);
      alert('Error submitting appeal. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get rejection details from board votes
  const rejectionDetails = () => {
    const votes = request.boardVotes || [];
    const rejectVotes = votes.filter(v => v.vote === 'reject');
    const rejectComments = rejectVotes.map(v => v.comments).filter(c => c).join('; ');
    return rejectComments || 'No specific comments provided with rejection.';
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-11/12 max-w-3xl shadow-lg rounded-md bg-white min-h-[70vh]">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-3">
            <Scale className="w-6 h-6 text-orange-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">Request Appeal</h2>
              <p className="text-gray-600">Submit an appeal for board reconsideration</p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XCircle className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* Rejection Summary */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-red-900">Request Rejected by Board of Directors</h3>
              <p className="text-sm text-red-700 mt-1">
                <strong>Request:</strong> {request.title}
              </p>
              <p className="text-sm text-red-700 mt-1">
                <strong>Rejection Date:</strong> {request.completedAt ? new Date(request.completedAt).toLocaleDateString() : 'Recent'}
              </p>
              <div className="mt-3 p-3 bg-white border border-red-200 rounded">
                <p className="text-sm text-gray-800">
                  <strong>Board Comments:</strong> {rejectionDetails()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Appeal Form */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Submit Your Appeal</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Appeal <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={appealReason}
                  onChange={(e) => setAppealReason(e.target.value)}
                  placeholder="Please explain why you believe the board's decision should be reconsidered..."
                  className="input-field h-24 resize-none"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Clearly state your grounds for appeal and any new information since the original decision.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Information (Optional)
                </label>
                <textarea
                  value={additionalInfo}
                  onChange={(e) => setAdditionalInfo(e.target.value)}
                  placeholder="Any additional details, clarifications, or new information that supports your appeal..."
                  className="input-field h-20 resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Include any new information, clarifications, or changes to your original request.
                </p>
              </div>
            </div>
          </div>

          {/* Appeal Process Information */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Appeal Process</h4>
            <div className="text-sm text-blue-700 space-y-1">
              <p>• Your appeal will be reviewed by the Board of Directors</p>
              <p>• The board may schedule a hearing for your appeal</p>
              <p>• You will be notified of the board's decision on your appeal</p>
              <p>• Appeals are typically reviewed within 30 days</p>
            </div>
          </div>

          {/* Legal Notice */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Important Notice</h4>
            <p className="text-sm text-gray-700">
              By submitting this appeal, you acknowledge that you have read and understand the community's 
              CC&Rs regarding the architectural review and appeal process. This appeal will be considered 
              by the Board of Directors in accordance with the governing documents.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmitAppeal}
            disabled={!appealReason.trim() || isSubmitting}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Clock className="w-4 h-4 mr-2 animate-spin" />
                Submitting Appeal...
              </>
            ) : (
              <>
                <Scale className="w-4 h-4 mr-2" />
                Submit Appeal
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AppealRequest;








