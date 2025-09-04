import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useDemoContext } from '../../contexts/DemoContext';
import { Request } from '../../types';
import { 
  FileText, 
  ClipboardList, 
  Bell, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Plus,
  Eye,
  Calendar,
  DollarSign,
  Home,
  Users,
  MapPin,
  Phone,
  Mail,
  ExternalLink
} from 'lucide-react';
import RequestSubmission from './RequestSubmission';
import RequestTracking from './RequestTracking';
import FormCompletion from './FormCompletion';
import NotificationCenter from './NotificationCenter';

const HomeownerDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const { requests, notifications } = useDemoContext();
  const [showRequestSubmission, setShowRequestSubmission] = useState(false);
  const [showRequestTracking, setShowRequestTracking] = useState(false);
  const [showFormCompletion, setShowFormCompletion] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Filter requests for current user
  const myRequests = requests.filter(r => r.homeownerId === currentUser?.id);
  const pendingRequests = myRequests.filter(r => 
    ['submitted', 'under_review', 'homeowner_reply_needed', 'board_voting', 'cc_r_review', 'neighbor_approval', 'board_review'].includes(r.status)
  );
  const approvedRequests = myRequests.filter(r => ['approved', 'in_progress', 'completed'].includes(r.status));
  const recentRequests = myRequests.slice(0, 5);
  
  // Account alerts data
  const pendingForms = [
    { id: 1, title: 'Owner Notice Disclosure', dueDate: '2025-09-05', priority: 'high' },
  ];
  
  const hoaAnnouncements = [
    { id: 1, title: 'Pool Maintenance Schedule Update', date: '2025-08-20', priority: 'medium' },
    { id: 2, title: 'Community Meeting - September 15th', date: '2025-08-18', priority: 'high' },
  ];
  
  const actionRequiredRequests = myRequests.filter(r => r.status === 'homeowner_reply_needed');

  // Debug logging
  console.log('HomeownerDashboard Debug:', {
    currentUserId: currentUser?.id,
    totalRequests: requests.length,
    myRequests: myRequests.length,
    myRequestTitles: myRequests.map(r => ({ id: r.id, title: r.title, status: r.status }))
  });



  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return 'text-blue-600 bg-blue-100';
      case 'under_review': return 'text-yellow-600 bg-yellow-100';
      case 'homeowner_reply_needed': return 'text-orange-600 bg-orange-100';
      case 'board_voting': return 'text-purple-600 bg-purple-100';
      case 'cc_r_review': return 'text-yellow-600 bg-yellow-100';
      case 'neighbor_approval': return 'text-purple-600 bg-purple-100';
      case 'board_review': return 'text-orange-600 bg-orange-100';
      case 'approved': case 'in_progress': return 'text-green-600 bg-green-100';
      case 'completed': return 'text-green-700 bg-green-200';
      case 'rejected': case 'disapproved_arc': case 'disapproved_board': return 'text-red-600 bg-red-100';
      case 'cancelled': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'submitted': return 'Submitted';
      case 'under_review': return 'Under Review';
      case 'homeowner_reply_needed': return 'Reply Needed';
      case 'board_voting': return 'Board Voting';
      case 'cc_r_review': return 'Under Review';
      case 'neighbor_approval': return 'Neighbor Approval';
      case 'board_review': return 'Board Review';
      case 'approved': return 'Approved';
      case 'in_progress': return 'In Progress';
      case 'completed': return 'Completed';
      case 'rejected': case 'disapproved_arc': return 'Disapproved';
      case 'disapproved_board': return 'Board Disapproved';
      case 'cancelled': return 'Cancelled';
      default: return status.replace('_', ' ').toUpperCase();
    }
  };

  if (showRequestSubmission) {
    return (
      <RequestSubmission 
        onClose={() => setShowRequestSubmission(false)}
        onSubmit={() => setShowRequestSubmission(false)}
      />
    );
  }

  if (showRequestTracking) {
    return (
      <RequestTracking 
        onClose={() => setShowRequestTracking(false)}
      />
    );
  }

  if (showFormCompletion) {
    return (
      <FormCompletion 
        onClose={() => setShowFormCompletion(false)}
      />
    );
  }

  if (showNotifications) {
    return (
      <NotificationCenter 
        onClose={() => setShowNotifications(false)}
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Good afternoon, {currentUser?.name}</h1>
        <p className="text-gray-600 mt-2">Welcome to your HOA Connect homeowner dashboard</p>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => setShowRequestSubmission(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white p-6 rounded-lg shadow-sm transition-colors flex items-center space-x-3"
          >
            <Plus className="w-6 h-6" />
            <div className="text-left">
              <div className="font-semibold">Submit ARC Request</div>
              <div className="text-sm opacity-90">Start an ARC request</div>
            </div>
          </button>
          
          <button
            className="bg-green-600 hover:bg-green-700 text-white p-6 rounded-lg shadow-sm transition-colors flex items-center space-x-3 cursor-not-allowed opacity-75"
            disabled
          >
            <DollarSign className="w-6 h-6" />
            <div className="text-left">
              <div className="font-semibold">Pay HOA Dues</div>
              <div className="text-sm opacity-90">Coming soon</div>
            </div>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Account Alerts & ARC Request History */}
        <div className="lg:col-span-2 space-y-6">
          {/* Account Alerts */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Alerts</h3>
            
            <div className="space-y-4">
              {/* Forms to Sign */}
              {pendingForms.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Forms to Sign</h4>
                  <div className="space-y-2">
                    {pendingForms.map((form) => (
                      <div key={form.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                        <div className="flex items-center space-x-3">
                          <AlertTriangle className="w-5 h-5 text-orange-600" />
                          <div>
                            <div className="font-medium text-orange-900">{form.title}</div>
                            <div className="text-sm text-orange-700">Due {new Date(form.dueDate).toLocaleDateString()}</div>
                          </div>
                        </div>
                        <button
                          onClick={() => setShowFormCompletion(true)}
                          className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1 rounded text-sm"
                        >
                          Sign
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* HOA Announcements */}
              {hoaAnnouncements.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">HOA Announcements</h4>
                  <div className="space-y-2">
                    {hoaAnnouncements.map((announcement) => (
                      <div key={announcement.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center space-x-3">
                          <Bell className="w-5 h-5 text-blue-600" />
                          <div>
                            <div className="font-medium text-blue-900">{announcement.title}</div>
                            <div className="text-sm text-blue-700">{new Date(announcement.date).toLocaleDateString()}</div>
                          </div>
                        </div>
                        <button className="text-blue-600 hover:text-blue-800">
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ARC Actions Required */}
              {actionRequiredRequests.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">ARC Actions Required</h4>
                  <div className="space-y-2">
                    {actionRequiredRequests.map((request) => (
                      <div key={request.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                        <div className="flex items-center space-x-3">
                          <AlertTriangle className="w-5 h-5 text-red-600" />
                          <div>
                            <div className="font-medium text-red-900">{request.title}</div>
                            <div className="text-sm text-red-700">Reply needed - check details</div>
                          </div>
                        </div>
                        <button
                          onClick={() => setShowRequestTracking(true)}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                        >
                          View
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No Alerts */}
              {pendingForms.length === 0 && hoaAnnouncements.length === 0 && actionRequiredRequests.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
                  <p>No alerts - you're all caught up!</p>
                </div>
              )}
            </div>
          </div>

          {/* ARC Request History */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">ARC Request History</h3>
              <button
                onClick={() => setShowRequestTracking(true)}
                className="text-blue-600 hover:text-blue-800 text-sm flex items-center space-x-1"
              >
                <span>View All</span>
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>
            
            {recentRequests.length > 0 ? (
              <div className="space-y-3">
                {recentRequests.map((request) => (
                  <div key={request.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{request.title}</div>
                      <div className="text-sm text-gray-600">
                        {request.type?.replace('_', ' ').toUpperCase()} • Submitted {new Date(request.submittedAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                        {getStatusText(request.status)}
                      </span>
                      <button
                        onClick={() => setShowRequestTracking(true)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No requests yet</p>
                <button
                  onClick={() => setShowRequestSubmission(true)}
                  className="text-blue-600 hover:text-blue-800 text-sm mt-2"
                >
                  Submit your first request
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Community Info */}
        <div className="space-y-6">
          {/* Community Info */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Community Info</h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Home className="w-5 h-5 text-gray-600 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-gray-900">Rancho Madrina Community</div>
                  <div className="text-sm text-gray-600">Managed by Seabreeze</div>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-gray-600 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-gray-900">Your Address</div>
                  <div className="text-sm text-gray-600">{currentUser?.homeownerData?.address || '123 Oak Street'}</div>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Calendar className="w-5 h-5 text-gray-600 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-gray-900">Move-in Date</div>
                  <div className="text-sm text-gray-600">
                    {currentUser?.homeownerData?.moveInDate ? 
                      new Date(currentUser.homeownerData.moveInDate).toLocaleDateString() : 
                      'January 15, 2023'
                    }
                  </div>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Users className="w-5 h-5 text-gray-600 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-gray-900">HOA Management</div>
                  <div className="text-sm text-gray-600">Allan Chua</div>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Phone className="w-5 h-5 text-gray-600 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-gray-900">Management Phone</div>
                  <div className="text-sm text-gray-600">(555) 123-4567</div>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Mail className="w-5 h-5 text-gray-600 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-gray-900">Management Email</div>
                  <div className="text-sm text-gray-600">allan@seabreeze.com</div>
                </div>
              </div>
            </div>
          </div>

          {/* Request Summary Stats */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Request Summary</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm text-gray-600">Pending</span>
                </div>
                <span className="font-semibold text-yellow-600">{pendingRequests.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-gray-600">Approved</span>
                </div>
                <span className="font-semibold text-green-600">{approvedRequests.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-gray-600">Total Requests</span>
                </div>
                <span className="font-semibold text-blue-600">{myRequests.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeownerDashboard;
