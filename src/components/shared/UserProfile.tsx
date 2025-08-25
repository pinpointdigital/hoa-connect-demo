import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Building, Save, X, Edit3, CheckCircle, Plus } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { ContactInfo } from '../../types';

interface UserProfileProps {
  onClose: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ onClose }) => {
  const { currentUser, updateUserProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [contactInfo, setContactInfo] = useState<ContactInfo>({
    email: '',
    phone: '',
    address: '',
    emergencyContact: '',
    emergencyPhone: '',
    preferredNotification: 'both'
  });

  useEffect(() => {
    if (currentUser) {
      // Load existing contact info or set defaults based on user
      const defaultInfo = getDefaultContactInfo(currentUser);
      setContactInfo(defaultInfo);
      setAvatarPreview(currentUser.avatar || null);
    }
  }, [currentUser]);

  const getDefaultContactInfo = (user: any): ContactInfo => {
    // Get existing contact info from localStorage or set demo defaults
    const savedInfo = localStorage.getItem(`contactInfo_${user.id}`);
    if (savedInfo) {
      return JSON.parse(savedInfo);
    }

    // Default contact info for demo users
    const defaults: { [key: string]: ContactInfo } = {
      'jason-abustan': {
        email: 'jason.abustan@example.com',
        phone: '+1-555-0123',
        address: '123 Oak Street, Rancho Madrina Community',
        emergencyContact: 'Sarah Abustan',
        emergencyPhone: '+1-555-0124',
        preferredNotification: 'both'
      },
      'allan-chua': {
        email: 'allan.chua@seabreezemanagement.com',
        phone: '+1-949-555-0101',
        address: 'Seabreeze Management Office',
        emergencyContact: 'Management Team',
        emergencyPhone: '+1-949-555-0100',
        preferredNotification: 'both'
      },
      'robert-ferguson': {
        email: 'robert.ferguson@example.com',
        phone: '+1-555-0201',
        address: '456 Pine Avenue, Rancho Madrina Community',
        emergencyContact: 'Linda Ferguson',
        emergencyPhone: '+1-555-0202',
        preferredNotification: 'email'
      },
      'dean-martin': {
        email: 'dean.martin@example.com',
        phone: '+1-555-0301',
        address: '789 Maple Drive, Rancho Madrina Community',
        emergencyContact: 'Betty Martin',
        emergencyPhone: '+1-555-0302',
        preferredNotification: 'both'
      },
      'frank-sinatra': {
        email: 'frank.sinatra@example.com',
        phone: '+1-555-0401',
        address: '321 Cedar Lane, Rancho Madrina Community',
        emergencyContact: 'Nancy Sinatra',
        emergencyPhone: '+1-555-0402',
        preferredNotification: 'sms'
      }
    };

    return defaults[user.id] || {
      email: user.email || '',
      phone: user.phone || '',
      address: '',
      emergencyContact: '',
      emergencyPhone: '',
      preferredNotification: 'both'
    };
  };

  const handleSave = async () => {
    if (!currentUser) return;

    setIsSaving(true);
    try {
      // Save to localStorage (in a real app, this would be an API call)
      localStorage.setItem(`contactInfo_${currentUser.id}`, JSON.stringify(contactInfo));
      
      // Update the user profile in the auth context
      await updateUserProfile({
        ...currentUser,
        email: contactInfo.email,
        phone: contactInfo.phone,
        contactInfo: contactInfo,
        avatar: avatarPreview || undefined
      });

      setSaveSuccess(true);
      setIsEditing(false);
      
      // Hide success message after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset to original values
    if (currentUser) {
      const originalInfo = getDefaultContactInfo(currentUser);
      setContactInfo(originalInfo);
    }
    setIsEditing(false);
  };

  const getRoleDisplayName = (role: string) => {
    const roleNames: Record<string, string> = {
      homeowner: 'Homeowner',
      management: 'HOA Management',
      board_member: 'Board Member',
      board: 'Board Member',
      admin: 'Administrator'
    };
    return roleNames[role] || role.replace('_', ' ');
  };

  if (!currentUser) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{currentUser.name}</h2>
              <p className="text-sm text-gray-500">{getRoleDisplayName(currentUser.role)}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {saveSuccess && (
              <div className="flex items-center text-green-600 text-sm">
                <CheckCircle className="w-4 h-4 mr-1" />
                Saved!
              </div>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Contact Information Section */}
          <div className="mb-8">
            {/* Avatar Upload */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Profile Photo</label>
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="relative w-20 h-20 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                  title="Upload profile photo"
                >
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar" className="w-20 h-20 object-cover" />
                  ) : (
                    <User className="w-8 h-8 text-gray-400" />
                  )}
                </button>
                {!avatarPreview && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-blue-600 hover:text-blue-700 text-sm"
                  >
                    Upload Profile Photo
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = () => {
                      setAvatarPreview(reader.result as string);
                      setIsEditing(true);
                    };
                    reader.readAsDataURL(file);
                  }}
                />
                {avatarPreview && (
                  <button
                    onClick={() => setAvatarPreview(null)}
                    className="text-sm text-gray-600 hover:text-gray-800"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Contact Information</h3>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center text-blue-600 hover:text-blue-700 text-sm"
                >
                  <Edit3 className="w-4 h-4 mr-1" />
                  Edit
                </button>
              )}
            </div>

            <div className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Mail className="w-4 h-4 inline mr-2" />
                  Email Address
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    value={contactInfo.email}
                    onChange={(e) => setContactInfo(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="your.email@example.com"
                  />
                ) : (
                  <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">{contactInfo.email || 'Not provided'}</p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Phone className="w-4 h-4 inline mr-2" />
                  Phone Number
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={contactInfo.phone}
                    onChange={(e) => setContactInfo(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="+1-555-0123"
                  />
                ) : (
                  <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">{contactInfo.phone || 'Not provided'}</p>
                )}
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <MapPin className="w-4 h-4 inline mr-2" />
                  Address
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={contactInfo.address}
                    onChange={(e) => setContactInfo(prev => ({ ...prev, address: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="123 Main Street, Community Name"
                  />
                ) : (
                  <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">{contactInfo.address || 'Not provided'}</p>
                )}
              </div>

              {/* Emergency Contact */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <User className="w-4 h-4 inline mr-2" />
                  Emergency Contact
                </label>
                {isEditing ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={contactInfo.emergencyContact}
                      onChange={(e) => setContactInfo(prev => ({ ...prev, emergencyContact: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Emergency contact name"
                    />
                    <input
                      type="tel"
                      value={contactInfo.emergencyPhone}
                      onChange={(e) => setContactInfo(prev => ({ ...prev, emergencyPhone: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Emergency contact phone"
                    />
                  </div>
                ) : (
                  <div className="bg-gray-50 px-3 py-2 rounded-md">
                    <p className="text-gray-900">{contactInfo.emergencyContact || 'Not provided'}</p>
                    {contactInfo.emergencyPhone && (
                      <p className="text-gray-600 text-sm">{contactInfo.emergencyPhone}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Notification Preferences */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Building className="w-4 h-4 inline mr-2" />
                  Notification Preferences
                </label>
                {isEditing ? (
                  <select
                    value={contactInfo.preferredNotification}
                    onChange={(e) => setContactInfo(prev => ({ ...prev, preferredNotification: e.target.value as 'email' | 'sms' | 'both' }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="both">Email and SMS</option>
                    <option value="email">Email only</option>
                    <option value="sms">SMS only</option>
                  </select>
                ) : (
                  <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                    {contactInfo.preferredNotification === 'both' ? 'Email and SMS' :
                     contactInfo.preferredNotification === 'email' ? 'Email only' : 'SMS only'}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Testing Note */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h4 className="text-sm font-medium text-blue-900 mb-2">📧 Testing Real Notifications</h4>
            <p className="text-sm text-blue-700">
              Update your email and phone number to receive real notifications when testing the HOA Connect workflow. 
              All notifications will be sent to the contact information you provide here.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            {isEditing && (
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                disabled={isSaving}
              >
                Cancel
              </button>
            )}
            <button
              onClick={() => { setIsEditing(false); handleSave(); }}
              disabled={isSaving}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
