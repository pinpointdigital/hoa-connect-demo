import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useDemoContext } from '../../contexts/DemoContext';
import { Request, RequestType } from '../../types';
import { 
  Camera, 
  FileText, 
  Home, 
  Trees, 
  Building,
  X,
  Check,
  Upload
} from 'lucide-react';

interface RequestSubmissionProps {
  onClose?: () => void;
  onSubmit?: (request: Request) => void;
}

const RequestSubmission: React.FC<RequestSubmissionProps> = ({ onClose, onSubmit }) => {
  const { currentUser } = useAuth();
  const { addRequest } = useDemoContext();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedRequestType, setSelectedRequestType] = useState<any>(null);
  const [formData, setFormData] = useState({
    type: '' as RequestType | '',
    subtype: '',
    title: '',
    description: '',
    photos: [] as File[],
    urgency: 'medium' as 'low' | 'medium' | 'high',
    attachmentTypes: [] as string[], // Plot Plan, Rendering, Cross Section, etc.
    attachments: [] as Array<{file: File, type: string, label: string}>, // Actual uploaded files
    lotNumber: '',
    squareFootage: '' // For ADU/JADU requests
  });

  const requestTypes = [
    {
      id: 'exterior_modification' as RequestType,
      name: 'Exterior Modification',
      icon: Home,
      description: 'Paint, siding, doors, windows, roofing',
      subtypes: ['Paint/Color Change', 'Siding Repair', 'Door Replacement', 'Window Replacement', 'Roofing']
    },
    {
      id: 'landscaping' as RequestType,
      name: 'Landscaping',
      icon: Trees,
      description: 'Plants, trees, hardscaping, irrigation',
      subtypes: ['Tree Planting', 'Garden Installation', 'Hardscaping', 'Irrigation System']
    },
    {
      id: 'architectural_change' as RequestType,
      name: 'Architectural Change',
      icon: Building,
      description: 'Additions, structures, major modifications',
      subtypes: ['Room Addition', 'Deck/Patio', 'Fence Installation', 'Shed/Storage']
    },
    {
      id: 'adu_jadu' as RequestType,
      name: 'ADU/JADU',
      icon: Home,
      description: 'Accessory Dwelling Units and Junior ADUs',
      subtypes: ['ADU - Attached', 'ADU - Detached', 'ADU - Room/Garage Conversion', 'ADU - 2nd Floor Addition', 'JADU - Room/Garage Conversion']
    }
  ];

  // Auto-populate lot number from user profile when available
  React.useEffect(() => {
    if (currentUser?.homeownerData?.lotNumber) {
      setFormData(prev => ({
        ...prev,
        lotNumber: currentUser.homeownerData?.lotNumber || ''
      }));
    }
  }, [currentUser]);

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setFormData(prev => ({
      ...prev,
      photos: [...prev.photos, ...files].slice(0, 5) // Max 5 photos
    }));
  };

  const removePhoto = (index: number) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
  };

  const handleAttachmentUpload = (event: React.ChangeEvent<HTMLInputElement>, attachmentType: string) => {
    const files = Array.from(event.target.files || []);
    const newAttachments = files.map(file => ({
      file,
      type: attachmentType,
      label: `${attachmentType} - ${file.name}`
    }));
    
    setFormData(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...newAttachments]
    }));
  };

  const removeAttachment = (index: number) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  const updateAttachmentLabel = (index: number, newLabel: string) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.map((attachment, i) => 
        i === index ? { ...attachment, label: newLabel } : attachment
      )
    }));
  };

  // Validation for Step 4 - ensure all checked attachment types have uploads
  const validateAttachments = () => {
    for (const attachmentType of formData.attachmentTypes) {
      const hasUploads = formData.attachments.some(att => att.type === attachmentType);
      if (!hasUploads) {
        return false;
      }
    }
    return true;
  };

  const getMissingAttachments = () => {
    return formData.attachmentTypes.filter(type => 
      !formData.attachments.some(att => att.type === type)
    );
  };

  const handleSubmit = async () => {
    if (!currentUser) return;

    const newRequest: Request = {
      id: `req-${Date.now()}`,
      homeownerId: currentUser.id,
      communityId: currentUser.communityId,
      type: formData.type as RequestType,
      title: formData.title,
      description: formData.description,
      status: 'submitted',
      priority: formData.urgency,
      submittedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      
      // Enhanced ARC data
      lotNumber: formData.lotNumber,
      attachmentTypes: formData.attachmentTypes,
      
      photos: formData.photos.map((file, index) => ({
        id: `photo-${Date.now()}-${index}`,
        url: URL.createObjectURL(file),
        caption: `${formData.subtype} - Photo ${index + 1}`,
        uploadedAt: new Date().toISOString(),
        uploadedBy: currentUser.id,
        type: 'before' as const
      })),
      
      documents: [],
      workflowSteps: [
        {
          id: 'step-submission',
          name: 'Request Submission',
          description: 'Homeowner submits ARC request',
          status: 'completed',
          completedAt: new Date().toISOString(),
          completedBy: currentUser.id
        },
        {
          id: 'step-management-review',
          name: 'Management Review',
          description: 'HOA management reviews request and provides CC&R references',
          status: 'pending'
        },
        {
          id: 'step-neighbor-approval',
          name: 'Neighbor Approval',
          description: 'Adjacent neighbors review and approve request',
          status: 'pending'
        },
        {
          id: 'step-board-review',
          name: 'Board Review',
          description: 'Board of Directors votes on request',
          status: 'pending'
        },
        {
          id: 'step-decision',
          name: 'Final Decision',
          description: 'Final approval notification sent to homeowner',
          status: 'pending'
        }
      ],
      currentStep: 'step-management-review',
      
      neighborApprovals: [],
      boardVotes: [],
      
      timeline: [
        {
          id: `timeline-${Date.now()}`,
          timestamp: new Date().toISOString(),
          type: 'submitted',
          userId: currentUser.id,
          userName: currentUser.name,
          description: `Request submitted: ${formData.title}`
        }
      ]
    };

    // Add to shared demo context (works across all role switches)
    console.log('Adding request to demo context:', newRequest.title);
    await addRequest(newRequest);

    // Call parent callback
    onSubmit?.(newRequest);
    
    // Show success and close
    alert('Request submitted successfully! Switch to Allan Chua (HOA Management) to see the instant update.');
    onClose?.();
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-6">
      {[1, 2, 3, 4, 5].map((step) => (
        <React.Fragment key={step}>
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
            currentStep >= step 
              ? 'bg-primary-600 text-white' 
              : 'bg-gray-200 text-gray-500'
          }`}>
            {currentStep > step ? <Check className="w-4 h-4" /> : step}
          </div>
          {step < 5 && (
            <div className={`w-12 h-0.5 ${
              currentStep > step ? 'bg-primary-600' : 'bg-gray-200'
            }`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          What type of request are you submitting?
        </h3>
        <div className="grid grid-cols-1 gap-4">
          {requestTypes.map((type) => {
            const Icon = type.icon;
            return (
              <button
                key={type.id}
                onClick={() => {
                  setFormData(prev => ({ ...prev, type: type.id, subtype: '' }));
                }}
                className={`p-4 border-2 rounded-lg text-left transition-all ${
                  formData.type === type.id
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <Icon className={`w-6 h-6 mt-1 ${
                    formData.type === type.id ? 'text-primary-600' : 'text-gray-400'
                  }`} />
                  <div>
                    <h4 className="font-medium text-gray-900">{type.name}</h4>
                    <p className="text-sm text-gray-500 mt-1">{type.description}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => {
            setSelectedRequestType(requestTypes.find(t => t.id === formData.type));
            setCurrentStep(2);
          }}
          disabled={!formData.type}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next Step
        </button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Select specific type:
        </h3>
        <p className="text-gray-600 mb-4">
          Choose the specific type of {selectedRequestType?.name.toLowerCase()} you're requesting:
        </p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {selectedRequestType?.subtypes.map((subtype: string) => (
            <button
              key={subtype}
              onClick={() => {
                setFormData(prev => ({ ...prev, subtype }));
              }}
              className={`p-4 text-left border-2 rounded-lg transition-all ${
                formData.subtype === subtype
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <h4 className="font-medium">{subtype}</h4>
            </button>
          ))}
        </div>
      </div>

      {/* Square Footage - Only show for ADU/JADU requests */}
      {selectedRequestType?.id === 'adu_jadu' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Square Footage <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            value={formData.squareFootage}
            onChange={(e) => {
              const value = e.target.value;
              // Only allow positive numbers
              if (value === '' || (Number(value) > 0 && !isNaN(Number(value)))) {
                setFormData(prev => ({ ...prev, squareFootage: value }));
              }
            }}
            placeholder="e.g., 1200"
            className="input-field"
            min="1"
            max="50000"
            step="1"
            required
            onKeyPress={(e) => {
              // Only allow numbers and backspace
              if (!/[0-9]/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Delete' && e.key !== 'Tab') {
                e.preventDefault();
              }
            }}
          />
          <p className="text-xs text-gray-500 mt-1">
            Enter the total square footage of the proposed ADU/JADU (typical range: 100-1,200 sq ft)
          </p>
        </div>
      )}

      <div className="flex justify-between">
        <button
          onClick={() => setCurrentStep(1)}
          className="btn-secondary"
        >
          Back
        </button>
        <button
          onClick={() => {
            // Check if ADU/JADU requires square footage
            const isAduJadu = selectedRequestType?.id === 'adu_jadu';
            
            if (isAduJadu) {
              const sqft = formData.squareFootage.trim();
              const sqftNumber = Number(sqft);
              
              if (!sqft) {
                alert('Please enter the square footage for your ADU/JADU request.');
                return;
              }
              
              if (isNaN(sqftNumber) || sqftNumber <= 0) {
                alert('Please enter a valid positive number for square footage.');
                return;
              }
              
              if (sqftNumber > 50000) {
                alert('Square footage cannot exceed 50,000 sq ft. Please enter a reasonable value.');
                return;
              }
              
              // Check for unusual values and ask for confirmation
              if (sqftNumber < 100 || sqftNumber > 1200) {
                const message = sqftNumber < 100 
                  ? `You entered ${sqftNumber} sq ft, which seems quite small for an ADU/JADU. Most ADUs are typically 100-1,200 sq ft.\n\nDid you mean to enter ${sqftNumber}0 sq ft instead?\n\nClick OK to continue with ${sqftNumber} sq ft, or Cancel to go back and change it.`
                  : `You entered ${sqftNumber} sq ft, which is larger than typical ADUs/JADUs (usually 100-1,200 sq ft).\n\nPlease double-check this value.\n\nClick OK to continue with ${sqftNumber} sq ft, or Cancel to go back and change it.`;
                
                if (!window.confirm(message)) {
                  return; // User wants to go back and change the value
                }
              }
            }
            
            setCurrentStep(3);
          }}
          disabled={!formData.subtype}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next Step
        </button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Basic Request Details
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Request Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="input-field"
              placeholder="Brief description of your request"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Detailed Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={4}
              className="input-field"
              placeholder="Provide detailed information about your request, including materials, colors, dimensions, etc."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Priority Level
            </label>
            <select
              value={formData.urgency}
              onChange={(e) => setFormData(prev => ({ ...prev, urgency: e.target.value as 'low' | 'medium' | 'high' }))}
              className="input-field"
            >
              <option value="low">Low - No rush</option>
              <option value="medium">Medium - Standard timeline</option>
              <option value="high">High - Time sensitive</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <button
          onClick={() => setCurrentStep(2)}
          className="btn-secondary"
        >
          Back
        </button>
        <button
          onClick={() => setCurrentStep(4)}
          disabled={!formData.title.trim() || !formData.description.trim()}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next Step
        </button>
      </div>
    </div>
  );

  const renderStep4Photos = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Add Photos (Optional but Recommended)
        </h3>
        
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
          <div className="text-center">
            <Camera className="mx-auto h-12 w-12 text-gray-400" />
            <div className="mt-2">
              <label htmlFor="photo-upload" className="cursor-pointer">
                <span className="text-sm font-medium text-primary-600 hover:text-primary-500">
                  Take photos or upload files
                </span>
                <input
                  id="photo-upload"
                  type="file"
                  multiple
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhotoUpload}
                  className="sr-only"
                />
              </label>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              PNG, JPG up to 10MB each (max 5 photos)
            </p>
          </div>
        </div>

        {formData.photos.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
            {formData.photos.map((photo, index) => (
              <div key={index} className="relative">
                <img
                  src={URL.createObjectURL(photo)}
                  alt={`Upload ${index + 1}`}
                  className="w-full h-24 object-cover rounded-lg"
                />
                <button
                  onClick={() => removePhoto(index)}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lot Number Field */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Lot Number
        </label>
        <input
          type="text"
          value={formData.lotNumber}
          onChange={(e) => setFormData(prev => ({ ...prev, lotNumber: e.target.value }))}
          placeholder="e.g., Lot 123 (will auto-populate from your profile when available)"
          className="input-field"
        />
        <p className="text-xs text-gray-500 mt-1">
          This helps identify your property and will be auto-filled in the ARC application form
        </p>
      </div>



      <div className="flex justify-between">
        <button
          onClick={() => setCurrentStep(2)}
          className="btn-secondary"
        >
          Back
        </button>
        <button
          onClick={() => setCurrentStep(4)}
          disabled={!formData.title.trim() || !formData.description.trim()}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next Step
        </button>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Attachments & Documents
        </h3>
        <p className="text-gray-600 mb-6">
          Select and upload any required documents for your request.
        </p>
      </div>

      {/* Attachment Types Section */}
      <div className="border-t border-gray-200 pt-6">
        <h4 className="text-md font-semibold text-gray-900 mb-3">
          Required Attachments (check all that apply)
        </h4>
        <p className="text-sm text-gray-600 mb-4">
          Based on your request type, the following documents may be required for ARC review:
        </p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { id: 'plot_plan', name: 'Plot Plan', description: 'Property layout and dimensions' },
            { id: 'rendering', name: 'Rendering', description: 'Visual representation of proposed changes' },
            { id: 'cross_section', name: 'Cross Section', description: 'Detailed structural cross-section view' },
            { id: 'floor_plan', name: 'Floor Plan', description: 'Interior layout (if applicable)' },
            { id: 'material_samples', name: 'Material Samples', description: 'Color swatches, material specifications' },
            { id: 'contractor_info', name: 'Contractor Information', description: 'Licensed contractor details and insurance' }
          ].map((attachment) => (
            <label key={attachment.id} className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.attachmentTypes.includes(attachment.id)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setFormData(prev => ({
                      ...prev,
                      attachmentTypes: [...prev.attachmentTypes, attachment.id]
                    }));
                  } else {
                    setFormData(prev => ({
                      ...prev,
                      attachmentTypes: prev.attachmentTypes.filter(t => t !== attachment.id)
                    }));
                  }
                }}
                className="mt-0.5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{attachment.name}</p>
                <p className="text-xs text-gray-500">{attachment.description}</p>
              </div>
            </label>
          ))}
        </div>

        {formData.attachmentTypes.length > 0 && (
          <div className="mt-6 space-y-4">
            <h5 className="text-sm font-medium text-gray-900">Upload Required Attachments</h5>
            <p className="text-sm text-gray-600">Upload documents for each selected attachment type:</p>
            
            {formData.attachmentTypes.map((attachmentType) => {
              const attachmentInfo = [
                { id: 'plot_plan', name: 'Plot Plan' },
                { id: 'rendering', name: 'Rendering' },
                { id: 'cross_section', name: 'Cross Section' },
                { id: 'floor_plan', name: 'Floor Plan' },
                { id: 'material_samples', name: 'Material Samples' },
                { id: 'contractor_info', name: 'Contractor Information' }
              ].find(a => a.id === attachmentType);
              
              const typeAttachments = formData.attachments.filter(a => a.type === attachmentType);
              
              return (
                <div key={attachmentType} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h6 className="text-sm font-medium text-gray-900">{attachmentInfo?.name}</h6>
                    <label className="btn-secondary text-xs cursor-pointer">
                      <Upload className="w-3 h-3 mr-1" />
                      Add Files
                      <input
                        type="file"
                        multiple
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        onChange={(e) => handleAttachmentUpload(e, attachmentType)}
                        className="sr-only"
                      />
                    </label>
                  </div>
                  
                  {typeAttachments.length > 0 && (
                    <div className="space-y-2">
                      {typeAttachments.map((attachment, index) => {
                        const globalIndex = formData.attachments.findIndex(a => a === attachment);
                        return (
                          <div key={index} className="flex items-center space-x-3 p-2 bg-gray-50 rounded border">
                            <FileText className="w-4 h-4 text-gray-500 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <input
                                type="text"
                                value={attachment.label}
                                onChange={(e) => updateAttachmentLabel(globalIndex, e.target.value)}
                                className="w-full text-sm bg-transparent border-none p-0 focus:ring-0"
                                placeholder="Enter file description..."
                              />
                              <p className="text-xs text-gray-500 truncate">{attachment.file.name}</p>
                            </div>
                            <button
                              onClick={() => removeAttachment(globalIndex)}
                              className="text-red-500 hover:text-red-700 flex-shrink-0"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  
                  {typeAttachments.length === 0 && (
                    <p className="text-xs text-gray-500 italic">No files uploaded yet</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>



      <div className="flex justify-between">
        <button
          onClick={() => setCurrentStep(3)}
          className="btn-secondary"
        >
          Back
        </button>
        <button
          onClick={() => {
            if (formData.attachmentTypes.length === 0 || validateAttachments()) {
              setCurrentStep(5);
            } else {
              const missing = getMissingAttachments();
              const attachmentNames = missing.map(type => {
                return [
                  { id: 'plot_plan', name: 'Plot Plan' },
                  { id: 'rendering', name: 'Rendering' },
                  { id: 'cross_section', name: 'Cross Section' },
                  { id: 'floor_plan', name: 'Floor Plan' },
                  { id: 'material_samples', name: 'Material Samples' },
                  { id: 'contractor_info', name: 'Contractor Information' }
                ].find(a => a.id === type)?.name || type;
              });
              alert(`Please upload files for the following checked attachment types, or uncheck them:\n\n• ${attachmentNames.join('\n• ')}`);
            }
          }}
          className={`btn-primary ${
            formData.attachmentTypes.length > 0 && !validateAttachments() 
              ? 'opacity-75 hover:opacity-100' 
              : ''
          }`}
        >
          Next Step
        </button>
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex">
          <FileText className="h-5 w-5 text-blue-400 mt-0.5" />
          <div className="ml-3">
            <h4 className="text-sm font-medium text-blue-800">
              What happens next?
            </h4>
            <div className="mt-2 text-sm text-blue-700">
              <ol className="list-decimal list-inside space-y-1">
                <li>Management will review your application</li>
                <li>Affected neighbors will be notified for approval</li>
                <li>Board of Directors will vote on your request</li>
                <li>You'll receive real-time updates throughout the process</li>
              </ol>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
        <h3 className="text-lg font-semibold text-green-900 mb-2">Ready to Submit</h3>
        <p className="text-green-700 mb-4">
          Your ARC application is complete and ready for submission to Seabreeze Management Company.
        </p>
        <div className="text-sm text-green-600 space-y-1">
          <p>✓ Request type: {formData.subtype || formData.type}</p>
          <p>✓ Description: {formData.title}</p>
          <p>✓ Photos: {formData.photos.length} uploaded</p>
          <p>✓ Attachments: {formData.attachments.length} uploaded ({formData.attachmentTypes.length} types selected)</p>
          {formData.lotNumber && <p>✓ Lot number: {formData.lotNumber}</p>}
        </div>
      </div>

      <div className="flex justify-between">
        <button
          onClick={() => setCurrentStep(4)}
          className="btn-secondary"
        >
          Back
        </button>
        <button
          onClick={handleSubmit}
          className="btn-success flex items-center space-x-2"
        >
          <FileText className="w-5 h-5" />
          <span>Submit Application</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative mx-auto my-4 p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white min-h-0">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            Submit New ARC Request
          </h2>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          )}
        </div>

        {renderStepIndicator()}

        <div className="mt-6 max-h-[80vh] overflow-y-auto pr-2 relative" style={{scrollBehavior: 'smooth'}}>
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && (
            <div>
              {renderStep3()}
              {formData.attachmentTypes.length > 0 && (
                <div className="text-center mt-4 text-xs text-gray-500 animate-pulse">
                  ↓ Scroll down for attachment uploads ↓
                </div>
              )}
            </div>
          )}
          {currentStep === 4 && renderStep4()}
          {currentStep === 5 && renderStep5()}
        </div>
      </div>
    </div>
  );
};

export default RequestSubmission;
