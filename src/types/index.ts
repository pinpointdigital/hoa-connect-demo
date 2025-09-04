// Core Data Models for HOA Connect Demo

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'homeowner' | 'management' | 'board_member';
  phone?: string;
  avatar?: string;
  communityId: string;
  // Role-specific data
  homeownerData?: HomeownerData;
  managementData?: ManagementData;
  boardMemberData?: BoardMemberData;
  // Contact information for notifications
  contactInfo?: ContactInfo;
}

export interface ContactInfo {
  email: string;
  phone: string;
  address?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  preferredNotification: 'email' | 'sms' | 'both';
}

export interface HomeownerData {
  address: string;
  mailingAddress?: string;
  moveInDate: string;
  propertyType: string;
  lotNumber?: string;
  emergencyContact?: EmergencyContact;
}

export interface ManagementData {
  companyName: string;
  title: string;
  permissions: string[];
  managedCommunities: string[];
}

export interface BoardMemberData {
  position: 'president' | 'vice_president' | 'treasurer' | 'secretary' | 'member';
  termStart: string;
  termEnd: string;
  canManageUsers?: boolean; // Permission to manage board members
}

export interface EmergencyContact {
  name: string;
  phone: string;
  email?: string;
  relationship: string;
}

export interface Community {
  id: string;
  name: string;
  address: string;
  managementCompany: string;
  totalHomeowners: number;
  establishedDate: string;
  ccrs: CCRSection[];
  boardMembers: string[]; // User IDs
  managementStaff: string[]; // User IDs
}

export interface CCRSection {
  id: string;
  section: string;
  title: string;
  content: string;
  category: 'architectural' | 'landscaping' | 'parking' | 'pets' | 'noise' | 'other';
}

export interface Request {
  id: string;
  homeownerId: string;
  communityId: string;
  type: RequestType;
  title: string;
  description: string;
  status: RequestStatus;
  priority: 'low' | 'medium' | 'high';
  submittedAt: string;
  updatedAt: string;
  completedAt?: string;
  
  // Enhanced ARC fields
  lotNumber?: string;
  attachmentTypes?: string[];
  appealData?: {
    reason: string;
    additionalInfo?: string;
    submittedAt: string;
    submittedBy: string;
  };
  
  // Request details
  photos: Photo[];
  documents: Document[];
  
  // Workflow tracking
  workflowSteps: WorkflowStep[];
  currentStep: string;
  
  // Approvals
  neighborApprovals: NeighborApproval[];
  boardVotes: BoardVote[];
  managementReview?: ManagementReview;
  
  // CC&R Review
  ccrsReviewed?: boolean;
  ccrsConfirmedSections?: string[];
  
  // HOA Manager selections (added during review process)
  governingDocsReferences?: string[];
  requiredForms?: string[];
  requestInfoMessage?: string;
  
  // Timeline
  timeline: TimelineEvent[];
}

export type RequestType = 
  | 'exterior_modification'
  | 'landscaping'
  | 'architectural_change'
  | 'adu_jadu'
  | 'maintenance_request'
  | 'violation_report'
  | 'other';

export type RequestStatus = 
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'homeowner_reply_needed'
  | 'disapproved_arc'
  | 'board_voting'
  | 'disapproved_board'
  | 'appeal'
  | 'in_progress'
  | 'pending_inspection'
  | 'correction_needed'
  | 'completed'
  | 'cc_r_review'  // Legacy status for backward compatibility
  | 'neighbor_approval'  // Legacy status for backward compatibility
  | 'board_review'  // Legacy status for backward compatibility
  | 'approved'  // Legacy status for backward compatibility
  | 'rejected'  // Legacy status for backward compatibility
  | 'appeal_requested'  // Legacy status for backward compatibility
  | 'appeal_review'  // Legacy status for backward compatibility
  | 'cancelled';

export interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  assignedTo?: string;
  dueDate?: string;
  completedAt?: string;
  completedBy?: string;
}

export interface NeighborApproval {
  id: string;
  neighborId: string;
  neighborAddress: string;
  status: 'pending' | 'approved' | 'rejected';
  comments?: string;
  submittedAt?: string;
  signature?: string;
}

export interface BoardVote {
  id: string;
  boardMemberId: string;
  vote: 'approve' | 'reject' | 'abstain';
  comments?: string;
  submittedAt?: string;
  digitalSignature?: DigitalSignature;
}

