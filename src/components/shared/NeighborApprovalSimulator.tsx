import React, { useState, useEffect } from 'react';
import { useDemoContext } from '../../contexts/DemoContext';
import { Request, NeighborApproval } from '../../types';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Mail,
  User,
  MapPin
} from 'lucide-react';

interface NeighborApprovalSimulatorProps {
  request: Request;
  onComplete?: () => void;
}

const NeighborApprovalSimulator: React.FC<NeighborApprovalSimulatorProps> = ({ 
  request, 
  onComplete 
}) => {
  const { updateRequest, addNotification } = useDemoContext();
  const [currentApprovals, setCurrentApprovals] = useState<NeighborApproval[]>(
    request.neighborApprovals || []
  );
  const [isSimulating, setIsSimulating] = useState(false);

  const neighbors = [
    { 
      id: 'neighbor-1', 
      name: 'Jennifer Lee', 
      address: '121 Oak Street', 
      position: 'Left',
      email: 'jennifer.lee@email.com'
    },
    { 
      id: 'neighbor-2', 
      name: 'Michael Chen', 
      address: '125 Oak Street', 
      position: 'Right',
      email: 'michael.chen@email.com'
    },
    { 
      id: 'neighbor-3', 
      name: 'Sarah Johnson', 
      address: '124 Maple Street', 
      position: 'Back',
      email: 'sarah.johnson@email.com'
    }
  ];

  const getApprovalStatus = (neighborId: string) => {
    const approval = currentApprovals.find(a => a.neighborId === neighborId);
    return approval?.status || 'pending';
  };

  const approvedCount = currentApprovals.filter(a => a.status === 'approved').length;
  const totalNeighbors = neighbors.length;

  const simulateNeighborApproval = async (neighborId: string, approve: boolean = true) => {
    const neighbor = neighbors.find(n => n.id === neighborId);
    if (!neighbor) return;

    const newApproval: NeighborApproval = {
      id: `approval-${Date.now()}`,
      neighborId,
      neighborAddress: neighbor.address,
      status: approve ? 'approved' : 'rejected',
      comments: approve ? 
        'I approve of this color change. Sage green will look great!' : 
        'I have concerns about this color choice.',
      submittedAt: new Date().toISOString(),
      signature: neighbor.name
    };

    const updatedApprovals = [
      ...currentApprovals.filter(a => a.neighborId !== neighborId),
      newApproval
    ];

    setCurrentApprovals(updatedApprovals);

    const updatedRequest = {
      ...request,
      neighborApprovals: updatedApprovals,
      timeline: [...request.timeline, {
        id: `timeline-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'comment' as const,
        userId: neighborId,
        userName: neighbor.name,
        description: `Neighbor ${approve ? 'approved' : 'rejected'} request: ${neighbor.name} (${neighbor.address})`
      }]
    };

    updateRequest(updatedRequest);
    addNotification(`📧 ${neighbor.name} ${approve ? 'approved' : 'rejected'} the request`);

    // Check if all neighbors have responded
    if (updatedApprovals.length === totalNeighbors) {
      const allApproved = updatedApprovals.every(a => a.status === 'approved');
      if (allApproved) {
        setTimeout(() => {
          addNotification(`✅ All neighbors approved! Moving to Board of Directors...`);
          onComplete?.();
        }, 1000);
      }
    }
  };

  const simulateAllApprovals = async () => {
    setIsSimulating(true);
    
    // Simulate approvals coming in over time
    for (let i = 0; i < neighbors.length; i++) {
      const neighbor = neighbors[i];
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay between approvals
      
      if (getApprovalStatus(neighbor.id) === 'pending') {
        await simulateNeighborApproval(neighbor.id, true);
      }
    }
    
    setIsSimulating(false);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-semibold text-gray-900">Neighbor Approval Progress</h4>
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700">
            {approvedCount}/{totalNeighbors} Approved
          </span>
          <div className="w-24 bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${(approvedCount / totalNeighbors) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Neighbor List */}
      <div className="space-y-3 mb-6">
        {neighbors.map((neighbor) => {
          const status = getApprovalStatus(neighbor.id);
          return (
            <div key={neighbor.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  {status === 'approved' && <CheckCircle className="w-5 h-5 text-green-500" />}
                  {status === 'rejected' && <XCircle className="w-5 h-5 text-red-500" />}
                  {status === 'pending' && <Clock className="w-5 h-5 text-yellow-500" />}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{neighbor.name}</p>
                  <p className="text-sm text-gray-500">{neighbor.address} ({neighbor.position})</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {status === 'pending' && (
                  <>
                    <button
                      onClick={() => simulateNeighborApproval(neighbor.id, false)}
                      className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                      disabled={isSimulating}
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => simulateNeighborApproval(neighbor.id, true)}
                      className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                      disabled={isSimulating}
                    >
                      Approve
                    </button>
                  </>
                )}
                {status !== 'pending' && (
                  <span className={`text-xs px-2 py-1 rounded ${
                    status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {status.toUpperCase()}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Demo Actions */}
      <div className="border-t border-gray-200 pt-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            <Mail className="w-4 h-4 inline mr-1" />
            Simulate neighbor email responses
          </div>
          
          <div className="flex space-x-2">
            {approvedCount < totalNeighbors && (
              <button
                onClick={simulateAllApprovals}
                disabled={isSimulating}
                className="btn-primary text-sm"
              >
                {isSimulating ? (
                  <>
                    <Clock className="w-4 h-4 mr-1 animate-spin" />
                    Simulating...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Simulate All Approvals
                  </>
                )}
              </button>
            )}
            
            {approvedCount === totalNeighbors && (
              <div className="flex items-center space-x-2 text-green-600">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">All Neighbors Approved!</span>
              </div>
            )}
          </div>
        </div>

        {/* Progress Summary */}
        {approvedCount > 0 && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Progress Update:</strong> {approvedCount} of {totalNeighbors} neighbors have responded. 
              {approvedCount === totalNeighbors ? (
                <span className="text-green-700 font-medium"> Ready for Board of Directors review!</span>
              ) : (
                <span> Waiting for {totalNeighbors - approvedCount} more response{totalNeighbors - approvedCount !== 1 ? 's' : ''}.</span>
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NeighborApprovalSimulator;



