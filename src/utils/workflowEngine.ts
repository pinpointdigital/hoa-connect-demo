import { Request, RequestStatus, TimelineEvent } from '../types';

export interface WorkflowTransition {
  from: RequestStatus;
  to: RequestStatus;
  condition: (request: Request) => boolean;
  onTransition?: (request: Request) => Partial<Request>;
}

export class WorkflowEngine {
  private transitions: WorkflowTransition[] = [
    // submitted → cc_r_review (when management manually starts review)
    // This transition is now triggered manually via "Start Review Process" button

    // cc_r_review → neighbor_approval (when management approves for neighbor review)
    {
      from: 'cc_r_review',
      to: 'neighbor_approval',
      condition: (request) => {
        return !!(request.managementReview && 
                 request.managementReview.status === 'approved' &&
                 request.managementReview.recommendation === 'approve');
      },
      onTransition: (request) => ({
        timeline: [...request.timeline, {
          id: `timeline-${Date.now()}`,
          timestamp: new Date().toISOString(),
          type: 'system',
          userId: 'system',
          userName: 'System',
          description: 'Request approved by management - neighbor approval phase started'
        }]
      })
    },

    // neighbor_approval → board_review (when all required neighbors approve)
    {
      from: 'neighbor_approval',
      to: 'board_review',
      condition: (request) => {
        const approvals = request.neighborApprovals || [];
        const requiredApprovals = 3; // Based on your demo setup
        const approvedCount = approvals.filter(a => a.status === 'approved').length;
        return approvedCount >= requiredApprovals;
      },
      onTransition: (request) => ({
        currentStep: 'step-board-review',
        boardVotes: [], // Initialize empty board votes for new voting
        timeline: [...request.timeline, {
          id: `timeline-${Date.now()}`,
          timestamp: new Date().toISOString(),
          type: 'system',
          userId: 'system',
          userName: 'System',
          description: 'All required neighbor approvals received - forwarded to Board of Directors for voting'
        }]
      })
    },

    // board_review → approved/rejected (when majority vote reached)
    {
      from: 'board_review',
      to: 'approved', // This will be determined by the vote outcome
      condition: (request) => {
        const votes = request.boardVotes || [];
        const totalBoardMembers = 5; // Your 5-member board (Robert, Dean, Frank, David, Patricia)
        const majority = Math.ceil(totalBoardMembers / 2); // 3 votes needed for 5-member board
        
        const approveVotes = votes.filter(v => v.vote === 'approve').length;
        const rejectVotes = votes.filter(v => v.vote === 'reject').length;
        
        return approveVotes >= majority || rejectVotes >= majority;
      },
      onTransition: (request) => {
        const votes = request.boardVotes || [];
        const approveVotes = votes.filter(v => v.vote === 'approve').length;
        const rejectVotes = votes.filter(v => v.vote === 'reject').length;
        const finalStatus = approveVotes > rejectVotes ? 'approved' : 'rejected';
        
        return {
          status: finalStatus as RequestStatus,
          completedAt: new Date().toISOString(),
          timeline: [...request.timeline, {
            id: `timeline-${Date.now()}`,
            timestamp: new Date().toISOString(),
            type: finalStatus as any,
            userId: 'system',
            userName: 'System',
            description: `Board voting complete: ${finalStatus.toUpperCase()} - Final decision (${approveVotes} approve, ${rejectVotes} reject)`
          }]
        };
      }
    }
  ];

  /**
   * Process a request through the workflow engine
   * Returns updated request if a transition occurred, or original request if no transition
   */
  public processRequest(request: Request): Request {
    for (const transition of this.transitions) {
      if (request.status === transition.from && transition.condition(request)) {
        const updates = transition.onTransition?.(request) || {};
        
        const updatedRequest: Request = {
          ...request,
          ...updates,
          status: updates.status || transition.to,
          updatedAt: new Date().toISOString()
        };

        console.log(`Workflow: ${request.status} → ${updatedRequest.status} for request "${request.title}"`);
        return updatedRequest;
      }
    }

    return request; // No transition occurred
  }

  /**
   * Process multiple requests through workflow
   */
  public processRequests(requests: Request[]): Request[] {
    return requests.map(request => this.processRequest(request));
  }

  /**
   * Check if a request can progress to the next stage
   */
  public canProgress(request: Request): boolean {
    return this.transitions.some(t => 
      t.from === request.status && t.condition(request)
    );
  }

  /**
   * Get the next possible status for a request
   */
  public getNextStatus(request: Request): RequestStatus | null {
    const transition = this.transitions.find(t => 
      t.from === request.status && t.condition(request)
    );
    return transition ? transition.to : null;
  }

  /**
   * Manually start the review process for a submitted request
   */
  public startReviewProcess(request: Request): Request {
    if (request.status !== 'submitted') {
      throw new Error('Can only start review process for submitted requests');
    }

    return {
      ...request,
      status: 'cc_r_review',
      updatedAt: new Date().toISOString(),
      timeline: [...request.timeline, {
        id: `timeline-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'management',
        userId: 'allan-chua',
        userName: 'Allan Chua',
        description: 'Application review process started by HOA Management'
      }]
    };
  }

  /**
   * Get workflow progress percentage
   */
  public getProgressPercentage(request: Request): number {
    const statusOrder: RequestStatus[] = [
      'submitted', 'cc_r_review', 'neighbor_approval', 'board_review', 'approved', 'rejected'
    ];
    
    const currentIndex = statusOrder.indexOf(request.status);
    if (currentIndex === -1) return 0;
    
    // Completed states
    if (request.status === 'approved' || request.status === 'rejected') return 100;
    
    // Progress through workflow
    return Math.round((currentIndex / (statusOrder.length - 2)) * 100); // -2 for approved/rejected
  }
}

export const workflowEngine = new WorkflowEngine();
