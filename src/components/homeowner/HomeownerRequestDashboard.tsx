import React, { useState } from 'react';
import { Request, RequestStatus, TimelineEvent } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useDemoContext } from '../../contexts/DemoContext';
import { 
  X, 
  FileText, 
  Users, 
  MessageSquare,
  CheckCircle,
  ExternalLink,
  History,
  Home,
  Eye,
  EyeOff,
  Send,
  AlertTriangle,
  BookOpen,
  FormInput,
  Upload
} from 'lucide-react';

interface HomeownerRequestDashboardProps {
  request: Request;
  onClose: () => void;
}

const HomeownerRequestDashboard: React.FC<HomeownerRequestDashboardProps> = ({ request, onClose }) => {
  const { currentUser } = useAuth();
  const { updateRequest } = useDemoContext();
  const [activeTab, setActiveTab] = useState<'application-details' | 'property' | 'governing-docs' | 'forms' | 'neighbors' | 'activity' | 'reply'>('application-details');
  const [replyMessage, setReplyMessage] = useState('');

  // Status display helper (matches HOA Manager's version)
  const getStatusDisplay = (status: RequestStatus) => {
    const statusMap: Record<string, { label: string; color: string; icon: string }> = {
      'draft': { label: 'Draft', color: 'bg-gray-100 text-gray-800', icon: '📄' },
      'submitted': { label: 'Submitted', color: 'bg-blue-100 text-blue-800', icon: '📝' },
      'under_review': { label: 'Under Review', color: 'bg-yellow-100 text-yellow-800', icon: '🔍' },
      'homeowner_reply_needed': { label: 'Reply Needed', color: 'bg-orange-100 text-orange-800', icon: '💬' },
      'disapproved_arc': { label: 'Disapproved (ARC)', color: 'bg-red-100 text-red-800', icon: '❌' },
      'board_voting': { label: 'Board Voting', color: 'bg-purple-100 text-purple-800', icon: '🗳️' },
      'disapproved_board': { label: 'Disapproved (Board)', color: 'bg-red-100 text-red-800', icon: '❌' },
      'appeal': { label: 'Appeal', color: 'bg-indigo-100 text-indigo-800', icon: '⚖️' },
      'in_progress': { label: 'In Progress', color: 'bg-green-100 text-green-800', icon: '🚧' },
      'pending_inspection': { label: 'Pending Inspection', color: 'bg-amber-100 text-amber-800', icon: '🔍' },
      'correction_needed': { label: 'Correction Needed', color: 'bg-orange-100 text-orange-800', icon: '🔧' },
      'completed': { label: 'Completed', color: 'bg-green-100 text-green-800', icon: '✅' },
      // Legacy statuses
      'cc_r_review': { label: 'Under Review', color: 'bg-yellow-100 text-yellow-800', icon: '🔍' },
      'neighbor_approval': { label: 'Board Voting', color: 'bg-purple-100 text-purple-800', icon: '🗳️' },
      'board_review': { label: 'Board Voting', color: 'bg-purple-100 text-purple-800', icon: '🗳️' },
      'approved': { label: 'In Progress', color: 'bg-green-100 text-green-800', icon: '🚧' },
      'rejected': { label: 'Disapproved (ARC)', color: 'bg-red-100 text-red-800', icon: '❌' },
      'appeal_requested': { label: 'Appeal', color: 'bg-indigo-100 text-indigo-800', icon: '⚖️' },
      'appeal_review': { label: 'Appeal', color: 'bg-indigo-100 text-indigo-800', icon: '⚖️' },
      'cancelled': { label: 'Cancelled', color: 'bg-gray-100 text-gray-800', icon: '🚫' }
    };
    
    return statusMap[status] || statusMap['submitted'];
  };

  const statusDisplay = getStatusDisplay(request.status);
  const needsReply = request.status === 'homeowner_reply_needed';
  const isNewSubmission = request.status === 'submitted' || request.status === 'cc_r_review';
  const showLastUpdated = !isNewSubmission;

  // Get last action details
  const getLastActionDetails = () => {
    if (isNewSubmission) return null;
    
    // In a real app, this would come from the activity log
    // For now, we'll simulate based on status
    switch (request.status) {
      case 'under_review':
        return { name: 'Allan Chua', title: 'HOA Manager', action: 'started review' };
      case 'homeowner_reply_needed':
        return { name: 'Allan Chua', title: 'HOA Manager', action: 'requested more information' };
      case 'board_voting':
        return { name: 'Allan Chua', title: 'HOA Manager', action: 'approved and sent to board' };
      default:
        return { name: 'Allan Chua', title: 'HOA Manager', action: 'updated request' };
    }
  };

  const lastAction = getLastActionDetails();

  // Data from HOA Manager selections (actual data from the request)
  const attachedGoverningDocs = (request as any).governingDocsReferences || [];
  const requiredForms = (request as any).requiredForms || [];
  const requiredNeighbors = request.neighborApprovals || [];

  // Mock governing docs data for display (this would come from a docs database in real app)
  const governingDocsDatabase = {
    'ccr-4-2': { 
      id: 'ccr-4-2', 
      title: 'CC&R Section 4.2 - Exterior Modifications', 
      description: 'All exterior modifications, including painting, must be approved by the ARC before commencement.' 
    },
    'ccr-4-1': { 
      id: 'ccr-4-1', 
      title: 'CC&R Section 4.1 - General Property Standards', 
      description: 'All properties must maintain standards consistent with community guidelines.' 
    }
  };

  // Mock forms data for display (this would come from a forms database in real app)
  const formsDatabase = {
    'neighbor-notification': { 
      id: 'neighbor-notification', 
      title: 'Neighbor Notification Form', 
      description: 'Required to notify adjacent neighbors of the project', 
      status: 'pending' 
    },
    'contractor-info': { 
      id: 'contractor-info', 
      title: 'Contractor Information Form', 
      description: 'Required contractor details and insurance information', 
      status: 'pending' 
    },
    'timeline-schedule': { 
      id: 'timeline-schedule', 
      title: 'Project Timeline & Schedule', 
      description: 'Detailed project timeline and completion schedule', 
      status: 'pending' 
    }
  };

  // Get actual governing docs selected by HOA Manager, or show default for demo
  const displayGoverningDocs = attachedGoverningDocs.length > 0 
    ? attachedGoverningDocs.map((docId: string) => 
        governingDocsDatabase[docId as keyof typeof governingDocsDatabase]
      ).filter(Boolean)
    : []; // Show empty if no docs selected yet

  // Get actual forms selected by HOA Manager, or show default for demo
  const displayForms = requiredForms.length > 0 
    ? requiredForms.map((formId: string) => 
        formsDatabase[formId as keyof typeof formsDatabase]
      ).filter(Boolean)
    : []; // Show empty if no forms selected yet

  // Convert timeline events to activity log format
  const activityLog = request.timeline.map((event: TimelineEvent) => ({
    id: event.id,
    timestamp: event.timestamp,
    type: event.type,
    actor: event.userName,
    action: event.description,
    details: event.metadata?.details || '',
    isPublic: event.type !== 'system' && event.metadata?.isPublic !== false,
    requiresAction: event.type === 'management' && event.description.includes('requested additional information')
  }));

  const handleReplySubmit = () => {
    if (!replyMessage.trim()) return;

    // Create timeline event for homeowner reply
    const replyEvent: TimelineEvent = {
      id: `timeline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      userId: currentUser?.id || 'homeowner',
      userName: currentUser?.name || 'Homeowner',
      type: 'comment',
      description: 'Provided additional information',
      metadata: {
        details: replyMessage,
        isPublic: true
      }
    };

    const updatedRequest = {
      ...request,
      status: 'under_review' as RequestStatus,
      updatedAt: new Date().toISOString(),
      timeline: [...request.timeline, replyEvent]
    };

    updateRequest(updatedRequest);
    setReplyMessage('');
    setActiveTab('activity');
  };

  const openGoogleMaps = (address: string) => {
    const encodedAddress = encodeURIComponent(address);
    window.open(`https://www.google.com/maps/search/${encodedAddress}`, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-start p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">ARC Application: {request.type === 'exterior_modification' ? 'Exterior Modification' : request.type === 'landscaping' ? 'Landscaping' : 'Home Improvement'}</h2>
            <p className="text-gray-600">ARC-2024-001 - Submitted on {new Date(request.submittedAt).toLocaleDateString()}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Status and Last Updated */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-lg">{statusDisplay.icon}</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusDisplay.color}`}>
                  {statusDisplay.label}
                </span>
              </div>
              {showLastUpdated && lastAction && (
                <div className="text-sm text-gray-600">
                  Last updated by {lastAction.name} ({lastAction.title}) • {lastAction.action}
                </div>
              )}
            </div>
            <div className="text-sm text-gray-600">
              Submitted: {new Date(request.submittedAt).toLocaleDateString()}
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('application-details')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'application-details'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FileText className="w-4 h-4 inline mr-2" />
              Application Details
            </button>
            <button
              onClick={() => setActiveTab('property')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'property'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Home className="w-4 h-4 inline mr-2" />
              Property
            </button>
            <button
              onClick={() => setActiveTab('governing-docs')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'governing-docs'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <BookOpen className="w-4 h-4 inline mr-2" />
              Governing Docs
            </button>
            <button
              onClick={() => setActiveTab('forms')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'forms'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FormInput className="w-4 h-4 inline mr-2" />
              Forms
            </button>
            <button
              onClick={() => setActiveTab('neighbors')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'neighbors'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              Neighbors
            </button>
            <button
              onClick={() => setActiveTab('activity')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'activity'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <History className="w-4 h-4 inline mr-2" />
              Activity Log
            </button>
            {needsReply && (
              <button
                onClick={() => setActiveTab('reply')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'reply'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-orange-500 hover:text-orange-700 hover:border-orange-300'
                }`}
              >
                <MessageSquare className="w-4 h-4 inline mr-2" />
                Reply Required
                <AlertTriangle className="w-4 h-4 inline ml-1 text-orange-500" />
              </button>
            )}
          </nav>
        </div>

        {/* Tab Content - Fixed Height */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full p-6 overflow-y-auto" style={{ minHeight: '500px' }}>
            {/* Application Details Tab */}
            {activeTab === 'application-details' && (
              <div className="bg-white rounded-lg border border-gray-200 p-6" style={{ minHeight: '400px' }}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{request.title}</h3>
                    <p className="text-gray-600">Submitted by {currentUser?.name || 'Unknown'} • {new Date(request.submittedAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex space-x-2">
                    <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">MEDIUM PRIORITY</span>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Description:</h4>
                    <p className="text-gray-700">{request.description || 'No description provided'}</p>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Included Attachments:</h4>
                    <p className="text-gray-500 italic">No attachments were included with this request.</p>
                  </div>

                  {/* ARC Application Form Section - matches HOA Manager's layout */}
                  <div className="border-t border-gray-200 pt-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gray-50">
                        <div className="flex items-center space-x-3">
                          <FileText className="w-5 h-5 text-gray-400" />
                          <div>
                            <h4 className="font-medium text-gray-900">ARC Application Form</h4>
                            <p className="text-sm text-gray-600">Official form will be available after board approval</p>
                          </div>
                        </div>
                        <span className="bg-gray-200 text-gray-600 px-3 py-1 rounded text-sm">Not Available</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Property Tab */}
            {activeTab === 'property' && (
              <div className="bg-white rounded-lg border border-gray-200 p-6" style={{ minHeight: '400px' }}>
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Property Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Property Details */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Property Address</label>
                      <div className="flex items-center space-x-2">
                        <p className="text-gray-900">123 Oak Street</p>
                        <button
                          onClick={() => openGoogleMaps('123 Oak Street, Rancho Madrina')}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-gray-600">Rancho Madrina, CA 92688</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Lot Size</label>
                      <p className="text-gray-900">0.25 acres (10,890 sq ft)</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Year Built</label>
                      <p className="text-gray-900">1995</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Property Type</label>
                      <p className="text-gray-900">Single Family Residence</p>
                    </div>
                  </div>

                  {/* Homeowner Details */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Primary Owner</label>
                      <p className="text-gray-900">{currentUser?.name || 'Jason Abustan'}</p>
                      <p className="text-gray-600">{currentUser?.contactInfo?.email || 'jason.abustan@email.com'}</p>
                      <p className="text-gray-600">{currentUser?.contactInfo?.phone || '(555) 123-4567'}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ownership Since</label>
                      <p className="text-gray-900">March 2018</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">HOA Community</label>
                      <p className="text-gray-900">Rancho Madrina</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Governing Docs Tab */}
            {activeTab === 'governing-docs' && (
              <div className="space-y-4" style={{ minHeight: '400px' }}>
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900">Applicable Governing Documents</h3>
                  <p className="text-sm text-gray-600">Documents selected by HOA Management as applicable to your request</p>
                </div>
                
                {displayGoverningDocs.length > 0 ? (
                  displayGoverningDocs.map((doc: any) => (
                    <div key={doc.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <BookOpen className="w-4 h-4 text-blue-500" />
                            <h4 className="font-medium text-gray-900">{doc.title}</h4>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">
                            {doc.description}
                          </p>
                          <button className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center space-x-1">
                            <ExternalLink className="w-3 h-3" />
                            <span>View Full Section</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No governing documents have been attached to this application yet.</p>
                  </div>
                )}
              </div>
            )}

            {/* Forms Tab */}
            {activeTab === 'forms' && (
              <div className="space-y-4" style={{ minHeight: '400px' }}>
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900">Required Forms</h3>
                  <p className="text-sm text-gray-600">Forms selected by HOA Management as required for your application</p>
                </div>
                
                {displayForms.length > 0 ? (
                  <div className="space-y-4">
                    {displayForms.map((form: any, index: number) => (
                      <div key={form.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-gray-900">{form.title}</h4>
                            <p className="text-sm text-gray-600">{form.description}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`text-sm font-medium ${
                              form.status === 'completed' ? 'text-green-600' : 
                              form.status === 'in_progress' ? 'text-blue-600' : 
                              'text-orange-600'
                            }`}>
                              {form.status === 'completed' ? 'Completed' : 
                               form.status === 'in_progress' ? 'In Progress' : 
                               'Pending Completion'}
                            </span>
                            {form.status !== 'completed' && (
                              <button className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">
                                Complete Form
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FormInput className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No additional forms are required for this application.</p>
                  </div>
                )}
              </div>
            )}

            {/* Neighbors Tab */}
            {activeTab === 'neighbors' && (
              <div className="space-y-4" style={{ minHeight: '400px' }}>
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900">Required Neighbor Approvals</h3>
                  <p className="text-sm text-gray-600">Neighbors selected by HOA Management for approval</p>
                </div>
                
                {requiredNeighbors.length > 0 ? (
                  <div className="space-y-4">
                    {requiredNeighbors.map((neighbor: any, index: number) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-gray-900">{`Neighbor ${index + 1}`}</h4>
                            <div className="flex items-center space-x-2 mb-1">
                              <p className="text-sm text-gray-600">{neighbor.neighborAddress}</p>
                              <button
                                onClick={() => openGoogleMaps(neighbor.neighborAddress)}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </button>
                            </div>
                            <p className="text-xs text-gray-500">{neighbor.position}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            {neighbor.status === 'approved' ? (
                              <span className="flex items-center text-green-600">
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Approved
                              </span>
                            ) : (
                              <span className="flex items-center text-yellow-600">
                                <AlertTriangle className="w-4 h-4 mr-1" />
                                Pending
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No neighbor approvals are required for this application.</p>
                  </div>
                )}
              </div>
            )}

            {/* Activity Log Tab */}
            {activeTab === 'activity' && (
              <div className="space-y-4" style={{ minHeight: '400px' }}>
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900">Activity Log</h3>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Eye className="w-4 h-4" />
                    <span>Public</span>
                    <EyeOff className="w-4 h-4 ml-2" />
                    <span>Internal</span>
                  </div>
                </div>
                
                <div className="space-y-4">
                  {activityLog.map((activity) => (
                    <div key={activity.id} className={`border-l-4 pl-4 py-3 ${
                      activity.requiresAction ? 'border-orange-400 bg-orange-50' : 
                      activity.type === 'submitted' ? 'border-blue-400' :
                      activity.type === 'management' ? 'border-yellow-400' :
                      activity.type === 'system' ? 'border-gray-400' :
                      activity.type === 'approved' ? 'border-green-400' :
                      activity.type === 'rejected' ? 'border-red-400' :
                      'border-gray-400'
                    }`}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <div className={`w-3 h-3 rounded-full ${
                            activity.type === 'submitted' ? 'bg-blue-500' :
                            activity.type === 'management' ? 'bg-yellow-500' :
                            activity.type === 'system' ? 'bg-gray-400' :
                            activity.type === 'approved' ? 'bg-green-500' :
                            activity.type === 'rejected' ? 'bg-red-500' :
                            'bg-gray-500'
                          }`} />
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-gray-900">{activity.actor}</span>
                              <span className="text-gray-600">{activity.action}</span>
                              {!activity.isPublic && (
                                <span className="text-gray-600">
                                  <EyeOff className="w-4 h-4 text-gray-400" />
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mb-1">{activity.details}</p>
                            <p className="text-xs text-gray-500">{new Date(activity.timestamp).toLocaleString()}</p>
                            
                            {activity.requiresAction && (
                              <div className="mt-2 p-2 bg-orange-100 border border-orange-200 rounded">
                                <p className="text-sm font-medium text-orange-800">Action Required</p>
                                <button
                                  onClick={() => setActiveTab('reply')}
                                  className="text-sm text-orange-600 hover:text-orange-800 underline"
                                >
                                  Click here to provide additional information
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(activity.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reply Tab */}
            {activeTab === 'reply' && needsReply && (
              <div className="space-y-6" style={{ minHeight: '400px' }}>
                <h3 className="text-lg font-semibold text-gray-900">Provide Additional Information</h3>
                
                {(request as any).requestInfoMessage && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Management Request:</h4>
                    <p className="text-blue-800">{(request as any).requestInfoMessage}</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Your Response</label>
                  <textarea
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    rows={6}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Please provide the requested information..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Additional Documents</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Click to upload additional documents</p>
                    <input type="file" multiple className="hidden" />
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setActiveTab('activity')}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReplySubmit}
                    disabled={!replyMessage.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>Send Reply</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeownerRequestDashboard;