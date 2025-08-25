import React, { useState } from 'react';
import { Request, RequestStatus, TimelineEvent } from '../../types';
import { 
  X, 
  FileText, 
  Users, 
  MessageSquare,
  CheckCircle,
  UserPlus,
  MapPin,
  Download,
  Play,
  ThumbsUp,
  ThumbsDown,
  ExternalLink,
  Plus,
  Search,
  Eye,
  EyeOff,
  Home,
  History
} from 'lucide-react';
import jsPDF from 'jspdf';
import { getUserById } from '../../data/mockData';

interface RequestReviewProps {
  request: Request;
  onClose: () => void;
  onApprove: (request: Request) => void;
  onReject: (request: Request) => void;
}

// AI suggestion generator based on request content
const generateAISuggestions = (request: Request) => {
  const suggestions = [];
  const title = request.title?.toLowerCase() || '';
  const description = request.description?.toLowerCase() || '';
  const type = request.type || '';
  
  // Analyze request content for relevant governing documents
  if (type === 'exterior_modification' || title.includes('paint') || title.includes('color') || description.includes('paint') || description.includes('color')) {
    suggestions.push({
      id: 'ccr-4-2',
      title: 'Section 4.2 - Exterior Color Guidelines',
      confidence: 95,
      reason: 'Request involves changing exterior paint color',
      content: 'All exterior surfaces must be painted in earth tones approved by the ARC...'
    });
  }
  
  if (type === 'exterior_modification' || type === 'landscaping' || type === 'architectural_change') {
    suggestions.push({
      id: 'ccr-4-1',
      title: 'Section 4.1 - Architectural Modifications',
      confidence: 88,
      reason: 'Standard ARC review requirement',
      content: 'All exterior modifications require ARC approval...'
    });
  }
  
  if (title.includes('maintenance') || description.includes('maintenance') || description.includes('repair')) {
    suggestions.push({
      id: 'ccr-3-5',
      title: 'Section 3.5 - Property Maintenance Standards',
      confidence: 72,
      reason: 'Related to property appearance standards',
      content: 'Homeowners must maintain their property in good condition...'
    });
  }
  
  return suggestions;
};

// Status display helper
const getStatusDisplay = (status: RequestStatus) => {
  const statusMap: Record<string, { label: string; color: string; icon: string }> = {
    'draft': { label: 'Draft', color: 'bg-gray-100 text-gray-800', icon: '📄' },
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
    'appeal_requested': { label: 'Appeal', color: 'bg-indigo-100 text-indigo-800', icon: '⚖️' },
    'appeal_review': { label: 'Appeal', color: 'bg-indigo-100 text-indigo-800', icon: '⚖️' },
    'cancelled': { label: 'Cancelled', color: 'bg-gray-100 text-gray-800', icon: '🚫' }
  };
  
  return statusMap[status] || statusMap['submitted'];
};

