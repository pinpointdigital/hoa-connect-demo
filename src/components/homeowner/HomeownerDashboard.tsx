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
  Calendar
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
    ['submitted', 'cc_r_review', 'neighbor_approval', 'board_review'].includes(r.status)
  );
  const approvedRequests = myRequests.filter(r => r.status === 'approved');
  const recentRequests = myRequests.slice(0, 3);

  // Mock form data - in real app this would come from API
  const pendingForms = 1;
  const completedForms = 2;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return 'text-blue-600 bg-blue-100';
      case 'cc_r_review': return 'text-yellow-600 bg-yellow-100';
      case 'neighbor_approval': return 'text-purple-600 bg-purple-100';
      case 'board_review': return 'text-orange-600 bg-orange-100';
      case 'approved': return 'text-green-600 bg-green-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'submitted': return 'Submitted';
      case 'cc_r_review': return 'Under Review';
      case 'neighbor_approval': return 'Neighbor Approval';
      case 'board_review': return 'Board Review';
      case 'approved': return 'Approved';
      case 'rejected': return 'Rejected';
      default: return status;
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => setShowRequestSubmission(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white p-6 rounded-lg shadow-sm transition-colors flex items-center space-x-3"
          >
            <Plus className="w-6 h-6" />
            <div className="text-left">
              <div className="font-semibold">Submit New Request</div>
              <div className="text-sm opacity-90">Start an ARC request</div>
            </div>
          </button>
          
          <button
            onClick={() => setShowRequestTracking(true)}
            className="bg-white hover:bg-gray-50 border border-gray-200 p-6 rounded-lg shadow-sm transition-colors flex items-center space-x-3"
          >
            <ClipboardList className="w-6 h-6 text-gray-600" />
            <div className="text-left">
              <div className="font-semibold text-gray-900">My Requests</div>
              <div className="text-sm text-gray-600">Track request status</div>
            </div>
          </button>

          <button
            onClick={() => setShowNotifications(true)}
            className="bg-white hover:bg-gray-50 border border-gray-200 p-6 rounded-lg shadow-sm transition-colors flex items-center space-x-3 relative"
          >
            <Bell className="w-6 h-6 text-gray-600" />
            <div className="text-left">
              <div className="font-semibold text-gray-900">Notifications</div>
              <div className="text-sm text-gray-600">View updates</div>
            </div>
            {notifications.length > 0 && (
              <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
                {notifications.length}
              </div>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Request Status */}
        <div className="lg:col-span-2 space-y-6">
          {/* Pending Requests */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Pending Requests</h3>
              <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                {pendingRequests.length}
              </span>
            </div>
            
            {pendingRequests.length > 0 ? (
              <div className="space-y-3">
                {pendingRequests.map((request) => (
                  <div key={request.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{request.title}</div>
                      <div className="text-sm text-gray-600">{request.type} • Submitted {new Date(request.submittedAt).toLocaleDateString()}</div>
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
                <ClipboardList className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No pending requests</p>
                <button
                  onClick={() => setShowRequestSubmission(true)}
                  className="text-blue-600 hover:text-blue-800 text-sm mt-2"
                >
                  Submit your first request
                </button>
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
            
            {recentRequests.length > 0 ? (
              <div className="space-y-3">
                {recentRequests.map((request) => (
                  <div key={request.id} className="flex items-start space-x-3">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      request.status === 'approved' ? 'bg-green-500' :
                      request.status === 'rejected' ? 'bg-red-500' :
                      'bg-yellow-500'
                    }`}></div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">{request.title}</div>
                      <div className="text-xs text-gray-600">
                        {getStatusText(request.status)} • {new Date(request.submittedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                <p className="text-sm">No recent activity</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Stats & Forms */}
        <div className="space-y-6">
          {/* Request Stats */}
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

          {/* Forms Due */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Forms Due</h3>
            
            {pendingForms > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="w-5 h-5 text-orange-600" />
                    <div>
                      <div className="font-medium text-orange-900">Owner Notice Disclosure</div>
                      <div className="text-sm text-orange-700">Due in 10 days</div>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowFormCompletion(true)}
                    className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1 rounded text-sm"
                  >
                    Complete
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
                <p className="text-sm">All forms completed</p>
              </div>
            )}
          </div>

          {/* Community Info */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Community</h3>
            <div className="space-y-3">
              <div>
                <div className="text-sm font-medium text-gray-900">Rancho Madrina Community</div>
                <div className="text-sm text-gray-600">Managed by Seabreeze</div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900">Your Address</div>
                <div className="text-sm text-gray-600">{currentUser?.homeownerData?.address}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900">Move-in Date</div>
                <div className="text-sm text-gray-600">
                  {currentUser?.homeownerData?.moveInDate ? 
                    new Date(currentUser.homeownerData.moveInDate).toLocaleDateString() : 
                    'Not specified'
                  }
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeownerDashboard;
