import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useDemoContext } from '../../contexts/DemoContext';
import { Request, BoardVote } from '../../types';
import { 
  Vote, 
  CheckCircle, 
  XCircle, 
  Clock,
  FileText,
  Users,
  MessageSquare,
  PenTool,
  AlertTriangle,
  ThumbsUp,
  ThumbsDown,
  UserPlus
} from 'lucide-react';
import { getBoardMembers } from '../../data/mockData';

interface VotingInterfaceProps {
  request: Request;
  onClose?: () => void;
  onVote?: (vote: BoardVote) => void;
}

const VotingInterface: React.FC<VotingInterfaceProps> = ({ request, onClose, onVote }) => {
  const { currentUser } = useAuth();
  const { requests, updateRequest, addNotification } = useDemoContext();
  
  // Use live request data
  const liveRequest = requests.find(r => r.id === request.id) || request;
  
  const [currentTab, setCurrentTab] = useState<'details' | 'discussion' | 'vote'>('details');
  const [voteChoice, setVoteChoice] = useState<'approve' | 'reject' | ''>('');
  const [voteComments, setVoteComments] = useState('');
  const [discussionMessage, setDiscussionMessage] = useState('');
  const [replyToMember, setReplyToMember] = useState<string>('');
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [signatureData, setSignatureData] = useState('');
  const [typedName, setTypedName] = useState('');

  const boardMembers = getBoardMembers();
  const currentUserVote = liveRequest.boardVotes?.find(v => v.boardMemberId === currentUser?.id);
  const hasVoted = !!currentUserVote;
  
  // Check if voting is complete (majority reached)
  const isVotingComplete = () => {
    const votes = liveRequest.boardVotes || [];
    const approveVotes = votes.filter(v => v.vote === 'approve').length;
    const rejectVotes = votes.filter(v => v.vote === 'reject').length;
    const majority = Math.ceil(boardMembers.length / 2);
    return approveVotes >= majority || rejectVotes >= majority;
  };
  
  const canChangeVote = hasVoted && !isVotingComplete();

  const getVoteStats = () => {
    const votes = liveRequest.boardVotes || [];
    return {
      total: boardMembers.length,
      approve: votes.filter(v => v.vote === 'approve').length,
      reject: votes.filter(v => v.vote === 'reject').length,
      pending: boardMembers.length - votes.length
    };
  };

  const stats = getVoteStats();

  const handleSubmitVote = () => {
    if (!voteChoice || !currentUser) return;
    
    setShowSignatureModal(true);
  };

  const handleChangeVote = () => {
    if (!currentUser) return;
    
    // Remove existing vote
    const updatedRequest = {
      ...liveRequest,
      boardVotes: liveRequest.boardVotes?.filter(v => v.boardMemberId !== currentUser.id) || [],
      timeline: [...liveRequest.timeline, {
        id: `timeline-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'comment' as const,
        userId: currentUser.id,
        userName: currentUser.name,
        description: `Board member withdrew previous vote to make a new decision`
      }]
    };
    
    updateRequest(updatedRequest);
    addNotification(`${currentUser.name} withdrew their vote to reconsider`);
    alert('Previous vote withdrawn. You can now cast a new vote.');
  };

  const handleSignVote = () => {
    if (!voteChoice || !currentUser || !typedName.trim()) return;
    
    // Validate typed name matches user name
    if (typedName.trim().toLowerCase() !== currentUser.name.toLowerCase()) {
      alert('Please type your full name exactly as it appears in your profile.');
      return;
    }

    const newVote: BoardVote = {
      id: `vote-${Date.now()}`,
      boardMemberId: currentUser.id,
      vote: voteChoice,
      comments: voteComments,
      submittedAt: new Date().toISOString(),
      digitalSignature: {
        id: `sig-${Date.now()}`,
        signatureData: typedName,
        signedBy: currentUser.id,
        signedAt: new Date().toISOString(),
        ipAddress: '192.168.1.189',
        userAgent: navigator.userAgent,
        verified: true
      }
    };

    // Start with current request
    const updatedRequest = {
      ...liveRequest,
      timeline: [...liveRequest.timeline, {
        id: `timeline-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'comment' as const,
        userId: currentUser.id,
        userName: currentUser.name,
        description: `Board vote: ${voteChoice.toUpperCase()}${voteComments ? ` - ${voteComments}` : ''}`
      }]
    };

    // Handle vote properly - remove old vote if exists, then add new vote
    let currentVotes = [...(liveRequest.boardVotes || [])];
    
    // If this is a vote change, remove the old vote first
    if (hasVoted) {
      currentVotes = currentVotes.filter(v => v.boardMemberId !== currentUser.id);
    }
    
    // Add the new vote
    currentVotes.push(newVote);
    updatedRequest.boardVotes = currentVotes;

    // Check if majority is reached (immediate decision)
    const approveVotes = currentVotes.filter(v => v.vote === 'approve').length;
    const rejectVotes = currentVotes.filter(v => v.vote === 'reject').length;
    const majority = Math.ceil(boardMembers.length / 2); // 3 out of 5
    
    if (approveVotes >= majority || rejectVotes >= majority) {
      // Majority reached - make immediate decision
      updatedRequest.status = approveVotes >= majority ? 'in_progress' : 'disapproved_board';
      updatedRequest.currentStep = 'step-decision';
      if (approveVotes >= majority) {
        // Approved - project starts
        updatedRequest.updatedAt = new Date().toISOString();
      } else {
        // Rejected - mark as completed
        updatedRequest.completedAt = new Date().toISOString();
      }
      
      updatedRequest.timeline.push({
        id: `timeline-${Date.now() + 1}`,
        timestamp: new Date().toISOString(),
        type: updatedRequest.status as any,
        userId: 'system',
        userName: 'System',
        description: `Board voting complete: ${updatedRequest.status.toUpperCase()} - Majority reached (${approveVotes} approve, ${rejectVotes} reject)`
      });
    }

    updateRequest(updatedRequest);
    addNotification(`Board vote submitted: ${voteChoice.toUpperCase()} for ${liveRequest.title}`);
    onVote?.(newVote);
    
    setShowSignatureModal(false);
    setTypedName('');
    setVoteChoice('');
    setVoteComments('');
    
    const action = hasVoted ? 'changed' : 'submitted';
    const totalVotesCast = updatedRequest.boardVotes.length;
    
    // Check if majority was just reached
    if (approveVotes >= majority || rejectVotes >= majority) {
      alert(`Vote ${action} successfully! MAJORITY REACHED: Request ${updatedRequest.status.toUpperCase()} (${approveVotes} approve, ${rejectVotes} reject). Homeowner will be notified immediately.`);
    } else {
      alert(`Vote ${action} successfully! ${totalVotesCast}/${boardMembers.length} board members have voted. Need ${majority} votes for majority decision.`);
    }
  };

  const handleAddDiscussion = () => {
    if (!discussionMessage.trim() || !currentUser) return;

    const message = replyToMember 
      ? `Board discussion: @${replyToMember} ${discussionMessage}`
      : `Board discussion: ${discussionMessage}`;

    const updatedRequest = {
      ...liveRequest,
      timeline: [...liveRequest.timeline, {
        id: `timeline-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'comment' as const,
        userId: currentUser.id,
        userName: currentUser.name,
        description: message
      }]
    };

    updateRequest(updatedRequest);
    addNotification(`Board discussion added by ${currentUser.name}`);
    setDiscussionMessage('');
    setReplyToMember('');
  };

  const renderDetailsTab = () => (
    <div className="space-y-6">
      {/* Request Summary */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Request Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Homeowner</label>
            <p className="text-gray-900">Jason Abustan</p>
            <p className="text-sm text-gray-500">123 Oak Street</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Request Type</label>
            <p className="text-gray-900">{liveRequest.title}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Submitted</label>
            <p className="text-gray-900">{new Date(liveRequest.submittedAt).toLocaleDateString()}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Priority</label>
            <span className={`status-badge ${
              liveRequest.priority === 'high' ? 'bg-red-100 text-red-800' :
              liveRequest.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {liveRequest.priority.toUpperCase()}
            </span>
          </div>
        </div>
        
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
          <p className="text-gray-600">{liveRequest.description}</p>
        </div>

        {/* Photos */}
        {liveRequest.photos && liveRequest.photos.length > 0 && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Submitted Photos</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {liveRequest.photos.map((photo) => (
                <img
                  key={photo.id}
                  src={photo.url}
                  alt={photo.caption}
                  className="w-full h-24 object-cover rounded-lg border"
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Attached CC&Rs and Forms */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Attached Documentation</h4>
        
        {/* CC&R References */}
        <div className="mb-4">
          <h5 className="text-sm font-medium text-gray-700 mb-2">CC&R References</h5>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div>
                <p className="font-medium text-blue-900">Section 4.2: Exterior Color Guidelines</p>
                <p className="text-sm text-blue-700">Earth tones approved - sage green compliant</p>
              </div>
              <button className="text-blue-600 hover:text-blue-800 text-sm underline">
                View Full Text
              </button>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div>
                <p className="font-medium text-blue-900">Section 3.1: Neighbor Notification</p>
                <p className="text-sm text-blue-700">Adjacent neighbor approval requirements</p>
              </div>
              <button className="text-blue-600 hover:text-blue-800 text-sm underline">
                View Full Text
              </button>
            </div>
          </div>
        </div>

        {/* Submitted Forms */}
        <div>
          <h5 className="text-sm font-medium text-gray-700 mb-2">Submitted Forms</h5>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
              <div>
                <p className="font-medium text-green-900">ARC Application Form</p>
                <p className="text-sm text-green-700">Completed by homeowner with all required details</p>
              </div>
              <button className="text-green-600 hover:text-green-800 text-sm underline">
                View Form
              </button>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
              <div>
                <p className="font-medium text-green-900">Neighbor Approval Forms</p>
                <p className="text-sm text-green-700">All 5 neighbors have approved this request</p>
              </div>
              <button className="text-green-600 hover:text-green-800 text-sm underline">
                View Approvals
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Management Recommendation */}
      {liveRequest.managementReview && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-blue-900 mb-3 flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Management Recommendation
          </h4>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-blue-800">Recommendation:</span>
              <span className={`status-badge ${
                liveRequest.managementReview.recommendation === 'approve' ? 'status-approved' : 'status-rejected'
              }`}>
                {liveRequest.managementReview.recommendation?.toUpperCase()}
              </span>
            </div>
            {liveRequest.managementReview.comments && (
              <div>
                <span className="text-sm font-medium text-blue-800">Comments:</span>
                <p className="text-sm text-blue-700 mt-1">{liveRequest.managementReview.comments}</p>
              </div>
            )}
            <div className="text-xs text-blue-600">
              Reviewed by Allan Chua • {new Date(liveRequest.managementReview.reviewedAt || '').toLocaleDateString()}
            </div>
          </div>
        </div>
      )}

      {/* CC&R Compliance */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-green-900 mb-3">CC&R Compliance Check</h4>
        <div className="flex items-start space-x-3">
          <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
          <div>
            <p className="text-sm text-green-800">
              <strong>Section 4.2 - Exterior Color Guidelines:</strong> Sage green is listed as an approved earth tone color.
            </p>
            <p className="text-sm text-green-700 mt-1">
              Request meets all CC&R requirements for exterior modifications.
            </p>
          </div>
        </div>
      </div>

      {/* Appeal Information */}
      {liveRequest.status === 'appeal_review' && liveRequest.appealData && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-orange-900 mb-3 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2" />
            Appeal Request
          </h4>
          <div className="space-y-3">
            <div>
              <span className="text-sm font-medium text-orange-800">Appeal Submitted:</span>
              <p className="text-sm text-orange-700 mt-1">{new Date(liveRequest.appealData.submittedAt).toLocaleDateString()}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-orange-800">Reason for Appeal:</span>
              <p className="text-sm text-orange-700 mt-1">{liveRequest.appealData.reason}</p>
            </div>
            {liveRequest.appealData.additionalInfo && (
              <div>
                <span className="text-sm font-medium text-orange-800">Additional Information:</span>
                <p className="text-sm text-orange-700 mt-1">{liveRequest.appealData.additionalInfo}</p>
              </div>
            )}
            <div className="bg-white border border-orange-200 rounded p-3">
              <p className="text-xs text-orange-800">
                <strong>Appeal Process:</strong> This request was previously rejected and the homeowner has submitted an appeal. 
                Please review the original decision and the homeowner's appeal reasoning before casting your vote.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderDiscussionTab = () => (
    <div className="space-y-6">
      {/* Board Discussion Thread */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <MessageSquare className="w-5 h-5 mr-2" />
          Board Discussion
        </h4>

        {/* Discussion Messages */}
        <div className="space-y-4 mb-6">
          {liveRequest.timeline
            .filter(event => 
              event.type === 'comment' && 
              event.userId !== 'system' &&
              (event.description.includes('Board discussion:') || 
               event.description.includes('Board vote:') ||
               boardMembers.some(member => member.id === event.userId))
            )
            .map((event) => (
              <div key={event.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <Users className="w-4 h-4 text-purple-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900">{event.userName}</span>
                      <span className="text-xs text-gray-500">
                        {new Date(event.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <button
                      onClick={() => setReplyToMember(event.userName)}
                      className="text-xs text-purple-600 hover:text-purple-800 underline"
                    >
                      Reply
                    </button>
                  </div>
                  <p className="text-sm text-gray-600">
                    {event.description.replace('Board discussion: ', '')}
                  </p>
                </div>
              </div>
            ))}
          
          {liveRequest.timeline.filter(event => 
            event.type === 'comment' && 
            boardMembers.some(member => member.id === event.userId)
          ).length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p>No board discussion yet. Be the first to comment!</p>
            </div>
          )}
        </div>

        {/* Add Discussion */}
        <div className="border-t border-gray-200 pt-4">
          <div className="space-y-3">
            {replyToMember && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-purple-800">
                    Replying to <strong>{replyToMember}</strong>
                  </span>
                  <button
                    onClick={() => setReplyToMember('')}
                    className="text-purple-600 hover:text-purple-800 text-xs"
                  >
                    Cancel Reply
                  </button>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2">
                <textarea
                  value={discussionMessage}
                  onChange={(e) => setDiscussionMessage(e.target.value)}
                  rows={3}
                  className="input-field"
                  placeholder={replyToMember 
                    ? `Reply to ${replyToMember}...` 
                    : "Add your thoughts, questions, or comments for other board members..."
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address to:
                </label>
                <select
                  value={replyToMember}
                  onChange={(e) => setReplyToMember(e.target.value)}
                  className="input-field mb-2"
                >
                  <option value="">All Board Members</option>
                  {boardMembers
                    .filter(member => member.id !== currentUser?.id)
                    .map((member) => (
                      <option key={member.id} value={member.name}>
                        {member.name} ({member.boardMemberData?.position.replace('_', ' ')})
                      </option>
                    ))}
                </select>
                <button
                  onClick={handleAddDiscussion}
                  disabled={!discussionMessage.trim()}
                  className="w-full btn-primary disabled:opacity-50"
                >
                  {replyToMember ? 'Send Reply' : 'Add Comment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderVoteTab = () => (
    <div className="space-y-6">
      {/* Voting Progress */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Voting Progress</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.approve}</div>
            <div className="text-sm text-gray-500">Approve</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{stats.reject}</div>
            <div className="text-sm text-gray-500">Reject</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-sm text-gray-500">Pending</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
          <div 
            className="bg-primary-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${((stats.total - stats.pending) / stats.total) * 100}%` }}
          ></div>
        </div>

        {/* Board Member Status */}
        <div className="space-y-2">
          {boardMembers.map((member) => {
            const memberVote = liveRequest.boardVotes?.find(v => v.boardMemberId === member.id);
            return (
              <div key={member.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">{member.name}</span>
                  <span className="text-xs text-gray-500 capitalize">
                    ({member.boardMemberData?.position.replace('_', ' ')})
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  {memberVote ? (
                    <>
                      <span className={`status-badge ${
                        memberVote.vote === 'approve' ? 'status-approved' : 'status-rejected'
                      }`}>
                        {memberVote.vote.toUpperCase()}
                      </span>
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    </>
                  ) : (
                    <span className="status-badge status-pending">Pending</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {hasVoted && !canChangeVote ? (
        /* Already Voted - Cannot Change */
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-green-900 mb-2">Vote Submitted</h3>
          <p className="text-green-700 mb-2">
            You voted: <strong>{currentUserVote?.vote.toUpperCase()}</strong>
          </p>
          {currentUserVote?.comments && (
            <p className="text-sm text-green-600 italic">"{currentUserVote.comments}"</p>
          )}
          <p className="text-xs text-green-600 mt-2">
            Digitally signed: {currentUserVote?.digitalSignature?.signatureData}
          </p>
          <p className="text-xs text-green-600">
            {new Date(currentUserVote?.submittedAt || '').toLocaleString()}
          </p>
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
            <p className="text-sm text-blue-800">
              Voting is complete. Your vote cannot be changed after majority decision is reached.
            </p>
          </div>
        </div>
      ) : hasVoted && canChangeVote ? (
        /* Already Voted - Can Change */
        <div className="space-y-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <AlertTriangle className="w-12 h-12 text-yellow-600 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-yellow-900 mb-2">Vote Previously Submitted</h3>
            <p className="text-yellow-700 mb-2">
              You voted: <strong>{currentUserVote?.vote.toUpperCase()}</strong>
            </p>
            {currentUserVote?.comments && (
              <p className="text-sm text-yellow-600 italic">"{currentUserVote.comments}"</p>
            )}
            <p className="text-xs text-yellow-600 mt-2">
              Signed: {currentUserVote?.digitalSignature?.signatureData} • {new Date(currentUserVote?.submittedAt || '').toLocaleString()}
            </p>
            <div className="mt-4">
              <button
                onClick={handleChangeVote}
                className="btn-secondary"
              >
                Change My Vote
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Voting Interface */
        <div className="space-y-6">
          {/* Appeal Context for Appeal Reviews */}
          {liveRequest.status === 'appeal_review' && liveRequest.appealData && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h4 className="font-medium text-orange-900 mb-2 flex items-center">
                <AlertTriangle className="w-4 h-4 mr-2" />
                Appeal Reconsideration
              </h4>
              <p className="text-sm text-orange-800 mb-3">
                This request was previously rejected. The homeowner has submitted an appeal for your reconsideration.
              </p>
              <div className="bg-white border border-orange-200 rounded p-3">
                <p className="text-sm text-gray-800">
                  <strong>Appeal Reason:</strong> {liveRequest.appealData.reason}
                </p>
                {liveRequest.appealData.additionalInfo && (
                  <p className="text-sm text-gray-700 mt-2">
                    <strong>Additional Info:</strong> {liveRequest.appealData.additionalInfo}
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {liveRequest.status === 'appeal_review' ? 'Cast Your Appeal Vote' : 'Cast Your Vote'}
            </h3>
          
          {/* Vote Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <button
              onClick={() => setVoteChoice('approve')}
              className={`p-6 border-2 rounded-lg text-center transition-all ${
                voteChoice === 'approve'
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-green-300'
              }`}
            >
              <ThumbsUp className={`w-10 h-10 mx-auto mb-3 ${
                voteChoice === 'approve' ? 'text-green-600' : 'text-gray-400'
              }`} />
              <h4 className="font-medium text-gray-900 text-lg">Approve</h4>
              <p className="text-sm text-gray-500">Support this request</p>
            </button>

            <button
              onClick={() => setVoteChoice('reject')}
              className={`p-6 border-2 rounded-lg text-center transition-all ${
                voteChoice === 'reject'
                  ? 'border-red-500 bg-red-50'
                  : 'border-gray-200 hover:border-red-300'
              }`}
            >
              <ThumbsDown className={`w-10 h-10 mx-auto mb-3 ${
                voteChoice === 'reject' ? 'text-red-600' : 'text-gray-400'
              }`} />
              <h4 className="font-medium text-gray-900 text-lg">Reject</h4>
              <p className="text-sm text-gray-500">Oppose this request</p>
            </button>
          </div>

          {/* Vote Comments */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Comments (Optional)
            </label>
            <textarea
              value={voteComments}
              onChange={(e) => setVoteComments(e.target.value)}
              rows={3}
              className="input-field"
              placeholder="Add any comments about your vote decision..."
            />
          </div>

          {/* Submit Vote */}
          <button
            onClick={handleSubmitVote}
            disabled={!voteChoice}
            className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            <PenTool className="w-5 h-5" />
            <span>Submit Vote with Digital Signature</span>
          </button>
          </div>
        </div>
      )}

      {/* Legal Notice */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex">
          <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5" />
          <div className="ml-3">
            <h4 className="text-sm font-medium text-yellow-800">
              Legal Notice
            </h4>
            <p className="text-sm text-yellow-700 mt-1">
              Your digital signature will be legally binding and compliant with HOA CC&R requirements. 
              This vote will be permanently recorded in the community records.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const tabs = [
    { id: 'details', name: 'Request Details', icon: FileText },
    { id: 'discussion', name: 'Board Discussion', icon: MessageSquare },
    { id: 'vote', name: 'Cast Vote', icon: Vote }
  ];

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white min-h-[80vh]">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {liveRequest.status === 'appeal_review' ? 'Appeal Review - ' : 'Board Voting - '}{liveRequest.title}
            </h2>
            <p className="text-gray-600">
              {liveRequest.status === 'appeal_review' 
                ? 'Appeal Reconsideration • ' 
                : ''
              }{currentUser?.boardMemberData?.position.replace('_', ' ').toUpperCase()} • Rancho Madrina Community
            </p>
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

        {/* Voting Status Banner */}
        <div className={`rounded-lg p-4 mb-6 ${
          hasVoted ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'
        }`}>
          <div className="flex items-center">
            {hasVoted ? (
              <CheckCircle className="h-5 w-5 text-green-400" />
            ) : (
              <Clock className="h-5 w-5 text-yellow-400" />
            )}
            <div className="ml-3">
              <h4 className={`text-sm font-medium ${hasVoted ? 'text-green-800' : 'text-yellow-800'}`}>
                {hasVoted ? 'Vote Submitted' : 'Vote Required'}
              </h4>
              <p className={`text-sm mt-1 ${hasVoted ? 'text-green-700' : 'text-yellow-700'}`}>
                {hasVoted 
                  ? `You voted ${currentUserVote?.vote.toUpperCase()} on ${new Date(currentUserVote?.submittedAt || '').toLocaleDateString()}`
                  : `Board vote required for this ARC request. ${stats.pending} members still need to vote.`
                }
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setCurrentTab(tab.id as any)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    currentTab === tab.id
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.name}</span>
                  {tab.id === 'vote' && !hasVoted && (
                    <span className="bg-red-100 text-red-800 text-xs px-1 rounded-full">!</span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div>
          {currentTab === 'details' && renderDetailsTab()}
          {currentTab === 'discussion' && renderDiscussionTab()}
          {currentTab === 'vote' && renderVoteTab()}
        </div>

        {/* Digital Signature Modal */}
        {showSignatureModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-60">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Digital Signature Required</h3>
              
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Vote Summary:</strong><br />
                    {voteChoice.toUpperCase()} - {liveRequest.title}
                    {voteComments && <><br /><em>"{voteComments}"</em></>}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Digital Signature - Type Your Full Name
                  </label>
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={typedName}
                      onChange={(e) => setTypedName(e.target.value)}
                      className="input-field"
                      placeholder={`Type your full name: ${currentUser?.name}`}
                    />
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="flex items-start space-x-2">
                        <PenTool className="w-4 h-4 text-blue-600 mt-0.5" />
                        <div className="text-sm text-blue-800">
                          <p className="font-medium">Legal Digital Signature</p>
                          <p>By typing your full name, you confirm this vote is legally binding and compliant with HOA CC&R requirements, as well as state and local laws.</p>
                        </div>
                      </div>
                    </div>
                    
                    {typedName && (
                      <div className={`p-2 border rounded text-sm ${
                        typedName.toLowerCase() === currentUser?.name.toLowerCase()
                          ? 'bg-green-50 border-green-200 text-green-800'
                          : 'bg-red-50 border-red-200 text-red-800'
                      }`}>
                        {typedName.toLowerCase() === currentUser?.name.toLowerCase() ? (
                          <>✅ <strong>Name Verified:</strong> {typedName}</>
                        ) : (
                          <>❌ <strong>Name Mismatch:</strong> Please type "{currentUser?.name}" exactly</>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setShowSignatureModal(false);
                      setTypedName('');
                    }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSignVote}
                    disabled={!typedName || typedName.toLowerCase() !== currentUser?.name.toLowerCase()}
                    className="btn-success disabled:opacity-50"
                  >
                    Submit Signed Vote
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VotingInterface;
