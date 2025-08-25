import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useDemoContext } from '../../contexts/DemoContext';
import { Request } from '../../types';
import AppealRequest from './AppealRequest';
import RequestDetails from './RequestDetails';
import HomeownerRequestDashboard from './HomeownerRequestDashboard';
import CCRReview from './CCRReview';
import { 
  Clock, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  Eye,
  Trash2,
  FileText,
  Users,
  Vote
} from 'lucide-react';

interface RequestTrackingProps {
  onClose?: () => void;
  onSubmitNewRequest?: () => void;
}

const RequestTracking: React.FC<RequestTrackingProps> = ({ onClose, onSubmitNewRequest }) => {
  const { currentUser } = useAuth();
  const { requests, updateRequest, addNotification, setRequestsDirectly } = useDemoContext();
  
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState<string | null>(null);
  const [showAppealModal, setShowAppealModal] = useState<Request | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState<Request | null>(null);
  const [showCCRReview, setShowCCRReview] = useState<Request | null>(null);

  const userRequests = requests.filter(r => r.homeownerId === currentUser?.id);

  const canDeleteRequest = (request: Request) => {
    // Can delete if status is 'submitted' and no management review has started
    return request.status === 'submitted' && !request.managementReview;
  };

  const canCancelRequest = (request: Request) => {
    // Can cancel if management review has begun but not yet approved/rejected
    return (request.status !== 'submitted' && 
            request.status !== 'approved' && 
            request.status !== 'rejected' && 
            request.status !== 'cancelled');
  };

  const handleDeleteRequest = (requestId: string) => {
    const requestToDelete = requests.find(r => r.id === requestId);
    if (!requestToDelete) return;

    // Remove from requests list completely
    const updatedRequests = requests.filter(r => r.id !== requestId);
    
    // Update the DemoContext directly (this will also update localStorage)
    setRequestsDirectly(updatedRequests);
    
    addNotification(`Request deleted: ${requestToDelete.title}`);
    setShowDeleteModal(null);
    
    alert(`Request "${requestToDelete.title}" has been deleted. You can submit a new request anytime.`);
  };

  const handleCancelRequest = (requestId: string) => {
    const requestToCancel = requests.find(r => r.id === requestId);
    if (!requestToCancel) return;

    // Update request status to cancelled and add timeline entry
    const cancelledRequest = {
      ...requestToCancel,
      status: 'cancelled' as const,
      timeline: [...requestToCancel.timeline, {
        id: `timeline-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'comment' as const,
        userId: currentUser?.id || '',
        userName: currentUser?.name || '',
        description: 'Request cancelled by homeowner - management notified'
      }]
    };

    // Update the request in the system
    updateRequest(cancelledRequest);

    // Notify HOA Management
    addNotification(`🚨 Request Cancelled: ${requestToCancel.title} by ${currentUser?.name}. Request removed from pending queue.`);

    // Add management notification timeline entry
    const notificationEntry = {
      id: `timeline-${Date.now() + 1}`,
      timestamp: new Date().toISOString(),
      type: 'system' as const,
      userId: 'system',
      userName: 'System',
      description: 'HOA Management (Allan Chua) notified of cancellation'
    };

    const finalRequest = {
      ...cancelledRequest,
      timeline: [...cancelledRequest.timeline, notificationEntry]
    };

    updateRequest(finalRequest);

    setShowCancelModal(null);
    
    alert(`Request "${requestToCancel.title}" has been cancelled. Your HOA management company has been notified and the request has been removed from the pending queue.`);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'submitted':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'cc_r_review':
      case 'neighbor_approval':
        return <Users className="w-5 h-5 text-blue-500" />;
      case 'board_review':
        return <Vote className="w-5 h-5 text-purple-500" />;
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'appeal_requested':
        return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      case 'appeal_review':
        return <Vote className="w-5 h-5 text-orange-500" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-gray-500" />;
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
      case 'cancelled':
        return 'Cancelled by Homeowner';
      case 'appeal_requested':
        return 'Appeal Submitted - Awaiting Board Review';
      case 'appeal_review':
        return 'Appeal Under Board Review';
      default:
        return status.replace('_', ' ').toUpperCase();
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white min-h-[70vh]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">My Requests</h2>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XCircle className="w-6 h-6" />
            </button>
          )}
        </div>

        {userRequests.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Requests Yet</h3>
            <p className="text-gray-500 mb-4">You haven't submitted any requests. Ready to get started?</p>
            <button
              onClick={() => {
                if (onClose) onClose();
                if (onSubmitNewRequest) onSubmitNewRequest();
              }}
              className="btn-primary"
            >
              Submit Your First Request
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {userRequests.map((request) => (
              <div key={request.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="flex-shrink-0">
                      {getStatusIcon(request.status)}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{request.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{request.description}</p>
                      
                      <div className="flex items-center space-x-4 mt-3">
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
                        <span className="text-xs text-gray-500">
                          Submitted {new Date(request.submittedAt).toLocaleDateString()}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          request.priority === 'high' ? 'bg-red-100 text-red-800' :
                          request.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {request.priority.toUpperCase()} PRIORITY
                        </span>
                      </div>

                      {/* Photos */}
                      {request.photos && request.photos.length > 0 && (
                        <div className="mt-3">
                          <div className="flex space-x-2">
                            {request.photos.slice(0, 3).map((photo) => (
                              <img
                                key={photo.id}
                                src={photo.url}
                                alt={photo.caption}
                                className="w-12 h-12 object-cover rounded border"
                              />
                            ))}
                            {request.photos.length > 3 && (
                              <div className="w-12 h-12 bg-gray-100 rounded border flex items-center justify-center text-xs text-gray-500">
                                +{request.photos.length - 3}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Progress Timeline */}
                      <div className="mt-4">
                        <div className="flex items-center space-x-2">
                          {request.workflowSteps?.map((step, index) => (
                            <React.Fragment key={step.id}>
                              <div className={`w-3 h-3 rounded-full ${
                                step.status === 'completed' ? 'bg-green-500' :
                                step.status === 'in_progress' ? 'bg-blue-500' :
                                'bg-gray-300'
                              }`} />
                              {index < (request.workflowSteps?.length || 0) - 1 && (
                                <div className={`w-8 h-0.5 ${
                                  step.status === 'completed' ? 'bg-green-500' : 'bg-gray-300'
                                }`} />
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Step {(request.workflowSteps?.findIndex(s => s.status !== 'completed') || 0) + 1} of {request.workflowSteps?.length || 0}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <button 
                      onClick={() => setShowDetailsModal(request)}
                      className="text-primary-600 hover:text-primary-800 text-sm flex items-center space-x-1"
                    >
                      <Eye className="w-4 h-4" />
                      <span>View Details</span>
                    </button>
                    
                    {canDeleteRequest(request) && (
                      <button
                        onClick={() => setShowDeleteModal(request.id)}
                        className="text-red-600 hover:text-red-800 text-sm flex items-center space-x-1"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Delete</span>
                      </button>
                    )}

                    {(request.status === 'cc_r_review' || request.status === 'submitted') && !request.ccrsReviewed && (
                      <button
                        onClick={() => setShowCCRReview(request)}
                        className="text-blue-600 hover:text-blue-800 text-sm flex items-center space-x-1"
                      >
                        <FileText className="w-4 h-4" />
                        <span>Review CC&Rs</span>
                      </button>
                    )}

                    {request.status === 'rejected' && (
                      <button
                        onClick={() => setShowAppealModal(request)}
                        className="text-orange-600 hover:text-orange-800 text-sm flex items-center space-x-1"
                      >
                        <AlertTriangle className="w-4 h-4" />
                        <span>Appeal</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Delete Warning for Non-Deletable Requests */}
                {!canDeleteRequest(request) && request.status !== 'approved' && request.status !== 'rejected' && request.status !== 'cancelled' && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm text-yellow-800">
                          This request cannot be deleted because management review has begun. 
                          Contact your HOA management company if you need to make changes, or{' '}
                          <button
                            onClick={() => setShowCancelModal(request.id)}
                            className="text-red-700 underline hover:text-red-900 font-medium"
                          >
                            Cancel this request
                          </button>
                          .
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Cancel Confirmation Modal */}
        {showCancelModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-60">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Cancel Request</h3>
              
              <div className="space-y-4">
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
                    <div>
                      <p className="text-sm text-orange-800 font-medium">
                        Cancel this request?
                      </p>
                      <p className="text-sm text-orange-700 mt-1">
                        This will notify your HOA management company that you want to cancel this request. 
                        The request will be removed from the pending queue and marked as cancelled.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <p className="text-sm text-gray-800">
                    <strong>Request:</strong> {requests.find(r => r.id === showCancelModal)?.title}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    Status: {requests.find(r => r.id === showCancelModal)?.status?.replace('_', ' ').toUpperCase()}
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs text-blue-800">
                    <strong>What happens next:</strong>
                  </p>
                  <ul className="text-xs text-blue-700 mt-1 space-y-1">
                    <li>• HOA management receives immediate notification</li>
                    <li>• Request removed from management pending queue</li>
                    <li>• Transaction logged for audit trail</li>
                    <li>• You can submit a new request anytime</li>
                  </ul>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowCancelModal(null)}
                    className="btn-secondary"
                  >
                    Keep Request
                  </button>
                  <button
                    onClick={() => handleCancelRequest(showCancelModal)}
                    className="btn-danger"
                  >
                    Cancel Request
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-60">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Delete Request</h3>
              
              <div className="space-y-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                    <div>
                      <p className="text-sm text-red-800 font-medium">
                        Are you sure you want to delete this request?
                      </p>
                      <p className="text-sm text-red-700 mt-1">
                        This action cannot be undone. You can submit a new request anytime.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <p className="text-sm text-gray-800">
                    <strong>Request:</strong> {requests.find(r => r.id === showDeleteModal)?.title}
                  </p>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowDeleteModal(null)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDeleteRequest(showDeleteModal)}
                    className="btn-danger"
                  >
                    Delete Request
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Appeal Request Modal */}
        {showAppealModal && (
          <AppealRequest
            request={showAppealModal}
            onClose={() => setShowAppealModal(null)}
            onAppealSubmitted={(updatedRequest) => {
              setShowAppealModal(null);
              // The request is already updated via DemoContext
            }}
          />
        )}

        {/* Request Details Modal */}
        {showDetailsModal && (
          <HomeownerRequestDashboard
            request={showDetailsModal}
            onClose={() => setShowDetailsModal(null)}
          />
        )}

        {/* CC&R Review Modal */}
        {showCCRReview && (
          <CCRReview
            request={showCCRReview}
            onClose={() => setShowCCRReview(null)}
            onConfirmCompliance={() => {
              setShowCCRReview(null);
              addNotification(`✅ CC&R compliance confirmed for "${showCCRReview.title}"`);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default RequestTracking;
