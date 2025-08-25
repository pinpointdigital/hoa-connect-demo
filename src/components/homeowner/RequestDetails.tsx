import React from 'react';
import { Request } from '../../types';
import { 
  XCircle, 
  Clock, 
  CheckCircle, 
  Users, 
  Vote,
  FileText,
  MapPin,
  AlertTriangle
} from 'lucide-react';

interface RequestDetailsProps {
  request: Request;
  onClose: () => void;
}

const RequestDetails: React.FC<RequestDetailsProps> = ({ request, onClose }) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'submitted':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'cc_r_review':
      case 'neighbor_approval':
        return <Users className="w-5 h-5 text-blue-500" />;
      case 'board_review':
      case 'appeal_review':
        return <Vote className="w-5 h-5 text-purple-500" />;
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'appeal_requested':
        return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      default:
        return <FileText className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'Submitted - Awaiting Management Review';
      case 'cc_r_review':
        return 'Under Review - Application Analysis';
      case 'neighbor_approval':
        return 'Neighbor Approval Phase';
      case 'board_review':
        return 'Board Review - Voting in Progress';
      case 'approved':
        return 'Approved by Board';
      case 'rejected':
        return 'Rejected';
      case 'appeal_requested':
        return 'Appeal Submitted - Awaiting Board Review';
      case 'appeal_review':
        return 'Appeal Under Board Review';
      default:
        return status.replace('_', ' ').toUpperCase();
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-60">
      <div className="relative top-10 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white min-h-[80vh]">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Request Details</h2>
            <p className="text-gray-600">Complete information about your request</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Request Overview */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                {getStatusIcon(request.status)}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{request.title}</h3>
                  <p className="text-sm text-gray-500">
                    Submitted {new Date(request.submittedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <span className={`status-badge ${
                request.status === 'submitted' ? 'status-pending' :
                request.status === 'approved' ? 'status-approved' :
                request.status === 'rejected' ? 'status-rejected' :
                request.status === 'cancelled' ? 'status-cancelled' :
                request.status === 'appeal_requested' || request.status === 'appeal_review' ? 'bg-orange-100 text-orange-800' :
                'status-in-progress'
              }`}>
                {getStatusText(request.status)}
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-medium text-gray-700">Description:</h4>
                <p className="text-gray-600">{request.description}</p>
              </div>

              {request.lotNumber && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700">Lot Number:</h4>
                  <p className="text-gray-600">{request.lotNumber}</p>
                </div>
              )}

              {request.attachmentTypes && request.attachmentTypes.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700">Attachment Types:</h4>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {request.attachmentTypes.map(type => (
                      <span key={type} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {type.replace('_', ' ').toUpperCase()}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h4 className="text-sm font-medium text-gray-700">Priority:</h4>
                <span className={`status-badge ${
                  request.priority === 'high' ? 'bg-red-100 text-red-800' :
                  request.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {request.priority.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {/* Photos */}
          {request.photos && request.photos.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Submitted Photos</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {request.photos.map((photo) => (
                  <div key={photo.id} className="relative">
                    <img
                      src={photo.url}
                      alt={photo.caption}
                      className="w-full h-32 object-cover rounded-lg border"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-2 rounded-b-lg">
                      {photo.caption}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Workflow Progress */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Progress Timeline</h4>
            <div className="space-y-4">
              {request.timeline.map((event, index) => (
                <div key={event.id} className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-blue-600">{index + 1}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900">{event.userName}</p>
                      <span className="text-xs text-gray-500">
                        {new Date(event.timestamp).toLocaleDateString()} {new Date(event.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Appeal Information */}
          {request.appealData && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-orange-900 mb-3 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2" />
                Appeal Submitted
              </h4>
              <div className="space-y-2">
                <div>
                  <span className="text-sm font-medium text-orange-800">Submitted:</span>
                  <span className="text-sm text-orange-700 ml-2">
                    {new Date(request.appealData.submittedAt).toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <span className="text-sm font-medium text-orange-800">Reason:</span>
                  <p className="text-sm text-orange-700 mt-1">{request.appealData.reason}</p>
                </div>
                {request.appealData.additionalInfo && (
                  <div>
                    <span className="text-sm font-medium text-orange-800">Additional Information:</span>
                    <p className="text-sm text-orange-700 mt-1">{request.appealData.additionalInfo}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Close Button */}
        <div className="flex justify-end mt-6 pt-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="btn-primary"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default RequestDetails;