export interface ManagementReview {
  reviewerId: string;
  status: 'pending' | 'approved' | 'rejected' | 'needs_info';
  comments?: string;
  ccrsReferences: string[]; // CCR Section IDs
  recommendation?: 'approve' | 'reject';
  reviewedAt?: string;
}

export interface TimelineEvent {
  id: string;
  timestamp: string;
  type: 'submitted' | 'reviewed' | 'approved' | 'rejected' | 'updated' | 'comment' | 'system' | 'management';
  userId: string;
  userName: string;
  description: string;
  metadata?: Record<string, any>;
}

export interface Photo {
  id: string;
  url: string;
  caption?: string;
  uploadedAt: string;
  uploadedBy: string;
  type: 'before' | 'after' | 'reference' | 'other';
}

export interface Document {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedAt: string;
  uploadedBy: string;
}

export interface Form {
  id: string;
  name: string;
  description: string;
  type: 'owner_notice_disclosure' | 'annual_report' | 'election_ballot' | 'assessment_notice' | 'other';
  fields: FormField[];
  requiredSignature: boolean;
  dueDate?: string;
  distributedAt?: string;
  distributedBy?: string;
  communityId: string;
}

export interface FormField {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'email' | 'phone' | 'address' | 'select' | 'checkbox' | 'textarea' | 'date';
  required: boolean;
  options?: string[]; // for select fields
  defaultValue?: string;
  validation?: ValidationRule[];
}

export interface ValidationRule {
  type: 'required' | 'email' | 'phone' | 'minLength' | 'maxLength' | 'pattern';
  value?: any;
  message: string;
}

export interface FormSubmission {
  id: string;
  formId: string;
  homeownerId: string;
  status: 'draft' | 'submitted' | 'reviewed' | 'approved';
  data: Record<string, any>;
  submittedAt?: string;
  digitalSignature?: DigitalSignature;
}

export interface DigitalSignature {
  id: string;
  signatureData: string; // Base64 encoded signature image
  signedBy: string;
  signedAt: string;
  ipAddress: string;
  userAgent: string;
  verified: boolean;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'request_submitted' | 'approval_needed' | 'vote_required' | 'form_due' | 'deadline_approaching' | 'decision_made';
  title: string;
  message: string;
  status: 'unread' | 'read' | 'dismissed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
  readAt?: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
}

export interface Vendor {
  id: string;
  name: string;
  category: 'landscaping' | 'maintenance' | 'construction' | 'cleaning' | 'security' | 'other';
  contact: {
    phone: string;
    email: string;
    website?: string;
  };
  address: string;
  rating: number;
  reviewCount: number;
  approved: boolean;
  approvedBy?: string;
  approvedAt?: string;
  services: string[];
  insurance: {
    liability: boolean;
    bonded: boolean;
    workersComp: boolean;
    expirationDate?: string;
  };
}

// Socket.io Event Types
export interface SocketEvents {
  // Request events
  'request:submitted': Request;
  'request:updated': Request;
  'request:approved': Request;
  'request:rejected': Request;
  
  // Approval events
  'neighbor:approval': { requestId: string; approval: NeighborApproval };
  'board:vote': { requestId: string; vote: BoardVote };
  
  // Notification events
  'notification:new': Notification;
  'notification:read': { notificationId: string };
  
  // Form events
  'form:distributed': { formId: string; recipientCount: number };
  'form:submitted': FormSubmission;
  
  // User events
  'user:online': { userId: string };
  'user:offline': { userId: string };
  
  // Demo events
  'demo:requests-updated': Request[];
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Demo-specific types
export interface DemoState {
  currentStep: number;
  totalSteps: number;
  activeUsers: User[];
  currentRequest?: Request;
  currentForm?: Form;
  resetAvailable: boolean;
}

export interface DemoScenario {
  id: string;
  name: string;
  description: string;
  steps: DemoStep[];
  duration: number; // in minutes
}

export interface DemoStep {
  id: string;
  title: string;
  description: string;
  userRole: 'homeowner' | 'management' | 'board_member';
  actions: DemoAction[];
  expectedOutcome: string;
}

export interface DemoAction {
  type: 'click' | 'input' | 'upload' | 'navigate' | 'wait';
  target?: string;
  value?: any;
  description: string;
}
