import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useDemoContext } from '../../contexts/DemoContext';
import { Form, FormSubmission } from '../../types';
import { 
  FileText, 
  Send, 
  Users, 
  Clock,
  CheckCircle,
  AlertTriangle,
  Download,
  Mail,
  Smartphone,
  Calendar,
  BarChart,
  X,
  Plus,
  Edit,
  Eye,
  Megaphone,
  Bell,
  Settings,
  Copy,
  Archive,
  Upload,
  History,
  FileText as Template,
  PenTool
} from 'lucide-react';
import { OWNER_NOTICE_DISCLOSURE_FORM } from '../../data/mockData';

const FormsManagement: React.FC = () => {
  const { currentUser } = useAuth();
  const { addNotification } = useDemoContext();
  
  const [selectedForm, setSelectedForm] = useState<Form | null>(null);
  const [distributionSettings, setDistributionSettings] = useState({
    deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 10 days
    sendEmail: true,
    sendSMS: true,
    includeReminders: true
  });
  
  // State for reminder customization
  const [showReminderModal, setShowReminderModal] = useState<'notViewed' | 'pending' | null>(null);
  const [reminderSettings, setReminderSettings] = useState({
    sendEmail: true,
    sendSMS: true,
    emailSubject: '',
    emailMessage: '',
    smsMessage: ''
  });
  
  // State for form deadline (moved to main screen)
  const [formDeadline, setFormDeadline] = useState('');
  const [enableAutomatedReminders, setEnableAutomatedReminders] = useState(false);
  const [reminderSchedule, setReminderSchedule] = useState({
    firstReminder: 3, // days before deadline
    secondReminder: 1, // days before deadline
    finalReminder: 0  // on deadline day
  });
  
  // State for message log
  const [showMessageLog, setShowMessageLog] = useState(false);
  
  // Enhanced communications management state
  const [currentView, setCurrentView] = useState<'overview' | 'forms' | 'announcements' | 'create'>('overview');
  const [selectedCommunication, setSelectedCommunication] = useState<any>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [editorMode, setEditorMode] = useState<'create' | 'edit' | 'view'>('create');
  const [communicationType, setCommunicationType] = useState<'form' | 'announcement'>('form');
  
  // Mock communication history
  const communicationHistory = [
    {
      id: 'msg-001',
      timestamp: '2024-08-15T10:30:00Z',
      type: 'initial_distribution',
      method: 'Email + SMS',
      recipients: 847,
      subject: 'Owner Notice Disclosure Form - 2025 (Action Required)',
      status: 'delivered'
    },
    {
      id: 'msg-002',
      timestamp: '2024-08-18T14:15:00Z',
      type: 'reminder',
      method: 'Email',
      recipients: 623,
      subject: 'Reminder: Owner Notice Disclosure Form - 3 Days Remaining',
      status: 'delivered'
    },
    {
      id: 'msg-003',
      timestamp: '2024-08-20T09:00:00Z',
      type: 'reminder',
      method: 'SMS',
      recipients: 524,
      subject: 'Final Reminder: Complete your HOA form today',
      status: 'delivered'
    },
    {
      id: 'msg-004',
      timestamp: '2024-08-21T16:45:00Z',
      type: 'custom_reminder',
      method: 'Email + SMS',
      recipients: 89,
      subject: 'Please Complete Your Started Form',
      status: 'delivered'
    }
  ];

  // Simplified completion stats for old school HOA management
  const formStats = {
    total: 847,
    notified: 847,    // All homeowners have been notified
    completed: 234,   // Completed and digitally signed
    pending: 89,      // Viewed form but haven't signed yet
    notViewed: 524    // Haven't logged into dashboard to view form
  };

  const availableForms = [
    {
      ...OWNER_NOTICE_DISCLOSURE_FORM,
      lastDistributed: '2024-08-11',
      completionRate: 27.6,
      status: 'active',
      recipients: 847
    },
    {
      id: 'form-annual-election',
      name: 'Annual Board Election Ballot',
      description: 'Annual election ballot for board member positions',
      type: 'election_ballot' as const,
      fields: [],
      requiredSignature: true,
      communityId: 'rancho-madrina',
      lastDistributed: '2024-01-15',
      completionRate: 89.2,
      status: 'completed',
      recipients: 847
    },
    {
      id: 'form-assessment-notice',
      name: 'Special Assessment Notice',
      description: 'Notice of special assessment for community improvements',
      type: 'assessment_notice' as const,
      fields: [],
      requiredSignature: false,
      communityId: 'rancho-madrina',
      lastDistributed: '2024-06-01',
      completionRate: 76.4,
      status: 'completed',
      recipients: 847
    },
    {
      id: 'form-maintenance-survey',
      name: 'Community Maintenance Survey',
      description: 'Annual survey about community maintenance priorities',
      type: 'survey' as const,
      fields: [],
      requiredSignature: false,
      communityId: 'rancho-madrina',
      lastDistributed: null,
      completionRate: 0,
      status: 'draft',
      recipients: 0
    }
  ];

  // Communications in progress (current active communications)
  const communicationsInProgress = [
    {
      id: 'comm-001',
      name: 'Owner Notice Disclosure - 2025',
      type: 'form',
      status: 'active',
      distributedDate: '2024-08-11',
      recipients: 847,
      completed: 234,
      pending: 89,
      notViewed: 524,
      deadline: '2024-09-15',
      completionRate: 27.6
    }
  ];

  // Communications history (previously distributed)
  const communicationsHistory = [
    {
      id: 'hist-001',
      name: 'Annual Board Election Ballot',
      type: 'form',
      distributedDate: '2024-01-15',
      completedDate: '2024-02-15',
      recipients: 847,
      completed: 756,
      completionRate: 89.2,
      channels: ['email', 'portal']
    },
    {
      id: 'hist-002',
      name: 'Pool Maintenance Schedule - August 2024',
      type: 'announcement',
      distributedDate: '2024-08-01',
      recipients: 847,
      viewedCount: 623,
      channels: ['email', 'sms', 'portal'],
      priority: 'medium'
    },
    {
      id: 'hist-003',
      name: 'Special Assessment Notice',
      type: 'form',
      distributedDate: '2024-06-01',
      completedDate: '2024-06-30',
      recipients: 847,
      completed: 647,
      completionRate: 76.4,
      channels: ['email', 'portal']
    },
    {
      id: 'hist-004',
      name: 'Board Meeting - August 15th',
      type: 'announcement',
      distributedDate: '2024-08-10',
      recipients: 847,
      viewedCount: 445,
      channels: ['email', 'portal'],
      priority: 'high'
    },
    {
      id: 'hist-005',
      name: 'Community Survey - 2024',
      type: 'form',
      distributedDate: '2024-03-01',
      completedDate: '2024-03-31',
      recipients: 847,
      completed: 523,
      completionRate: 61.7,
      channels: ['email', 'portal']
    }
  ];

  // Form templates available for distribution
  const formTemplates = [
    {
      id: 'template-001',
      name: 'Owner Notice Disclosure',
      description: 'Annual disclosure form required by state law',
      category: 'Legal',
      requiresSignature: true,
      lastUsed: '2024-08-11',
      usageCount: 3
    },
    {
      id: 'template-002',
      name: 'Election Ballot',
      description: 'Board member election voting form',
      category: 'Governance',
      requiresSignature: true,
      lastUsed: '2024-01-15',
      usageCount: 5
    },
    {
      id: 'template-003',
      name: 'Assessment Notice',
      description: 'Special assessment notification form',
      category: 'Financial',
      requiresSignature: false,
      lastUsed: '2024-06-01',
      usageCount: 2
    },
    {
      id: 'template-004',
      name: 'Community Survey',
      description: 'General community feedback survey',
      category: 'Engagement',
      requiresSignature: false,
      lastUsed: '2024-03-01',
      usageCount: 4
    },
    {
      id: 'template-005',
      name: 'Maintenance Request Form',
      description: 'Common area maintenance request form',
      category: 'Operations',
      requiresSignature: false,
      lastUsed: null,
      usageCount: 0
    },
    {
      id: 'template-006',
      name: 'Violation Notice',
      description: 'CC&R violation notification form',
      category: 'Compliance',
      requiresSignature: true,
      lastUsed: null,
      usageCount: 0
    }
  ];

  // Announcements data
  const announcements = [
    {
      id: 'ann-001',
      title: 'Pool Maintenance Schedule - August 2024',
      description: 'Weekly pool maintenance and closure schedule for August',
      type: 'maintenance',
      priority: 'medium',
      status: 'sent',
      createdDate: '2024-08-01T09:00:00Z',
      sentDate: '2024-08-01T10:30:00Z',
      recipients: 847,
      viewedCount: 623,
      content: 'The community pool will be closed for maintenance every Tuesday from 8 AM to 12 PM during August...',
      channels: ['email', 'sms', 'portal'],
      expiryDate: '2024-08-31T23:59:59Z'
    },
    {
      id: 'ann-002',
      title: 'Board Meeting - August 15th',
      description: 'Monthly board meeting agenda and details',
      type: 'meeting',
      priority: 'high',
      status: 'sent',
      createdDate: '2024-08-10T14:00:00Z',
      sentDate: '2024-08-10T15:00:00Z',
      recipients: 847,
      viewedCount: 445,
      content: 'The monthly board meeting will be held on August 15th at 7 PM in the community center...',
      channels: ['email', 'portal'],
      expiryDate: '2024-08-15T23:59:59Z'
    },
    {
      id: 'ann-003',
      title: 'Holiday Decoration Guidelines',
      description: 'Guidelines for upcoming holiday decorations',
      type: 'guidelines',
      priority: 'low',
      status: 'draft',
      createdDate: '2024-08-20T11:00:00Z',
      sentDate: null,
      recipients: 0,
      viewedCount: 0,
      content: 'As we approach the holiday season, please review the following decoration guidelines...',
      channels: ['email', 'portal'],
      expiryDate: '2024-12-31T23:59:59Z'
    }
  ];

  const handleDistributeForm = (form: Form) => {
    const distributionData = {
      formId: form.id,
      formName: form.name,
      recipientCount: 847,
      dueDate: distributionSettings.deadline,
      distributedBy: currentUser?.name || '',
      distributedAt: new Date().toISOString(),
      settings: distributionSettings
    };

    addNotification(`Form distributed: ${form.name} to 847 homeowners`);
    
    alert(`${form.name} has been distributed to all 847 homeowners in Rancho Madrina Community. 
    
Distribution Details:
• Email notifications: ${distributionSettings.sendEmail ? 'Yes' : 'No'}
• SMS notifications: ${distributionSettings.sendSMS ? 'Yes' : 'No'}
• Due date: ${new Date(distributionSettings.deadline).toLocaleDateString()}
• Automated reminders: ${distributionSettings.includeReminders ? 'Enabled' : 'Disabled'}

Homeowners will receive notifications and can complete forms digitally. You can track completion progress in real-time.`);
    
    setSelectedForm(null);
  };



  const renderOverview = () => (
    <div className="space-y-6">
      {/* Communications in Progress */}
      {communicationsInProgress.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Communications in Progress</h3>
          <div className="space-y-4">
            {communicationsInProgress.map((comm) => (
              <div key={comm.id} className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{comm.name}</h3>
                    <p className="text-gray-600">
                      Distributed on {new Date(comm.distributedDate).toLocaleDateString()} • 
                      Deadline: {new Date(comm.deadline).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => setShowReminderModal('notViewed')}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center space-x-2"
                    >
                      <Mail className="w-4 h-4" />
                      <span>Remind Not Viewed</span>
                    </button>
                    <button 
                      onClick={() => setShowReminderModal('pending')}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center space-x-2"
                    >
                      <Bell className="w-4 h-4" />
                      <span>Remind Pending</span>
                    </button>
                    <button 
                      onClick={() => setShowMessageLog(true)}
                      className="text-gray-600 hover:text-gray-800 text-sm flex items-center space-x-1"
                    >
                      <History className="w-4 h-4" />
                      <span>View message history</span>
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Progress</span>
                    <span>{comm.completionRate}% complete</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${comm.completionRate}%` }}
                    ></div>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{comm.recipients}</div>
                    <div className="text-sm text-gray-600">Notified</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">{comm.completed}</div>
                    <div className="text-sm text-gray-600">Completed</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-yellow-600">{comm.pending}</div>
                    <div className="text-sm text-gray-600">Pending</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-600">{comm.notViewed}</div>
                    <div className="text-sm text-gray-600">Not Viewed</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Communications History */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Communications History</h3>
        <div className="space-y-3">
          {communicationsHistory.map((item) => (
            <div 
              key={item.id} 
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
              onClick={() => {
                setSelectedCommunication(item);
                setEditorMode('view');
                setShowEditor(true);
              }}
            >
              <div className="flex items-center space-x-3">
                {item.type === 'form' ? (
                  <FileText className="w-5 h-5 text-blue-500" />
                ) : (
                  <Megaphone className="w-5 h-5 text-purple-500" />
                )}
                <div>
                  <h4 className="font-medium text-gray-900">{item.name}</h4>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>Distributed: {new Date(item.distributedDate).toLocaleDateString()}</span>
                    <span>Recipients: {item.recipients}</span>
                    {item.type === 'form' ? (
                      <span>Completion: {item.completionRate}%</span>
                    ) : (
                      <span>Viewed: {item.viewedCount}</span>
                    )}
                    <span>Channels: {item.channels.join(', ')}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Eye className="w-4 h-4 text-gray-400" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderForms = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Form Templates</h3>
          <p className="text-gray-600 text-sm">Available form templates for distribution</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => {
              setCommunicationType('form');
              setEditorMode('create');
              setShowEditor(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center space-x-2"
          >
            <Upload className="w-4 h-4" />
            <span>Upload PDF Form</span>
          </button>
          <button
            onClick={() => {
              setCommunicationType('form');
              setEditorMode('create');
              setShowEditor(true);
            }}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center space-x-2"
          >
            <PenTool className="w-4 h-4" />
            <span>Create Online Form</span>
          </button>
        </div>
      </div>

      {/* Form Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {formTemplates.map((template) => (
          <div key={template.id} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Template className="w-5 h-5 text-blue-500" />
                <span className={`px-2 py-1 rounded-full text-xs ${
                  template.category === 'Legal' ? 'bg-red-100 text-red-800' :
                  template.category === 'Governance' ? 'bg-blue-100 text-blue-800' :
                  template.category === 'Financial' ? 'bg-green-100 text-green-800' :
                  template.category === 'Engagement' ? 'bg-purple-100 text-purple-800' :
                  template.category === 'Operations' ? 'bg-orange-100 text-orange-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {template.category}
                </span>
              </div>
              {template.requiresSignature && (
                <div className="flex items-center text-xs text-gray-500">
                  <PenTool className="w-3 h-3 mr-1" />
                  <span>Signature</span>
                </div>
              )}
            </div>
            
            <h4 className="font-medium text-gray-900 mb-2">{template.name}</h4>
            <p className="text-sm text-gray-500 mb-3">{template.description}</p>
            
            <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
              <span>Used {template.usageCount} times</span>
              {template.lastUsed && (
                <span>Last: {new Date(template.lastUsed).toLocaleDateString()}</span>
              )}
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => {
                  setSelectedCommunication(template);
                  setEditorMode('view');
                  setShowEditor(true);
                }}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded text-sm font-medium flex items-center justify-center space-x-1"
              >
                <Eye className="w-3 h-3" />
                <span>Preview</span>
              </button>
              <button
                onClick={() => {
                  setSelectedCommunication(template);
                  setEditorMode('edit');
                  setShowEditor(true);
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm font-medium flex items-center justify-center space-x-1"
              >
                <Send className="w-3 h-3" />
                <span>Distribute</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderAnnouncements = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Announcements</h3>
        <button
          onClick={() => {
            setCommunicationType('announcement');
            setEditorMode('create');
            setShowEditor(true);
          }}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Create Announcement</span>
        </button>
      </div>

      <div className="grid gap-4">
        {announcements.map((announcement) => (
          <div key={announcement.id} className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <Megaphone className="w-5 h-5 text-purple-500" />
                  <h4 className="font-medium text-gray-900">{announcement.title}</h4>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    announcement.priority === 'high' ? 'bg-red-100 text-red-800' :
                    announcement.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {announcement.priority} priority
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    announcement.status === 'sent' ? 'bg-green-100 text-green-800' :
                    announcement.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {announcement.status}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mb-2">{announcement.description}</p>
                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  <span>Recipients: {announcement.recipients}</span>
                  {announcement.viewedCount > 0 && (
                    <span>Viewed: {announcement.viewedCount}</span>
                  )}
                  <span>Channels: {announcement.channels.join(', ')}</span>
                  {announcement.sentDate && (
                    <span>Sent: {new Date(announcement.sentDate).toLocaleDateString()}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    setSelectedCommunication(announcement);
                    setEditorMode('view');
                    setShowEditor(true);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setSelectedCommunication(announcement);
                    setEditorMode('edit');
                    setShowEditor(true);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button className="text-gray-400 hover:text-gray-600">
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">


      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', name: 'Overview', icon: BarChart },
              { id: 'forms', name: 'Forms', icon: Template },
              { id: 'announcements', name: 'Announcements', icon: Megaphone }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setCurrentView(tab.id as any)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    currentView === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>
        
        <div className="p-6">
          {currentView === 'overview' && renderOverview()}
          {currentView === 'forms' && renderForms()}
          {currentView === 'announcements' && renderAnnouncements()}
        </div>
      </div>

      {/* Editor Modal */}
      {showEditor && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                {editorMode === 'create' ? `Create New ${communicationType === 'form' ? 'Form' : 'Announcement'}` :
                 editorMode === 'edit' ? `Edit ${communicationType === 'form' ? 'Form' : 'Announcement'}` :
                 `View ${communicationType === 'form' ? 'Form' : 'Announcement'}`}
              </h3>
              <button
                onClick={() => setShowEditor(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

{/* Check if this is a history item being viewed */}
            {editorMode === 'view' && selectedCommunication && (selectedCommunication.distributedDate || selectedCommunication.sentDate) ? (
              <div className="space-y-6">
                {/* Communication Details */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">{selectedCommunication.name || selectedCommunication.title}</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Distributed:</span> {new Date(selectedCommunication.distributedDate || selectedCommunication.sentDate).toLocaleDateString()}
                    </div>
                    <div>
                      <span className="font-medium">Recipients:</span> {selectedCommunication.recipients}
                    </div>
                    {selectedCommunication.type === 'form' ? (
                      <>
                        <div>
                          <span className="font-medium">Completed:</span> {selectedCommunication.completed}
                        </div>
                        <div>
                          <span className="font-medium">Completion Rate:</span> {selectedCommunication.completionRate}%
                        </div>
                      </>
                    ) : (
                      <div>
                        <span className="font-medium">Viewed:</span> {selectedCommunication.viewedCount}
                      </div>
                    )}
                    <div>
                      <span className="font-medium">Channels:</span> {selectedCommunication.channels?.join(', ')}
                    </div>
                  </div>
                </div>

                {/* Form Link (if applicable) */}
                {selectedCommunication.type === 'form' && (
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h5 className="font-medium text-blue-900 mb-2">Form Access</h5>
                    <div className="flex items-center space-x-3">
                      <FileText className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="text-sm text-blue-800">Digital Form Link</p>
                        <p className="text-xs text-blue-600">https://hoaconnect.com/forms/{selectedCommunication.id}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Distribution Report */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h5 className="font-medium text-gray-900 mb-3">Distribution Report</h5>
                  <div className="space-y-3">
                    {communicationHistory.filter(msg => msg.id.includes('00')).map((message) => (
                      <div key={message.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                        <div className="flex items-center space-x-3">
                          {message.method.includes('Email') && <Mail className="w-4 h-4 text-blue-500" />}
                          {message.method.includes('SMS') && <Smartphone className="w-4 h-4 text-green-500" />}
                          <div>
                            <p className="text-sm font-medium text-gray-900">{message.subject}</p>
                            <p className="text-xs text-gray-500">
                              {message.type === 'initial_distribution' ? 'Initial Distribution' :
                               message.type === 'reminder' ? 'Automated Reminder' :
                               'Custom Reminder'} • {message.recipients} recipients
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">{new Date(message.timestamp).toLocaleDateString()}</p>
                          <p className="text-xs text-gray-500">{new Date(message.timestamp).toLocaleTimeString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : communicationType === 'form' ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Form Name</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="Enter form name"
                      defaultValue={selectedCommunication?.name || ''}
                      disabled={editorMode === 'view'}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Form Type</label>
                    <select className="input-field" disabled={editorMode === 'view'}>
                      <option>PDF Attachment</option>
                      <option>Online Form</option>
                      <option>Hybrid (PDF + Online)</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    className="input-field"
                    rows={3}
                    placeholder="Enter form description"
                    defaultValue={selectedCommunication?.description || ''}
                    disabled={editorMode === 'view'}
                  />
                </div>

                {/* PDF Upload Section */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                  <div className="text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="mt-4">
                      <label htmlFor="pdf-upload" className="cursor-pointer">
                        <span className="mt-2 block text-sm font-medium text-gray-900">
                          Upload PDF Form
                        </span>
                        <span className="mt-1 block text-sm text-gray-500">
                          PDF will be attached to emails or converted to online form
                        </span>
                      </label>
                      <input id="pdf-upload" name="pdf-upload" type="file" accept=".pdf" className="sr-only" />
                    </div>
                    <p className="mt-2 text-xs text-gray-500">
                      PDF up to 10MB
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        disabled={editorMode === 'view'}
                      />
                      <span className="ml-2 text-sm text-gray-700">Requires Digital Signature</span>
                    </label>
                  </div>
                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        disabled={editorMode === 'view'}
                      />
                      <span className="ml-2 text-sm text-gray-700">Convert PDF to Online Form</span>
                    </label>
                  </div>
                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        disabled={editorMode === 'view'}
                      />
                      <span className="ml-2 text-sm text-gray-700">Send as Email Attachment</span>
                    </label>
                  </div>
                </div>

                {editorMode !== 'view' && (
                  <div className="flex justify-end space-x-3">
                    <button onClick={() => setShowEditor(false)} className="btn-secondary">
                      Cancel
                    </button>
                    <button className="btn-primary">
                      {editorMode === 'create' ? 'Create Form' : 'Save Changes'}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Announcement Title</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="Enter announcement title"
                      defaultValue={selectedCommunication?.title || ''}
                      disabled={editorMode === 'view'}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                    <select className="input-field" disabled={editorMode === 'view'}>
                      <option value="low">Low Priority</option>
                      <option value="medium">Medium Priority</option>
                      <option value="high">High Priority</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Brief description"
                    defaultValue={selectedCommunication?.description || ''}
                    disabled={editorMode === 'view'}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
                  <textarea
                    className="input-field"
                    rows={8}
                    placeholder="Enter announcement content"
                    defaultValue={selectedCommunication?.content || ''}
                    disabled={editorMode === 'view'}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Channels</label>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          disabled={editorMode === 'view'}
                        />
                        <span className="ml-2 text-sm text-gray-700">Email</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          disabled={editorMode === 'view'}
                        />
                        <span className="ml-2 text-sm text-gray-700">SMS</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          disabled={editorMode === 'view'}
                        />
                        <span className="ml-2 text-sm text-gray-700">Portal Notification</span>
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Schedule</label>
                    <div className="space-y-3">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="schedule"
                          className="border-gray-300 text-primary-600 focus:ring-primary-500"
                          disabled={editorMode === 'view'}
                        />
                        <span className="ml-2 text-sm text-gray-700">Send Immediately</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="schedule"
                          className="border-gray-300 text-primary-600 focus:ring-primary-500"
                          disabled={editorMode === 'view'}
                        />
                        <span className="ml-2 text-sm text-gray-700">Schedule for Later</span>
                      </label>
                      <input
                        type="datetime-local"
                        className="input-field ml-6"
                        disabled={editorMode === 'view'}
                      />
                    </div>
                  </div>
                </div>

                {editorMode !== 'view' && (
                  <div className="flex justify-end space-x-3">
                    <button onClick={() => setShowEditor(false)} className="btn-secondary">
                      Cancel
                    </button>
                    <button className="btn-secondary">
                      Save as Draft
                    </button>
                    <button className="btn-primary">
                      {editorMode === 'create' ? 'Send Announcement' : 'Save & Send'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reminder Modal */}
      {showReminderModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl mx-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Send Reminder - {showReminderModal === 'notViewed' ? 'Not Viewed' : 'Pending Completion'}
              </h3>
              <button
                onClick={() => setShowReminderModal(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  {showReminderModal === 'notViewed' 
                    ? `Sending reminder to ${formStats.notViewed} homeowners who haven't viewed the form yet.`
                    : `Sending reminder to ${formStats.pending} homeowners who viewed but haven't completed the form.`
                  }
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={reminderSettings.sendEmail}
                      onChange={(e) => setReminderSettings({...reminderSettings, sendEmail: e.target.checked})}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Send Email</span>
                  </label>
                </div>
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={reminderSettings.sendSMS}
                      onChange={(e) => setReminderSettings({...reminderSettings, sendSMS: e.target.checked})}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Send SMS</span>
                  </label>
                </div>
              </div>

              {reminderSettings.sendEmail && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Subject</label>
                    <input
                      type="text"
                      value={reminderSettings.emailSubject}
                      onChange={(e) => setReminderSettings({...reminderSettings, emailSubject: e.target.value})}
                      className="input-field"
                      placeholder="Enter email subject"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Message</label>
                    <textarea
                      value={reminderSettings.emailMessage}
                      onChange={(e) => setReminderSettings({...reminderSettings, emailMessage: e.target.value})}
                      className="input-field"
                      rows={4}
                      placeholder="Enter email message"
                    />
                  </div>
                </div>
              )}

              {reminderSettings.sendSMS && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SMS Message</label>
                  <textarea
                    value={reminderSettings.smsMessage}
                    onChange={(e) => setReminderSettings({...reminderSettings, smsMessage: e.target.value})}
                    className="input-field"
                    rows={3}
                    placeholder="Enter SMS message (160 characters max)"
                    maxLength={160}
                  />
                  <p className="text-xs text-gray-500 mt-1">{reminderSettings.smsMessage.length}/160 characters</p>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4">
                <button 
                  onClick={() => setShowReminderModal(null)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    addNotification(`Reminder sent to ${showReminderModal === 'notViewed' ? formStats.notViewed : formStats.pending} homeowners`);
                    setShowReminderModal(null);
                  }}
                  className="btn-primary"
                >
                  Send Reminder
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Message Log Modal */}
      {showMessageLog && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-3xl mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Message History - Owner Notice Disclosure 2025</h3>
              <button
                onClick={() => setShowMessageLog(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              {communicationHistory.map((message) => (
                <div key={message.id} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className="flex space-x-1">
                        {message.method.includes('Email') && <Mail className="w-4 h-4 text-blue-500" />}
                        {message.method.includes('SMS') && <Smartphone className="w-4 h-4 text-green-500" />}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{message.subject}</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {message.type === 'initial_distribution' ? 'Initial Distribution' :
                           message.type === 'reminder' ? 'Automated Reminder' :
                           'Custom Reminder'}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          Sent to {message.recipients} recipients via {message.method}
                        </p>
                      </div>
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      <p>{new Date(message.timestamp).toLocaleDateString()}</p>
                      <p>{new Date(message.timestamp).toLocaleTimeString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default FormsManagement;
