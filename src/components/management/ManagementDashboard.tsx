import React, { useState } from 'react';
import { useDemoContext } from '../../contexts/DemoContext';
import { useAuth } from '../../contexts/AuthContext';
import { Request } from '../../types';
import { DEMO_COMMUNITIES } from '../../data/mockData';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  Users,
  Building,
  Bell,
  Eye,
  X,
  Megaphone,
  Brain
} from 'lucide-react';
import RequestReview from './RequestReview';
import FormsManagement from './FormsManagement';
import CompanyProfile from './CompanyProfile';
import HoaDocuments from './HoaDocuments';

const ManagementDashboard: React.FC = () => {
  const { requests, notifications, updateRequest } = useDemoContext();
  const { currentUser, currentCommunity, switchCommunity } = useAuth();
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [showFormsManagement, setShowFormsManagement] = useState(false);
  const [showCompanyProfile, setShowCompanyProfile] = useState(false);
  const [showHoaDocuments, setShowHoaDocuments] = useState(false);

  // Get managed communities for current user
  const managedCommunities = currentUser?.managementData?.managedCommunities || [];
  const activeCommunity = currentCommunity || managedCommunities[0] || 'rancho-madrina';
  
  // Get community info
  const communityInfo = DEMO_COMMUNITIES.find(c => c.id === activeCommunity);
  
  // Filter requests by current community
  const communityRequests = requests.filter(r => r.communityId === activeCommunity || !r.communityId);
  
  // Debug logging
  console.log('ManagementDashboard Debug:', {
    totalRequests: requests.length,
    activeCommunity,
    communityRequests: communityRequests.length,
    allRequestCommunities: requests.map(r => ({ id: r.id, title: r.title, communityId: r.communityId }))
  });

  const getStatusDisplay = (status: string) => {
    const statusMap: Record<string, { label: string; color: string; icon: string }> = {
      'submitted': { label: 'Submitted', color: 'bg-blue-100 text-blue-800', icon: '📝' },
      'under_review': { label: 'Under Review', color: 'bg-yellow-100 text-yellow-800', icon: '🔍' },
      'homeowner_reply_needed': { label: 'Homeowner Reply Needed', color: 'bg-orange-100 text-orange-800', icon: '💬' },
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
      'cancelled': { label: 'Cancelled', color: 'bg-gray-100 text-gray-800', icon: '🚫' }
    };
    
    return statusMap[status] || statusMap['submitted'];
  };

  const getPendingRequests = () => {
    return communityRequests.filter(r => 
      ['submitted', 'cc_r_review'].includes(r.status) && 
      r.status !== 'cancelled'
    );
  };

  // Removed unused getCompletedRequests function

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, Allan
            </h1>
            <p className="text-gray-600 mt-1">
              Seabreeze Management Company - {communityInfo?.name || 'Community'}
            </p>
          </div>
          
          {/* Community Selector */}
          {managedCommunities.length > 1 && (
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Active Community
              </label>
              <select
                value={activeCommunity}
                onChange={(e) => switchCommunity(e.target.value)}
                className="block w-48 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              >
                {managedCommunities.map(communityId => {
                  const community = DEMO_COMMUNITIES.find(c => c.id === communityId);
                  return (
                    <option key={communityId} value={communityId}>
                      {community?.name || communityId}
                    </option>
                  );
                })}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Management Menu */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Management Dashboard</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => setShowCompanyProfile(true)}
            className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors text-left group"
          >
            <div className="flex items-center space-x-3">
              <Building className="w-7 h-7 text-primary-600" />
              <div>
                <h4 className="font-medium text-gray-900 group-hover:text-primary-700">
                  Company Profile
                </h4>
                <p className="text-sm text-gray-500">
                  Manage company info, logo, and contact details
                </p>
              </div>
            </div>
          </button>
          
          <button
            onClick={() => setShowFormsManagement(true)}
            className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors text-left group"
          >
            <div className="flex items-center space-x-3">
              <Megaphone className="w-7 h-7 text-primary-600" />
              <div>
                <h4 className="font-medium text-gray-900 group-hover:text-primary-700">
                  Communications Center
                </h4>
                <p className="text-sm text-gray-500">
                  Manage forms, announcements, and community communications
                </p>
              </div>
            </div>
          </button>
          
          <button
            onClick={() => setShowHoaDocuments(true)}
            className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors text-left group"
          >
            <div className="flex items-center space-x-3">
              <FileText className="w-7 h-7 text-primary-600" />
              <div>
                <div className="flex items-center space-x-2">
                  <h4 className="font-medium text-gray-900 group-hover:text-primary-700">Governing Documents</h4>
                  <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full text-xs">Beta</span>
                  <span className="flex items-center space-x-1 text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full text-xs">
                    <Brain className="w-3.5 h-3.5" />
                    <span>AI</span>
                  </span>
                </div>
                <p className="text-sm text-gray-500">Upload and manage CC&Rs, bylaws, guidelines, rules & policies</p>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Clock className="h-8 w-8 text-warning-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Pending Reviews</p>
              <p className="text-2xl font-semibold text-gray-900">{getPendingRequests().length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Users className="h-8 w-8 text-seabreeze-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Homeowners</p>
              <p className="text-2xl font-semibold text-gray-900">847</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Building className="h-8 w-8 text-purple-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Communities</p>
              <p className="text-2xl font-semibold text-gray-900">{managedCommunities.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircle className="h-8 w-8 text-success-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Forms Completed</p>
              <p className="text-2xl font-semibold text-gray-900">234</p>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Notifications */}
      {notifications.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <Bell className="h-5 w-5 text-blue-400" />
            <div className="ml-3">
              <h4 className="text-sm font-medium text-blue-800">
                Real-time Notification
              </h4>
              <p className="text-sm text-blue-700">
                {notifications[0]}
              </p>
            </div>
          </div>
        </div>
      )}

      {showHoaDocuments && (
        <HoaDocuments onClose={() => setShowHoaDocuments(false)} />
      )}

      {/* Pending Requests */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Pending Requests</h3>
          <span className="bg-warning-100 text-warning-800 text-xs px-2 py-1 rounded-full">
            {getPendingRequests().length} Requiring Action
          </span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Homeowner
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Request Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Submitted
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {requests.map((request) => (
                <tr key={request.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8">
                        <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                          <span className="text-xs font-medium text-gray-600">
                            {request.homeownerId === 'jason-abustan' ? 'JA' : 'XX'}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          Jason Abustan
                        </div>
                        <div className="text-sm text-gray-500">
                          123 Oak Street
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {request.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">{getStatusDisplay(request.status).icon}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusDisplay(request.status).color}`}>
                        {getStatusDisplay(request.status).label}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(request.submittedAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => setSelectedRequest(request)}
                      className="text-primary-600 hover:text-primary-900 flex items-center space-x-1"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Review</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-3">Quick Actions</h4>
          <div className="space-y-2">
            <button 
              onClick={() => setShowFormsManagement(true)}
              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded"
            >
              <FileText className="w-4 h-4 inline mr-2" />
              Distribute Forms
            </button>
            <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded">
              <Users className="w-4 h-4 inline mr-2" />
              Send Community Notice
            </button>
            <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded">
              <Bell className="w-4 h-4 inline mr-2" />
              View All Notifications
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-3">Recent Activity</h4>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-2 h-2 bg-primary-500 rounded-full mt-2"></div>
              <div>
                <p className="text-sm text-gray-900">New request from Jason Abustan</p>
                <p className="text-xs text-gray-500">Patio painting - Just now</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div>
                <p className="text-sm text-gray-900">Form distribution completed</p>
                <p className="text-xs text-gray-500">Owner Notice Disclosure - 2 hours ago</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-3">Community Health</h4>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Request Response Time</span>
              <span className="text-sm font-medium text-green-600">2.3 days avg</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Board Approval Rate</span>
              <span className="text-sm font-medium text-green-600">94%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Form Completion</span>
              <span className="text-sm font-medium text-yellow-600">27.6%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Request Review Modal */}
      {selectedRequest && (
        <RequestReview
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
          onApprove={(request: Request) => {
            console.log('Request approved by management:', request);
            updateRequest(request);
            setSelectedRequest(null);
          }}
          onReject={(request: Request) => {
            console.log('Request rejected by management:', request);
            updateRequest(request);
            setSelectedRequest(null);
          }}
        />
      )}

      {/* Communications Center Modal */}
      {showFormsManagement && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-11/12 max-w-6xl shadow-lg rounded-md bg-white min-h-[80vh]">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Communications Center</h2>
              <button
                onClick={() => setShowFormsManagement(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <FormsManagement />
          </div>
        </div>
      )}

      {/* Company Profile Modal */}
      {showCompanyProfile && (
        <CompanyProfile onClose={() => setShowCompanyProfile(false)} />
      )}
    </div>
  );
};

export default ManagementDashboard;
