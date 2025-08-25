import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useDemoContext } from '../../contexts/DemoContext';
import { Request } from '../../types';
import { getBoardMembers } from '../../data/mockData';
import { 
  Vote, 
  Clock, 
  CheckCircle, 
  Users,
  FileText,
  AlertTriangle,
  Eye,
  MessageSquare
} from 'lucide-react';
import VotingInterface from './VotingInterface';

const BoardDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const { requests, notifications, updateRequest } = useDemoContext();
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  
  const boardMembers = getBoardMembers();

  const pendingVotes = requests.filter(r => 
    (r.status === 'board_voting' || r.status === 'appeal_review') && 
    !r.boardVotes?.find(v => v.boardMemberId === currentUser?.id)
  );

  const appealRequests = requests.filter(r => r.status === 'appeal_requested');

  const completedVotes = requests.filter(r => 
    r.boardVotes?.find(v => v.boardMemberId === currentUser?.id)
  );

  const getVoteStats = (request: Request) => {
    const votes = request.boardVotes || [];
    return {
      total: boardMembers.length, // Dynamic board member count
      voted: votes.length,
      approve: votes.filter(v => v.vote === 'approve').length,
      reject: votes.filter(v => v.vote === 'reject').length
    };
  };

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {currentUser?.name.split(' ')[0]}
        </h1>
        <p className="text-gray-600 mt-1">
          {currentUser?.boardMemberData?.position.replace('_', ' ').toUpperCase()} • Rancho Madrina Community Association
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Vote className="h-8 w-8 text-purple-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Pending Votes</p>
              <p className="text-2xl font-semibold text-gray-900">{pendingVotes.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircle className="h-8 w-8 text-success-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Votes This Month</p>
              <p className="text-2xl font-semibold text-gray-900">{completedVotes.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Users className="h-8 w-8 text-primary-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Board Members</p>
              <p className="text-2xl font-semibold text-gray-900">{boardMembers.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Notifications */}
      {notifications.length > 0 && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-purple-400" />
            <div className="ml-3">
              <h4 className="text-sm font-medium text-purple-800">
                Recent Activity
              </h4>
              <p className="text-sm text-purple-700">
                {notifications[0]}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Pending Votes */}
      {pendingVotes.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Pending Votes</h3>
            <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
              {pendingVotes.length} Requiring Your Vote
            </span>
          </div>
          
          <div className="space-y-4">
            {pendingVotes.map((request) => {
              const stats = getVoteStats(request);
              return (
                <div key={request.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{request.title}</h4>
                      <p className="text-sm text-gray-500 mt-1">
                        Submitted by Jason Abustan • {new Date(request.submittedAt).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-600 mt-2">{request.description}</p>
                      
                      {/* Voting Progress */}
                      <div className="mt-3 flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-full bg-gray-200 rounded-full h-1.5 w-24">
                            <div 
                              className="bg-purple-600 h-1.5 rounded-full transition-all"
                              style={{ width: `${(stats.voted / stats.total) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-500">{stats.voted}/{stats.total}</span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {stats.approve} approve • {stats.reject} reject
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <span className="status-badge bg-red-100 text-red-800">
                        Vote Required
                      </span>
                      <button
                        onClick={() => setSelectedRequest(request)}
                        className="btn-primary flex items-center space-x-1"
                      >
                        <Vote className="w-4 h-4" />
                        <span>Vote Now</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Appeal Requests */}
      {appealRequests.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Appeal Requests</h3>
            <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full">
              {appealRequests.length} Pending Review
            </span>
          </div>
          
          <div className="space-y-4">
            {appealRequests.map((request) => (
              <div key={request.id} className="border border-orange-200 rounded-lg p-4 bg-orange-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{request.title}</h4>
                    <p className="text-sm text-gray-500 mt-1">
                      Appeal submitted by Jason Abustan • {request.appealData ? new Date(request.appealData.submittedAt).toLocaleDateString() : 'Recent'}
                    </p>
                    
                    {request.appealData && (
                      <div className="mt-3 p-3 bg-white border border-orange-200 rounded">
                        <p className="text-sm text-gray-800">
                          <strong>Appeal Reason:</strong> {request.appealData.reason}
                        </p>
                        {request.appealData.additionalInfo && (
                          <p className="text-sm text-gray-600 mt-2">
                            <strong>Additional Info:</strong> {request.appealData.additionalInfo}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <span className="status-badge bg-orange-100 text-orange-800">
                      Appeal Review Required
                    </span>
                    <button
                      onClick={() => {
                        // Move appeal to review status and open voting interface
                        const updatedRequest = {
                          ...request,
                          status: 'appeal_review' as const,
                          boardVotes: [], // Reset votes for appeal review
                          timeline: [...request.timeline, {
                            id: `timeline-${Date.now()}`,
                            timestamp: new Date().toISOString(),
                            type: 'comment' as const,
                            userId: currentUser?.id || '',
                            userName: currentUser?.name || '',
                            description: 'Appeal review started by Board of Directors'
                          }]
                        };
                        
                        // Update the request in context and open voting interface
                        updateRequest(updatedRequest);
                        setSelectedRequest(updatedRequest);
                      }}
                      className="btn-primary flex items-center space-x-1"
                    >
                      <Vote className="w-4 h-4" />
                      <span>Review Appeal</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Votes */}
      {completedVotes.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Votes</h3>
          <div className="space-y-3">
            {completedVotes.map((request) => {
              const myVote = request.boardVotes?.find(v => v.boardMemberId === currentUser?.id);
              const stats = getVoteStats(request);
              const isComplete = stats.voted >= stats.total;
              
              return (
                <div key={request.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">{request.title}</h4>
                    <div className="flex items-center space-x-2 mt-1">
                                          <span className={`status-badge ${
                      myVote?.vote === 'approve' ? 'status-approved' : 'status-rejected'
                    }`}>
                      You voted: {myVote?.vote.toUpperCase()}
                    </span>
                      {isComplete && (
                        <span className={`status-badge ${
                          request.status === 'in_progress' ? 'status-approved' : 'status-rejected'
                        }`}>
                          Final: {request.status === 'in_progress' ? 'APPROVED' : 'REJECTED'}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedRequest(request)}
                    className="text-primary-600 hover:text-primary-800 flex items-center space-x-1"
                  >
                    <Eye className="w-4 h-4" />
                    <span>View</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* No Pending Votes */}
      {pendingVotes.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
          <Vote className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Pending Votes</h3>
          <p className="text-gray-500">
            All current requests have been voted on. New requests requiring board approval will appear here.
          </p>
        </div>
      )}

      {/* Voting Interface Modal */}
      {selectedRequest && (
        <VotingInterface
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
          onVote={(vote) => {
            console.log('Vote submitted:', vote);
            // The VotingInterface handles the update via DemoContext
          }}
        />
      )}
    </div>
  );
};

export default BoardDashboard;