const RequestReview: React.FC<RequestReviewProps> = ({ request, onClose, onApprove, onReject }) => {
  const [activeTab, setActiveTab] = useState<'details' | 'property' | 'governing-docs' | 'forms' | 'neighbors' | 'actions' | 'activity'>('details');
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showRequestInfoModal, setShowRequestInfoModal] = useState(false);
  const [showAddTeamModal, setShowAddTeamModal] = useState(false);
  const [managementRecommendation, setManagementRecommendation] = useState('');
  const [selectedGoverningDocs, setSelectedGoverningDocs] = useState<string[]>([]);
  const [selectedForms, setSelectedForms] = useState<string[]>([]);
  const [includeCompletedForms, setIncludeCompletedForms] = useState(true);
  const [requestInfoMessage, setRequestInfoMessage] = useState('');
  const [teamMemberSearch, setTeamMemberSearch] = useState('');
  const [teamMemberDetails, setTeamMemberDetails] = useState('');
  const [selectedNeighbors, setSelectedNeighbors] = useState<string[]>([]);
  const [newNeighborAddress, setNewNeighborAddress] = useState('');
  const [newNeighborName, setNewNeighborName] = useState('');
  const [newNeighborPosition, setNewNeighborPosition] = useState('');

  // Get current status display
  const statusDisplay = getStatusDisplay(request.status);
  const isNewSubmission = request.status === 'submitted' || request.status === 'cc_r_review';
  
  // Determine if we should show last updated (only after review has started)
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
  
  const lastActionDetails = getLastActionDetails();

  // AI-suggested governing docs (dynamically generated based on request content)
  const aiSuggestedDocs = generateAISuggestions(request);

  // Mock available forms
  const availableForms = [
    { id: 'neighbor-notification', name: 'Neighbor Notification Form', required: false },
    { id: 'contractor-info', name: 'Contractor Information Form', required: false },
    { id: 'timeline-schedule', name: 'Project Timeline & Schedule', required: false },
    { id: 'material-specs', name: 'Material Specifications Form', required: false },
    { id: 'insurance-cert', name: 'Insurance Certificate Request', required: false }
  ];

  // Mock neighbors data
  const suggestedNeighbors = [
    {
      id: 'robert-thompson',
      name: 'Robert & Mary Thompson',
      address: '121 Oak Street',
      position: 'Left Adjacent',
      autoIdentified: true,
      included: selectedNeighbors.includes('robert-thompson')
    },
    {
      id: 'james-davis', 
      name: 'James & Susan Davis',
      address: '125 Oak Street',
      position: 'Right Adjacent',
      autoIdentified: true,
      included: selectedNeighbors.includes('james-davis')
    },
    {
      id: 'carlos-gonzalez',
      name: 'Carlos Gonzalez',
      address: '124 Maple Street', 
      position: 'Rear Adjacent',
      autoIdentified: true,
      included: selectedNeighbors.includes('carlos-gonzalez')
    }
  ];

  // Mock team members
  const teamMembers = [
    { id: 'sarah-johnson', name: 'Sarah Johnson', role: 'Senior Property Manager' },
    { id: 'mike-chen', name: 'Mike Chen', role: 'Compliance Specialist' },
    { id: 'lisa-rodriguez', name: 'Lisa Rodriguez', role: 'ARC Coordinator' }
  ];

  // Convert timeline events to activity log format
  const activityLog = request.timeline.map(event => ({
    id: event.id,
    timestamp: event.timestamp,
    type: event.type,
    actor: event.userName,
    action: event.description,
    details: event.metadata?.details || '',
    isPublic: event.type !== 'system' && event.metadata?.isPublic !== false
  }));

  // Helper function to create timeline events
  const createTimelineEvent = (
    type: TimelineEvent['type'],
    description: string,
    details?: string,
    isPublic: boolean = true
  ): TimelineEvent => ({
    id: `timeline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    type,
    userId: 'allan-chua', // In real app, get from current user
    userName: 'Allan Chua',
    description,
    metadata: {
      details,
      isPublic
    }
  });

  const handleStartReview = () => {
    // Create timeline event for starting review
    const reviewEvent = createTimelineEvent(
      'management',
      'Started management review',
      'Initial review begun, checking compliance requirements'
    );

    // Update request status to under_review and add timeline event
    const updatedRequest = {
      ...request,
      status: 'under_review' as RequestStatus,
      updatedAt: new Date().toISOString(),
      timeline: [...request.timeline, reviewEvent]
    };
    onApprove(updatedRequest);
  };

  const handleApproveAndForward = () => {
    // Create timeline event for approval and forwarding to board
    const approvalEvent = createTimelineEvent(
      'management',
      'Approved and forwarded to Board of Directors',
      `Management recommendation: ${managementRecommendation || 'Approved for board review'}`
    );

    // Create neighbor approvals for selected neighbors
    const neighborApprovals = selectedNeighbors.map(neighborId => {
      const neighbor = suggestedNeighbors.find((n: any) => n.id === neighborId);
      return {
        id: `approval-${neighborId}-${Date.now()}`,
        neighborId,
        neighborAddress: neighbor?.address || 'Unknown Address',
        status: 'pending' as const,
        submittedAt: new Date().toISOString()
      };
    });

    const updatedRequest = {
      ...request,
      status: 'board_voting' as RequestStatus,
      updatedAt: new Date().toISOString(),
      managementRecommendation,
      governingDocsReferences: selectedGoverningDocs,
      requiredForms: selectedForms,
      neighborApprovals: [...(request.neighborApprovals || []), ...neighborApprovals],
      includeCompletedForms,
      timeline: [...request.timeline, approvalEvent]
    };
    onApprove(updatedRequest);
    setShowApprovalModal(false);
  };

  const handleRequestMoreInfo = () => {
    // Create timeline event for requesting more info
    const requestInfoEvent = createTimelineEvent(
      'management',
      'Requested additional information from homeowner',
      requestInfoMessage || 'HOA Manager requested additional information and documentation'
    );

    // Create neighbor approvals for selected neighbors
    const neighborApprovals = selectedNeighbors.map(neighborId => {
      const neighbor = suggestedNeighbors.find((n: any) => n.id === neighborId);
      return {
        id: `approval-${neighborId}-${Date.now()}`,
        neighborId,
        neighborAddress: neighbor?.address || 'Unknown Address',
        status: 'pending' as const,
        submittedAt: new Date().toISOString()
      };
    });

    const updatedRequest = {
      ...request,
      status: 'homeowner_reply_needed' as RequestStatus,
      updatedAt: new Date().toISOString(),
      requestInfoMessage,
      governingDocsReferences: selectedGoverningDocs,
      requiredForms: selectedForms,
      neighborApprovals: [...(request.neighborApprovals || []), ...neighborApprovals],
      timeline: [...request.timeline, requestInfoEvent]
    };
    onApprove(updatedRequest);
    setShowRequestInfoModal(false);
  };

  const handleNeighborToggle = (neighborId: string) => {
    setSelectedNeighbors(prev => 
      prev.includes(neighborId) 
        ? prev.filter(id => id !== neighborId)
        : [...prev, neighborId]
    );
  };

  const handleAddManualNeighbor = () => {
    if (newNeighborAddress && newNeighborName && newNeighborPosition) {
      // In a real app, this would add to the database
      console.log('Adding manual neighbor:', { 
        address: newNeighborAddress, 
        name: newNeighborName, 
        position: newNeighborPosition 
      });
      setNewNeighborAddress('');
      setNewNeighborName('');
      setNewNeighborPosition('');
    }
  };

  const openGoogleMaps = (address: string) => {
    const encodedAddress = encodeURIComponent(address);
    window.open(`https://www.google.com/maps/search/${encodedAddress}`, '_blank');
  };

  const handleDownloadSamplePDF = () => {
    try {
      // Load company data from localStorage
      const getCompanyData = () => {
        try {
          const raw = localStorage.getItem('hoa-company-profile');
          if (raw) return JSON.parse(raw);
        } catch {}
        return null;
      };
      
      const companyData = getCompanyData();
      
      // Create new PDF document with sample data
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      
      // All text will be black
      const textColor = '#000000';
      
      // Header Section - Company info on top left
      doc.setFontSize(11);
      doc.setTextColor(textColor);
      doc.setFont('helvetica', 'bold');
      doc.text('SEABREEZE MANAGEMENT COMPANY', 20, 20);
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text('Rancho Madrina Community Association', 20, 26);
      doc.text('123 Community Drive, Suite 200, Irvine, CA 92618', 20, 30);
      doc.text('Phone: (800) 232-7517', 20, 34);
      
      // Logo area on top right (rectangular) - Company Logo
      if (companyData?.logos?.rectangle) {
        // Use actual uploaded logo
        try {
          doc.addImage(companyData.logos.rectangle, 'PNG', pageWidth - 70, 15, 50, 20);
        } catch (error) {
          console.warn('Could not add logo image, using fallback text');
          // Fallback to text if image fails
          doc.setDrawColor(textColor);
          doc.setFillColor(240, 248, 255);
          doc.rect(pageWidth - 70, 15, 50, 20, 'FD');
          doc.setFontSize(7);
          doc.setFont('helvetica', 'bold');
          doc.text('SEABREEZE', pageWidth - 45, 22, { align: 'center' });
          doc.text('MANAGEMENT', pageWidth - 45, 27, { align: 'center' });
          doc.text('COMPANY', pageWidth - 45, 32, { align: 'center' });
        }
      } else {
        // Fallback to text logo if no image uploaded
        doc.setDrawColor(textColor);
        doc.setFillColor(240, 248, 255);
        doc.rect(pageWidth - 70, 15, 50, 20, 'FD');
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.text('SEABREEZE', pageWidth - 45, 22, { align: 'center' });
        doc.text('MANAGEMENT', pageWidth - 45, 27, { align: 'center' });
        doc.text('COMPANY', pageWidth - 45, 32, { align: 'center' });
      }
      
      // Title
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('RANCHO MADRINA HOMEOWNERS ASSOCIATION', pageWidth / 2, 50, { align: 'center' });
      doc.text('REQUEST FOR ARCHITECTURAL APPROVAL', pageWidth / 2, 58, { align: 'center' });
      
      // Add "SAMPLE" watermark
      doc.setFontSize(48);
      doc.setTextColor(200, 200, 200);
      doc.text('SAMPLE', pageWidth / 2, pageHeight / 2, { align: 'center', angle: 45 });
      doc.setTextColor(textColor);
      
      // Horizontal line
      doc.setLineWidth(0.5);
      doc.line(20, 65, pageWidth - 20, 65);
      
      let yPos = 75;
      
      // Sample Homeowner Information
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text('HOMEOWNER:', 20, yPos);
      doc.text('JOHN AND JANE SAMPLE', 65, yPos);
      doc.line(65, yPos + 1, 180, yPos + 1);
      yPos += 12;
      
      doc.text('ADDRESS:', 20, yPos);
      doc.text('456 SAMPLE STREET, IRVINE, CA 92618', 65, yPos);
      doc.text('LOT#', 140, yPos);
      doc.text('SAMPLE-001', 155, yPos);
      doc.line(65, yPos + 1, 135, yPos + 1);
      doc.line(155, yPos + 1, 180, yPos + 1);
      yPos += 15;
      
      // Sample Description
      doc.text('DESCRIPTION OF IMPROVEMENT:', 20, yPos);
      const description = 'SAMPLE PROJECT: INSTALL NEW FRONT YARD LANDSCAPING INCLUDING DROUGHT-RESISTANT PLANTS, DECORATIVE ROCKS, AND PATHWAY LIGHTING PER CC&R SECTION 5.1.';
      const splitDescription = doc.splitTextToSize(description, pageWidth - 25);
      doc.text(splitDescription, 20, yPos + 8);
      yPos += splitDescription.length * 4 + 15;
      
      // Sample Items Attached (marked as included)
      doc.text('ITEMS ATTACHED:', 20, yPos);
      yPos += 8;
      
      const attachments = ['Plot Plan', 'Rendering', 'Cross Section'];
      let xPos = 60;
      attachments.forEach((item, index) => {
        // Fill circles to show they're included
        doc.setFillColor(textColor);
        doc.circle(xPos + 5, yPos - 1, 3, 'F');
        doc.setFillColor(255, 255, 255);
        doc.text('✓', xPos + 3, yPos + 1);
        doc.text(item, xPos + 12, yPos);
        xPos += 50;
      });
      yPos += 15;
      
      // Rest of the form structure (abbreviated for sample)
      doc.setLineDashPattern([2, 2], 0);
      doc.line(20, yPos, pageWidth - 20, yPos);
      doc.setLineDashPattern([], 0);
      yPos += 10;
      
      // ARC Section with sample approval
      doc.setFont('helvetica', 'bold');
      doc.text('ARCHITECTURAL REVIEW COMMITTEE', pageWidth / 2, yPos, { align: 'center' });
      yPos += 15;
      
      doc.setFont('helvetica', 'normal');
      doc.text('APPROVED', 20, yPos);
      doc.text('✓ APPROVED', 50, yPos);
      doc.text('DISAPPROVED', 120, yPos);
      doc.text('_____________', 160, yPos);
      yPos += 12;
      
      doc.text('Condition of Approval/or Reason for Disapproval:', 20, yPos);
      yPos += 8;
      doc.text('Approved as submitted. Project complies with CC&R requirements.', 20, yPos);
      yPos += 20;
      
      // Sample signatures
      doc.text('ARC Member', 20, yPos);
      doc.text('Allan Chua', 20, yPos + 8);
      doc.text('ARC Member', 120, yPos);
      doc.text('Sarah Johnson', 120, yPos + 8);
      yPos += 20;
      
      doc.text('DATE:', 20, yPos);
      doc.text('07/15/2025', 35, yPos);
      doc.text('Signature:', 120, yPos);
      doc.text('A. Chua', 135, yPos);
      yPos += 8;
      doc.text('Architectural Review Committee', 120, yPos);
      yPos += 15;
      
      // Board approval section
      doc.setFont('helvetica', 'bold');
      doc.text('REQUEST FOR HEARING BEFORE BOARD OF DIRECTORS', pageWidth / 2, yPos, { align: 'center' });
      yPos += 12;
      
      doc.setFont('helvetica', 'normal');
      doc.text('PURPOSE:', 20, yPos);
      doc.text('To appeal decision of Architectural Review Committee', 60, yPos);
      yPos += 15;
      
      doc.text('APPROVED', 20, yPos);
      doc.text('✓ APPROVED', 50, yPos);
      doc.text('DISAPPROVED', 120, yPos);
      doc.text('________________', 160, yPos);
      yPos += 12;
      
      doc.text('Reason for Approval or Disapproval:', 20, yPos);
      yPos += 8;
      doc.text('Board concurs with ARC recommendation. Project approved.', 20, yPos);
      yPos += 20;
      
      doc.text('Date:', 20, yPos);
      doc.text('07/20/2025', 30, yPos);
      yPos += 8;
      doc.text('Signature:', 20, yPos);
      doc.text('Robert Ferguson', 35, yPos);
      doc.text('Board of Directors President', 125, yPos);
      yPos += 15;
      
      // Disclaimer
      doc.setFontSize(8);
      doc.text('This approval does not relieve applicant from obtaining the necessary building permits', 20, yPos);
      doc.text('from the governmental agencies involved.', 20, yPos + 6);
      
      // Save the sample PDF with proper filename format
      const submissionDate = new Date().toISOString().split('T')[0];
      const filename = `ARC-Application_John-and-Jane-Sample_456-Sample-Street_${submissionDate}_Sample.pdf`;
      doc.save(filename);
      
      // Show success message
      alert(`Sample ARC Application Form downloaded as ${filename}`);
      
    } catch (error) {
      console.error('Error generating sample PDF:', error);
      alert('Error generating sample PDF. Please try again.');
    }
  };

  const handleDownloadPDF = () => {
    try {
      // Load company data from localStorage
      const getCompanyData = () => {
        try {
          const raw = localStorage.getItem('hoa-company-profile');
          if (raw) return JSON.parse(raw);
        } catch {}
        return null;
      };
      
      const companyData = getCompanyData();
      
      // Create new PDF document
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      
      // All text will be black
      const textColor = '#000000';
      
      // Header Section - Company info on top left
      doc.setFontSize(11);
      doc.setTextColor(textColor);
      doc.setFont('helvetica', 'bold');
      doc.text('SEABREEZE MANAGEMENT COMPANY', 20, 20);
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text('Rancho Madrina Community Association', 20, 26);
      doc.text('123 Community Drive, Suite 200, Irvine, CA 92618', 20, 30);
      doc.text('Phone: (800) 232-7517', 20, 34);
      
      // Logo area on top right (rectangular) - Company Logo
      if (companyData?.logos?.rectangle) {
        // Use actual uploaded logo
        try {
          doc.addImage(companyData.logos.rectangle, 'PNG', pageWidth - 70, 15, 50, 20);
        } catch (error) {
          console.warn('Could not add logo image, using fallback text');
          // Fallback to text if image fails
          doc.setDrawColor(textColor);
          doc.setFillColor(240, 248, 255);
          doc.rect(pageWidth - 70, 15, 50, 20, 'FD');
          doc.setFontSize(7);
          doc.setFont('helvetica', 'bold');
          doc.text('SEABREEZE', pageWidth - 45, 22, { align: 'center' });
          doc.text('MANAGEMENT', pageWidth - 45, 27, { align: 'center' });
          doc.text('COMPANY', pageWidth - 45, 32, { align: 'center' });
        }
      } else {
        // Fallback to text logo if no image uploaded
        doc.setDrawColor(textColor);
        doc.setFillColor(240, 248, 255);
        doc.rect(pageWidth - 70, 15, 50, 20, 'FD');
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.text('SEABREEZE', pageWidth - 45, 22, { align: 'center' });
        doc.text('MANAGEMENT', pageWidth - 45, 27, { align: 'center' });
        doc.text('COMPANY', pageWidth - 45, 32, { align: 'center' });
      }
      
      // Title
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('RANCHO MADRINA HOMEOWNERS ASSOCIATION', pageWidth / 2, 50, { align: 'center' });
      doc.text('REQUEST FOR ARCHITECTURAL APPROVAL', pageWidth / 2, 58, { align: 'center' });
      
      // Horizontal line
      doc.setLineWidth(0.5);
      doc.line(20, 65, pageWidth - 20, 65);
      
      let yPos = 75;
      
      // Homeowner Information
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text('HOMEOWNER:', 20, yPos);
      doc.text('JASON ABUSTAN', 65, yPos);
      doc.line(65, yPos + 1, 180, yPos + 1);
      yPos += 12;
      
      doc.text('ADDRESS:', 20, yPos);
      doc.text('123 OAK STREET, IRVINE, CA 92618', 65, yPos);
      doc.text('LOT#', 140, yPos);
      doc.text('123-456-789', 155, yPos);
      doc.line(65, yPos + 1, 135, yPos + 1);
      doc.line(155, yPos + 1, 180, yPos + 1);
      yPos += 15;
      
      // Description
      doc.text('DESCRIPTION OF IMPROVEMENT:', 20, yPos);
      const description = 'PAINT FRONT PATIO - BEIGE TO SAGE GREEN. THE SAGE GREEN COLOR IS AN APPROVED EARTH TONE PER CC&R SECTION 4.2.';
      const splitDescription = doc.splitTextToSize(description, pageWidth - 25);
      doc.text(splitDescription, 20, yPos + 8);
      yPos += splitDescription.length * 4 + 15;
      
      // Items Attached
      doc.text('ITEMS ATTACHED:', 20, yPos);
      yPos += 8;
      
      // Attachment checkboxes
      const attachments = ['Plot Plan', 'Rendering', 'Cross Section'];
      let xPos = 60;
      attachments.forEach((item, index) => {
        doc.circle(xPos + 5, yPos - 1, 3);
        doc.text(item, xPos + 12, yPos);
        xPos += 50;
      });
      yPos += 15;
      
      // Dashed line
      doc.setLineDashPattern([2, 2], 0);
      doc.line(20, yPos, pageWidth - 20, yPos);
      doc.setLineDashPattern([], 0);
      yPos += 10;
      
      // ARC Section
      doc.setFont('helvetica', 'bold');
      doc.text('ARCHITECTURAL REVIEW COMMITTEE', pageWidth / 2, yPos, { align: 'center' });
      yPos += 15;
      
      doc.setFont('helvetica', 'normal');
      doc.text('APPROVED', 20, yPos);
      doc.text('_____________', 50, yPos);
      doc.text('DISAPPROVED', 120, yPos);
      doc.text('_____________', 160, yPos);
      yPos += 12;
      
      doc.text('Condition of Approval/or Reason for Disapproval:', 20, yPos);
      doc.line(20, yPos + 8, pageWidth - 20, yPos + 8);
      doc.line(20, yPos + 16, pageWidth - 20, yPos + 16);
      doc.line(20, yPos + 24, pageWidth - 20, yPos + 24);
      yPos += 35;
      
      // ARC Signatures
      doc.text('ARC Member', 20, yPos);
      doc.line(20, yPos + 8, 80, yPos + 8);
      doc.text('ARC Member', 120, yPos);
      doc.line(120, yPos + 8, 180, yPos + 8);
      yPos += 20;
      
      doc.text('DATE:', 20, yPos);
      doc.line(35, yPos + 1, 80, yPos + 1);
      doc.text('Signature:', 120, yPos);
      doc.line(135, yPos + 1, 180, yPos + 1);
      yPos += 8;
      doc.text('Architectural Review Committee', 120, yPos);
      yPos += 15;
      
      doc.text('Chairperson', 20, yPos);
      doc.line(20, yPos + 8, pageWidth - 20, yPos + 8);
      yPos += 20;
      
      // Board Section
      doc.setFont('helvetica', 'bold');
      doc.text('REQUEST FOR HEARING BEFORE BOARD OF DIRECTORS', pageWidth / 2, yPos, { align: 'center' });
      yPos += 12;
      
      doc.setFont('helvetica', 'normal');
      doc.text('PURPOSE:', 20, yPos);
      doc.text('To appeal decision of Architectural Review Committee', 60, yPos);
      yPos += 15;
      
      doc.text('APPROVED', 20, yPos);
      doc.text('________________', 50, yPos);
      doc.text('DISAPPROVED', 120, yPos);
      doc.text('________________', 160, yPos);
      yPos += 12;
      
      doc.text('Reason for Approval or Disapproval:', 20, yPos);
      doc.line(20, yPos + 8, pageWidth - 20, yPos + 8);
      doc.line(20, yPos + 16, pageWidth - 20, yPos + 16);
      doc.line(20, yPos + 24, pageWidth - 20, yPos + 24);
      yPos += 35;
      
      doc.text('Date:', 20, yPos);
      doc.line(30, yPos + 1, 80, yPos + 1);
      yPos += 8;
      doc.text('Signature:', 20, yPos);
      doc.line(35, yPos + 1, 120, yPos + 1);
      doc.text('Board of Directors President', 125, yPos);
      yPos += 15;
      
      // Disclaimer
      doc.setFontSize(8);
      doc.text('This approval does not relieve applicant from obtaining the necessary building permits', 20, yPos);
      doc.text('from the governmental agencies involved.', 20, yPos + 6);
      
      // Add second page for neighbor notification
      doc.addPage();
      yPos = 30;
      
      // Page 2 Header
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('EXHIBIT B', pageWidth / 2, yPos, { align: 'center' });
      yPos += 8;
      doc.text('RANCHO MADRINA HOMEOWNERS ASSOCIATION', pageWidth / 2, yPos, { align: 'center' });
      yPos += 6;
      doc.text('FACING, ADJACENT AND IMPACTED NEIGHBOR NOTIFICATION', pageWidth / 2, yPos, { align: 'center' });
      yPos += 6;
      doc.text('STATEMENT', pageWidth / 2, yPos, { align: 'center' });
      yPos += 15;
      
      doc.setFont('helvetica', 'normal');
      doc.text('The attached plans were made available to the following neighbors for review:', 20, yPos);
      yPos += 20;
      
      // Neighbor boxes layout
      const boxWidth = 70;
      const boxHeight = 40;
      
      // Top row - Impacted Neighbors
      doc.rect(20, yPos, boxWidth, boxHeight);
      doc.rect(pageWidth - 90, yPos, boxWidth, boxHeight);
      
      doc.setFontSize(8);
      doc.text('Impacted Neighbor', 25, yPos + 8);
      doc.text('Impacted Neighbor', pageWidth - 85, yPos + 8);
      
      doc.text('Name', 25, yPos + 15);
      doc.text('Name', pageWidth - 85, yPos + 15);
      doc.text('Address', 25, yPos + 22);
      doc.text('Address', pageWidth - 85, yPos + 22);
      doc.text('Signature', 25, yPos + 29);
      doc.text('Date', 60, yPos + 29);
      doc.text('Signature', pageWidth - 85, yPos + 29);
      doc.text('Date', pageWidth - 50, yPos + 29);
      
      yPos += boxHeight + 10;
      
      // Middle section with house diagram
      const houseX = pageWidth / 2 - 15;
      const houseY = yPos + 10;
      
      // Left neighbor
      doc.rect(20, yPos, boxWidth, boxHeight);
      doc.text('Adjacent Neighbor', 25, yPos + 8);
      doc.text('Name', 25, yPos + 15);
      doc.text('Address', 25, yPos + 22);
      doc.text('Signature', 25, yPos + 29);
      doc.text('Date', 60, yPos + 29);
      
      // House in center
      doc.rect(houseX, houseY, 30, 25);
      doc.setFont('helvetica', 'bold');
      doc.text('YOUR HOUSE', houseX + 15, houseY + 15, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      
      // Right neighbor
      doc.rect(pageWidth - 90, yPos, boxWidth, boxHeight);
      doc.text('Adjacent Neighbor', pageWidth - 85, yPos + 8);
      doc.text('Name', pageWidth - 85, yPos + 15);
      doc.text('Address', pageWidth - 85, yPos + 22);
      doc.text('Signature', pageWidth - 85, yPos + 29);
      doc.text('Date', pageWidth - 50, yPos + 29);
      
      yPos += boxHeight + 20;
      
      // Bottom row - Facing Neighbors
      const facingBoxWidth = 50;
      doc.rect(20, yPos, facingBoxWidth, boxHeight);
      doc.rect(85, yPos, facingBoxWidth, boxHeight);
      doc.rect(pageWidth - 70, yPos, facingBoxWidth, boxHeight);
      
      doc.text('Facing Neighbor', 25, yPos + 8);
      doc.text('Facing Neighbor', 90, yPos + 8);
      doc.text('Facing Neighbor', pageWidth - 65, yPos + 8);
      
      ['Name', 'Address', 'Signature'].forEach((label, index) => {
        const labelY = yPos + 15 + (index * 7);
        doc.text(label, 25, labelY);
        doc.text(label, 90, labelY);
        doc.text(label, pageWidth - 65, labelY);
      });
      
      doc.text('Date', 60, yPos + 36);
      doc.text('Date', 125, yPos + 36);
      doc.text('Date', pageWidth - 30, yPos + 36);
      
      yPos += boxHeight + 15;
      
      // Bottom text
      doc.setFontSize(7);
      doc.text('My neighbors have seen the plans I am submitting for Architectural Review Committee (ARC)', 20, yPos);
      doc.text('approval (see above verification). If any neighbor has a concern, they should notify Keystone', 20, yPos + 5);
      doc.text('Property Management in writing. Please note that neighbor objections do not in themselves cause', 20, yPos + 10);
      doc.text('denial of the plans, however, those concerns may be considered by the ARC.', 20, yPos + 15);
      yPos += 25;
      
      doc.text('SUBMITTED BY:', 20, yPos);
      doc.text('Name', 50, yPos);
      doc.line(60, yPos + 1, 120, yPos + 1);
      doc.text('Date', 130, yPos);
      doc.line(140, yPos + 1, 180, yPos + 1);
      yPos += 8;
      doc.text('Address', 20, yPos);
      doc.line(35, yPos + 1, pageWidth - 20, yPos + 1);
      
      // Add third page for maintenance and final inspection
      doc.addPage();
      yPos = 30;
      
      // Maintenance Disclaimer
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('MAINTENANCE DISCLAIMER', 20, yPos);
      yPos += 12;
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text('Installation to be at no cost whatsoever to the Association. Any further maintenance shall be the', 20, yPos);
      doc.text('responsibility of the homeowner, heirs or assigns.', 20, yPos + 6);
      yPos += 25;
      
      doc.line(20, yPos, 100, yPos);
      doc.text('07/29/2025', 120, yPos);
      yPos += 8;
      doc.text('HOMEOWNER\'S SIGNATURE', 20, yPos);
      doc.text('DATE', 120, yPos);
      yPos += 25;
      
      // ARC Committee Action
      doc.setFont('helvetica', 'bold');
      doc.text('RANCHO MADRINA ARCHITECTURAL REVIEW COMMITTEE ACTION:', 20, yPos);
      yPos += 15;
      
      doc.setFont('helvetica', 'normal');
      doc.text('_____', 20, yPos);
      doc.text('Returned for Additional Information', 35, yPos);
      yPos += 10;
      
      doc.text('Comments:', 35, yPos);
      doc.line(60, yPos + 1, pageWidth - 20, yPos + 1);
      yPos += 8;
      doc.line(35, yPos + 1, pageWidth - 20, yPos + 1);
      yPos += 15;
      
      doc.text('_____', 20, yPos);
      doc.text('Approved', 35, yPos);
      yPos += 10;
      
      doc.text('_____', 20, yPos);
      doc.text('Disapproved (Revise & Resubmit)', 35, yPos);
      yPos += 20;
      
      doc.line(20, yPos, 120, yPos);
      doc.line(130, yPos, pageWidth - 20, yPos);
      yPos += 8;
      doc.text('COMMITTEE CHAIRMAN', 20, yPos);
      doc.text('DATE', 130, yPos);
      yPos += 25;
      
      // Final Inspection
      doc.setFont('helvetica', 'bold');
      doc.text('FINAL INSPECTION', 20, yPos);
      yPos += 15;
      
      doc.setFont('helvetica', 'normal');
      doc.text('_____', 20, yPos);
      doc.text('Approved', 35, yPos);
      yPos += 10;
      
      doc.text('Comments:', 35, yPos);
      doc.line(60, yPos + 1, pageWidth - 20, yPos + 1);
      yPos += 8;
      doc.line(35, yPos + 1, pageWidth - 20, yPos + 1);
      yPos += 15;
      
      doc.text('_____', 20, yPos);
      doc.text('Disapproved', 35, yPos);
      yPos += 20;
      
      doc.line(20, yPos, 120, yPos);
      doc.line(130, yPos, pageWidth - 20, yPos);
      yPos += 8;
      doc.text('INSPECTOR SIGNATURE', 20, yPos);
      doc.text('DATE', 130, yPos);
      
      // Save the PDF with proper filename format
      const submissionDate = new Date(request.submittedAt).toISOString().split('T')[0];
      // Get actual homeowner data from the request
      const homeowner = getUserById(request.homeownerId);
      const homeownerName = homeowner?.name.replace(/\s+/g, '-') || 'Unknown-Homeowner';
      const addressLine1 = homeowner?.homeownerData?.address.split(',')[0].replace(/\s+/g, '-') || 'Unknown-Address';
      const filename = `ARC-Application_${homeownerName}_${addressLine1}_${submissionDate}.pdf`;
      doc.save(filename);
      
      // Show success message
      alert(`Official ARC Application Form downloaded as ${filename}`);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-4 mx-auto p-5 border w-11/12 max-w-6xl shadow-lg rounded-md bg-white min-h-[90vh]">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">ARC Application from {getUserById(request.homeownerId)?.name || 'Unknown Homeowner'}</h2>
            <p className="text-gray-600">{getUserById(request.homeownerId)?.homeownerData?.address || 'Address not available'}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Status and Action Banner */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-lg">{statusDisplay.icon}</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusDisplay.color}`}>
                  {statusDisplay.label}
                </span>
              </div>
              {showLastUpdated && lastActionDetails && (
                <div className="text-sm text-gray-600">
                  Last updated: {new Date(request.updatedAt || request.submittedAt).toLocaleString()} by {lastActionDetails.name} ({lastActionDetails.title})
                </div>
              )}
            </div>
            
            {isNewSubmission && (
              <button
                onClick={handleStartReview}
                className="flex items-center space-x-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Play className="w-4 h-4" />
                <span>Start Review</span>
              </button>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('details')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'details'
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
              <FileText className="w-4 h-4 inline mr-2" />
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
              <FileText className="w-4 h-4 inline mr-2" />
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
              onClick={() => setActiveTab('actions')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'actions'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <CheckCircle className="w-4 h-4 inline mr-2" />
              Actions
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
          </nav>
        </div>

        {/* Tab Content - Details */}
        {activeTab === 'details' && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{request.title}</h3>
                <p className="text-gray-600">Submitted by {getUserById(request.homeownerId)?.name || 'Unknown Homeowner'} • {new Date(request.submittedAt).toLocaleDateString()}</p>
              </div>
              <div className="flex space-x-2">
                <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">MEDIUM PRIORITY</span>
              </div>
            </div>

            <div className="mb-6">
              <h4 className="font-medium text-gray-900 mb-2">Description:</h4>
              <p className="text-gray-700">{request.description || 'No description provided'}</p>
            </div>

            <div className="mb-6">
              <h4 className="font-medium text-gray-900 mb-3">Included Attachments:</h4>
              {request.photos && request.photos.length > 0 ? (
                <div className="flex space-x-2">
                  {request.photos.map((photo, index) => (
                    <span key={index} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                      {photo.type?.toUpperCase() || `PHOTO ${index + 1}`}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 italic">No attachments were included with this request.</p>
              )}
            </div>

            {/* ARC Application Form - Only available after board approval */}
            {(request.status === 'in_progress' || request.status === 'pending_inspection' || request.status === 'correction_needed' || request.status === 'completed') ? (
              <div className="border border-green-200 bg-green-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Download className="w-4 h-4 text-green-600" />
                    <div>
                      <h4 className="font-medium text-gray-900">Download Official ARC Application Form</h4>
                      <p className="text-sm text-gray-600">
                        Complete approved form with all signatures and approvals - ready for final inspection
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={handleDownloadPDF}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Download PDF
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="border border-gray-200 bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Download className="w-4 h-4 text-gray-400" />
                      <div>
                        <h4 className="font-medium text-gray-500">ARC Application Form</h4>
                        <p className="text-sm text-gray-500">
                          Official form will be available after board approval
                        </p>
                      </div>
                    </div>
                    <button 
                      disabled
                      className="bg-gray-300 text-gray-500 px-4 py-2 rounded-lg cursor-not-allowed"
                    >
                      Not Available
                    </button>
                  </div>
                </div>
                
                {/* Sample Download - Always Available */}
                <div className="border border-blue-200 bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Download className="w-4 h-4 text-blue-600" />
                      <div>
                        <h4 className="font-medium text-gray-900">Download Sample ARC Application Form</h4>
                        <p className="text-sm text-gray-600">
                          View a sample form with demo data and attachments to see the final format
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={handleDownloadSamplePDF}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Download Sample
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab Content - Property Info */}
        {activeTab === 'property' && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Property Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Property Details */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Property Address</label>
                  <div className="flex items-center space-x-2">
                    <p className="text-gray-900">{getUserById(request.homeownerId)?.homeownerData?.address.split(',')[0] || 'Address not available'}</p>
                    <button
                      onClick={() => openGoogleMaps(getUserById(request.homeownerId)?.homeownerData?.address || '123 Oak Street, Rancho Madrina, CA')}
                      className="text-blue-600 hover:text-blue-800"
                      title="View on Google Maps"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-gray-600 text-sm">Rancho Madrina, CA 92618</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lot Number</label>
                  <p className="text-gray-900">45</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Property Type</label>
                  <p className="text-gray-900">Single Family Residence</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Square Footage</label>
                  <p className="text-gray-900">2,450 sq ft</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Year Built</label>
                  <p className="text-gray-900">2018</p>
                </div>
              </div>
              
              {/* Homeowner Details */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Primary Homeowner</label>
                  <p className="text-gray-900">{getUserById(request.homeownerId)?.name || 'Unknown Homeowner'}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <p className="text-gray-900">{getUserById(request.homeownerId)?.email || 'Email not available'}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <p className="text-gray-900">{getUserById(request.homeownerId)?.phone || 'Phone not available'}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Move-in Date</label>
                  <p className="text-gray-900">{getUserById(request.homeownerId)?.homeownerData?.moveInDate ? new Date(getUserById(request.homeownerId)!.homeownerData!.moveInDate).toLocaleDateString() : 'Date not available'}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">HOA Status</label>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Current
                  </span>
                </div>
              </div>
            </div>
            
            {/* Additional Property Information */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h4 className="text-md font-medium text-gray-900 mb-4">Additional Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Architectural Style</label>
                  <p className="text-gray-900">Mediterranean</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Exterior Color</label>
                  <p className="text-gray-900">Beige with White Trim</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Roof Material</label>
                  <p className="text-gray-900">Clay Tile</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content - Governing Docs */}
        {activeTab === 'governing-docs' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">AI-Suggested Governing Documents</h3>
              <p className="text-sm text-gray-600">AI analyzed the request and suggests these relevant sections</p>
            </div>
            
            {aiSuggestedDocs.map((doc) => (
              <div key={doc.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-medium text-gray-900">{doc.title}</h4>
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                        {doc.confidence}% confidence
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{doc.reason}</p>
                    <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded">{doc.content}</p>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => window.open('#', '_blank')}
                      className="text-primary-600 hover:text-primary-800 p-1"
                      title="Read full section"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                    
                    <label className="flex items-center space-x-1">
                      <input
                        type="checkbox"
                        checked={selectedGoverningDocs.includes(doc.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedGoverningDocs(prev => [...prev, doc.id]);
                          } else {
                            setSelectedGoverningDocs(prev => prev.filter(id => id !== doc.id));
                          }
                        }}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-700">Attach</span>
                    </label>
                    
                    <div className="flex space-x-1">
                      <button
                        className="text-green-600 hover:text-green-800 p-1"
                        title="Mark as relevant (helps train AI)"
                      >
                        <ThumbsUp className="w-4 h-4" />
                      </button>
                      <button
                        className="text-red-600 hover:text-red-800 p-1"
                        title="Mark as not relevant (helps train AI)"
                      >
                        <ThumbsDown className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab Content - Forms */}
        {activeTab === 'forms' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Additional Required Forms</h3>
              <p className="text-sm text-gray-600">Select forms that the homeowner must complete</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availableForms.map((form) => (
                <div key={form.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">{form.name}</h4>
                      <p className="text-sm text-gray-600">
                        {form.required ? 'Required for this request type' : 'Optional additional form'}
                      </p>
                    </div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedForms.includes(form.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedForms(prev => [...prev, form.id]);
                          } else {
                            setSelectedForms(prev => prev.filter(id => id !== form.id));
                          }
                        }}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab Content - Neighbors */}
        {activeTab === 'neighbors' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Neighbor Approval Requirements</h3>
              <p className="text-gray-600 mb-4">Select which neighbors need to provide approval for this request.</p>
              
              <div className="space-y-3">
                {suggestedNeighbors.map((neighbor) => (
                  <div key={neighbor.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={neighbor.included}
                            onChange={() => handleNeighborToggle(neighbor.id)}
                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          />
                        </label>
                        <div>
                          <h4 className="font-medium text-gray-900">{neighbor.name}</h4>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => openGoogleMaps(neighbor.address)}
                              className="text-primary-600 hover:text-primary-800 text-sm flex items-center space-x-1"
                            >
                              <MapPin className="w-3 h-3" />
                              <span>{neighbor.address}</span>
                            </button>
                            <span className="text-gray-400">•</span>
                            <span className="text-sm text-gray-600">{neighbor.position}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {neighbor.autoIdentified && (
                          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">Auto-identified</span>
                        )}
                        {neighbor.included && (
                          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Approval Required</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Manual Neighbor Addition */}
            <div className="border-t border-gray-200 pt-6">
              <h4 className="font-medium text-gray-900 mb-4">Add Additional Neighbor</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={newNeighborName}
                    onChange={(e) => setNewNeighborName(e.target.value)}
                    placeholder="John & Jane Smith"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <input
                    type="text"
                    value={newNeighborAddress}
                    onChange={(e) => setNewNeighborAddress(e.target.value)}
                    placeholder="127 Oak Street"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                  <select
                    value={newNeighborPosition}
                    onChange={(e) => setNewNeighborPosition(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Select position</option>
                    <option value="Left Adjacent">Left Adjacent</option>
                    <option value="Right Adjacent">Right Adjacent</option>
                    <option value="Rear Adjacent">Rear Adjacent</option>
                    <option value="Front Adjacent">Front Adjacent</option>
                    <option value="Diagonal">Diagonal</option>
                    <option value="Across Street">Across Street</option>
                  </select>
                </div>
              </div>
              <button
                onClick={handleAddManualNeighbor}
                disabled={!newNeighborName || !newNeighborAddress || !newNeighborPosition}
                className="mt-4 flex items-center space-x-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
                <span>Add Neighbor</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab Content - Actions */}
        {activeTab === 'actions' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Management Actions</h3>
            <p className="text-gray-600 mb-6">Choose the appropriate action for this request. Your decision will update the request status.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Request/Provide More Information */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <MessageSquare className="w-5 h-5 text-blue-500" />
                  <h4 className="font-medium text-gray-900">Request/Provide More Info</h4>
                </div>
                <p className="text-sm text-gray-600 mb-4">Request additional information or attachments from the homeowner</p>
                <button
                  onClick={() => setShowRequestInfoModal(true)}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Request Info
                </button>
              </div>

              {/* Approve and Send to Board */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <h4 className="font-medium text-gray-900">Approve & Send to Board</h4>
                </div>
                <p className="text-sm text-gray-600 mb-4">Approve request and forward to board for final decision</p>
                <button
                  onClick={() => setShowApprovalModal(true)}
                  className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Approve & Forward
                </button>
              </div>

              {/* Add Team Member */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <UserPlus className="w-5 h-5 text-purple-500" />
                  <h4 className="font-medium text-gray-900">Add Team Member</h4>
                </div>
                <p className="text-sm text-gray-600 mb-4">Invite a team member to collaborate on this request</p>
                <button
                  onClick={() => setShowAddTeamModal(true)}
                  className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Add Team Member
                </button>
              </div>
            </div>

            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Current Request Status:</h4>
              <div className="flex items-center space-x-2">
                <span className="text-lg">{statusDisplay.icon}</span>
                <span className={`px-2 py-1 rounded-full text-sm font-medium ${statusDisplay.color}`}>
                  {statusDisplay.label}
                </span>
                <span className="text-sm text-gray-700">- {isNewSubmission ? 'Awaiting your action' : 'In progress'}</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content - Activity Log */}
        {activeTab === 'activity' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Activity Log</h3>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Eye className="w-4 h-4" />
                <span>Public</span>
                <EyeOff className="w-4 h-4 ml-2" />
                <span>Internal</span>
              </div>
            </div>
            
            <div className="space-y-3">
              {activityLog.map((activity) => (
                <div key={activity.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium text-gray-900">{activity.actor}</span>
                        <span className="text-gray-600">{activity.action}</span>
                        {!activity.isPublic && (
                          <span title="Internal only">
                            <EyeOff className="w-4 h-4 text-gray-400" />
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-1">{activity.details}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(activity.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <div className={`w-3 h-3 rounded-full ${
                      activity.type === 'submitted' ? 'bg-blue-500' :
                      activity.type === 'management' ? 'bg-yellow-500' :
                      activity.type === 'system' ? 'bg-gray-400' :
                      activity.type === 'approved' ? 'bg-green-500' :
                      activity.type === 'rejected' ? 'bg-red-500' :
                      'bg-gray-500'
                    }`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Request More Info Modal */}
        {showRequestInfoModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Request/Provide More Information</h3>
                <button onClick={() => setShowRequestInfoModal(false)}>
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Message to Homeowner</label>
                  <textarea
                    value={requestInfoMessage}
                    onChange={(e) => setRequestInfoMessage(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Please provide additional information..."
                  />
                </div>
                
                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={selectedGoverningDocs.length > 0}
                      onChange={() => {}}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700">Attach selected governing documents ({selectedGoverningDocs.length})</span>
                  </label>
                </div>
                
                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={selectedForms.length > 0}
                      onChange={() => {}}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700">Include required forms ({selectedForms.length})</span>
                  </label>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowRequestInfoModal(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRequestMoreInfo}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Send Request
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Approve and Forward Modal */}
        {showApprovalModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Approve & Send to Board</h3>
                <button onClick={() => setShowApprovalModal(false)}>
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Management Recommendation</label>
                  <textarea
                    value={managementRecommendation}
                    onChange={(e) => setManagementRecommendation(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder="I recommend approval based on..."
                  />
                </div>
                
                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={selectedGoverningDocs.length > 0}
                      onChange={() => {}}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700">Attach governing documents ({selectedGoverningDocs.length})</span>
                  </label>
                </div>
                
                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={includeCompletedForms}
                      onChange={(e) => setIncludeCompletedForms(e.target.checked)}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700">Include completed forms</span>
                  </label>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowApprovalModal(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApproveAndForward}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Approve & Forward
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Team Member Modal */}
        {showAddTeamModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Add Team Member</h3>
                <button onClick={() => setShowAddTeamModal(false)}>
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Search Team Member</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={teamMemberSearch}
                      onChange={(e) => setTeamMemberSearch(e.target.value)}
                      placeholder="Search by name..."
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  
                  {teamMemberSearch && (
                    <div className="mt-2 border border-gray-200 rounded-md max-h-32 overflow-y-auto">
                      {teamMembers
                        .filter(member => member.name.toLowerCase().includes(teamMemberSearch.toLowerCase()))
                        .map(member => (
                          <button
                            key={member.id}
                            onClick={() => setTeamMemberSearch(member.name)}
                            className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                          >
                            <div className="font-medium text-gray-900">{member.name}</div>
                            <div className="text-sm text-gray-600">{member.role}</div>
                          </button>
                        ))
                      }
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Project Details</label>
                  <textarea
                    value={teamMemberDetails}
                    onChange={(e) => setTeamMemberDetails(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Provide context about this project..."
                  />
                </div>
                
                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={selectedGoverningDocs.length > 0}
                      onChange={() => {}}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700">Attach governing documents ({selectedGoverningDocs.length})</span>
                  </label>
                </div>
                
                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={includeCompletedForms}
                      onChange={(e) => setIncludeCompletedForms(e.target.checked)}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700">Include completed forms</span>
                  </label>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowAddTeamModal(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    console.log('Adding team member:', { search: teamMemberSearch, details: teamMemberDetails });
                    setShowAddTeamModal(false);
                  }}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Add Member
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RequestReview;