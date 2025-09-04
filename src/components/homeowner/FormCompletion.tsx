import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useDemoContext } from '../../contexts/DemoContext';
import { Form, FormSubmission } from '../../types';
import { 
  FileText, 
  AlertTriangle,
  CheckCircle,
  PenTool,
  Building,
  X
} from 'lucide-react';
import { OWNER_NOTICE_DISCLOSURE_FORM } from '../../data/mockData';

interface FormCompletionProps {
  form?: Form;
  onClose?: () => void;
  onSubmit?: (submission: FormSubmission) => void;
}

const FormCompletion: React.FC<FormCompletionProps> = ({ 
  form = OWNER_NOTICE_DISCLOSURE_FORM, 
  onClose, 
  onSubmit 
}) => {
  const { currentUser } = useAuth();
  const { addNotification } = useDemoContext();
  
  const [formData, setFormData] = useState<Record<string, any>>({
    ownerName: 'Jason Abustan',
    ownerPhoneHome: '',
    ownerPhoneCell: '(949) 555-0123',
    ownerEmail: 'jason.abustan@email.com',
    propertyAddress: '123 Oak Street, Rancho Madrina Community',
    mailingAddress: '123 Oak Street, Rancho Madrina Community',
    validEmail: 'jason.abustan@email.com',
    secondaryMailing: '',
    secondaryEmail: '',
    deliveryPreference: 'Email address',
    tenantName: '',
    tenantPhone: '',
    tenantEmail: ''
  });
  
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [typedName, setTypedName] = useState('');

  const handleFieldChange = (fieldName: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };



  const handleSubmitForm = () => {
    if (!form.requiredSignature) {
      // Submit without signature
      submitForm();
    } else {
      // Show signature modal
      setShowSignatureModal(true);
    }
  };

  const submitForm = () => {
    if (!currentUser) return;

    const submission: FormSubmission = {
      id: `submission-${Date.now()}`,
      formId: form.id,
      homeownerId: currentUser.id,
      status: 'submitted',
      data: formData,
      submittedAt: new Date().toISOString(),
      digitalSignature: form.requiredSignature ? {
        id: `sig-${Date.now()}`,
        signatureData: typedName,
        signedBy: currentUser.id,
        signedAt: new Date().toISOString(),
        ipAddress: '192.168.1.189',
        userAgent: navigator.userAgent,
        verified: true
      } : undefined
    };

    addNotification(`Form completed: ${form.name} by Jason Abustan`);
    onSubmit?.(submission);
    
    setShowSignatureModal(false);
    setTypedName('');
    
    alert(`${form.name} submitted successfully! Your information has been recorded and will be processed by Seabreeze Management.`);
    onClose?.();
  };

  const isFormValid = () => {
    // Check the main required fields that are visible in the form
    const requiredFields = ['ownerName', 'ownerEmail', 'propertyAddress', 'mailingAddress', 'validEmail', 'deliveryPreference'];
    return requiredFields.every(fieldName => {
      const value = formData[fieldName];
      return value && value.toString().trim().length > 0;
    });
  };

  const daysRemaining = Math.ceil((new Date(form.dueDate || '').getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-start justify-center pt-4 pb-8">
      <div className="relative mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white min-h-[80vh] max-h-[95vh] overflow-y-auto">
        
        {/* Header with Seabreeze Branding */}
        <div className="bg-seabreeze-600 text-white p-6 rounded-t-lg -m-5 mb-6">
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
                <Building className="w-8 h-8 text-seabreeze-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold">SEABREEZE MANAGEMENT COMPANY</h1>
                <h2 className="text-lg">Rancho Madrina Community Association</h2>
                <h3 className="text-base">Owner Notice Disclosure</h3>
                <p className="text-sm opacity-90">Date: {new Date().toLocaleDateString()}</p>
              </div>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="text-white hover:text-gray-200 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full p-2 transition-all"
                title="Close form"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Legal Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800">
            <strong>California law requires</strong> all Owners in a community association to provide the 
            following information to the association <strong>on an annual basis</strong>. Please complete and 
            return this form within ten (10) days. If this form is not returned, then by law Association 
            notices will only be sent to the last property address provided by you, or if none was 
            received, the property address within this association.
          </p>
        </div>

        {/* Deadline Warning */}
        {daysRemaining <= 3 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <h4 className="text-sm font-medium text-red-800">
                  {daysRemaining <= 0 ? 'Form Overdue' : `Due in ${daysRemaining} days`}
                </h4>
                <p className="text-sm text-red-700">
                  Please complete this form as soon as possible to comply with state requirements.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Form Fields */}
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Owner Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                1. Owner Name(s): <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.ownerName}
                onChange={(e) => handleFieldChange('ownerName', e.target.value)}
                className="input-field"
              />
            </div>

            {/* Owner Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                3. Owner Email(s): <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={formData.ownerEmail}
                onChange={(e) => handleFieldChange('ownerEmail', e.target.value)}
                className="input-field"
              />
            </div>

            {/* Phone Numbers */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                2. Owner Phones - H:
              </label>
              <input
                type="tel"
                value={formData.ownerPhoneHome}
                onChange={(e) => handleFieldChange('ownerPhoneHome', e.target.value)}
                className="input-field"
                placeholder="Home phone"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                2. Owner Phones - C:
              </label>
              <input
                type="tel"
                value={formData.ownerPhoneCell}
                onChange={(e) => handleFieldChange('ownerPhoneCell', e.target.value)}
                className="input-field"
                placeholder="Cell phone"
              />
            </div>

            {/* Property Address */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                4. Address in the Association: <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.propertyAddress}
                onChange={(e) => handleFieldChange('propertyAddress', e.target.value)}
                className="input-field"
              />
            </div>

            {/* Mailing Address */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                5. Mailing Address (can be same): <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.mailingAddress}
                onChange={(e) => handleFieldChange('mailingAddress', e.target.value)}
                className="input-field"
              />
            </div>

            {/* Valid Email */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                6. Valid Email Address(es): <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={formData.validEmail}
                onChange={(e) => handleFieldChange('validEmail', e.target.value)}
                className="input-field"
              />
            </div>

            {/* Secondary Addresses */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                7. Secondary Mailing Address:
              </label>
              <input
                type="text"
                value={formData.secondaryMailing}
                onChange={(e) => handleFieldChange('secondaryMailing', e.target.value)}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                8. Secondary Email Address(es):
              </label>
              <input
                type="email"
                value={formData.secondaryEmail}
                onChange={(e) => handleFieldChange('secondaryEmail', e.target.value)}
                className="input-field"
              />
            </div>

            {/* Delivery Preference */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                9. Member's preferred delivery method for receiving notices: <span className="text-red-500">*</span>
              </label>
              <div className="flex space-x-6">
                {['Mailing address', 'Email address', 'Both'].map((option) => (
                  <label key={option} className="flex items-center">
                    <input
                      type="radio"
                      name="deliveryPreference"
                      value={option}
                      checked={formData.deliveryPreference === option}
                      onChange={(e) => handleFieldChange('deliveryPreference', e.target.value)}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">{option}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Tenant Information */}
            <div className="md:col-span-2">
              <h4 className="font-medium text-gray-900 mb-3">
                10. If the property is rented, please fill out the tenant's info below so they can be notified in the event of emergency:
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    10a. Tenant Name:
                  </label>
                  <input
                    type="text"
                    value={formData.tenantName}
                    onChange={(e) => handleFieldChange('tenantName', e.target.value)}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    10b. Phone Number:
                  </label>
                  <input
                    type="tel"
                    value={formData.tenantPhone}
                    onChange={(e) => handleFieldChange('tenantPhone', e.target.value)}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    10c. Valid Email Address(es):
                  </label>
                  <input
                    type="email"
                    value={formData.tenantEmail}
                    onChange={(e) => handleFieldChange('tenantEmail', e.target.value)}
                    className="input-field"
                  />
                </div>
              </div>
            </div>


          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end items-center mt-8 pt-6 border-t border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="text-sm text-gray-500">
              {isFormValid() ? (
                <span className="text-green-600 flex items-center">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Form complete
                </span>
              ) : (
                <span className="text-yellow-600 flex items-center">
                  <AlertTriangle className="w-4 h-4 mr-1" />
                  Please complete required fields
                </span>
              )}
            </div>
            <button
              onClick={handleSubmitForm}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors"
            >
              <FileText className="w-4 h-4" />
              <span>Submit Form</span>
            </button>
          </div>
        </div>

        {/* Digital Signature Modal */}
        {showSignatureModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-60">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Digital Signature Required</h3>
              
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Form Submission:</strong><br />
                    {form.name}<br />
                    <em>Rancho Madrina Community Association</em>
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Digital Signature - Type Your Full Name
                  </label>
                  <input
                    type="text"
                    value={typedName}
                    onChange={(e) => setTypedName(e.target.value)}
                    className="input-field"
                    placeholder={`Type your full name: ${currentUser?.name}`}
                  />
                  
                  <div className="mt-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-start space-x-2">
                      <PenTool className="w-4 h-4 text-blue-600 mt-0.5" />
                      <div className="text-sm text-blue-800">
                        <p className="font-medium">Legal Digital Signature</p>
                        <p>By typing your full name, you confirm this form submission is legally binding and compliant with HOA CC&R requirements, as well as state and local laws.</p>
                      </div>
                    </div>
                  </div>
                  
                  {typedName && (
                    <div className={`mt-2 p-2 border rounded text-sm ${
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
                    onClick={submitForm}
                    disabled={!typedName || typedName.toLowerCase() !== currentUser?.name.toLowerCase()}
                    className="btn-success disabled:opacity-50"
                  >
                    Submit Signed Form
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

export default FormCompletion;
