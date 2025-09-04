import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useDemoContext } from '../../contexts/DemoContext';
import { User, BoardMemberData } from '../../types';
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Shield,
  ShieldCheck,
  Mail,
  Phone,
  Calendar
} from 'lucide-react';

interface BoardMemberFormData {
  name: string;
  email: string;
  phone: string;
  position: BoardMemberData['position'];
  termStart: string;
  termEnd: string;
  mailingAddress: string;
  canManageUsers: boolean;
  communityId: string;
}

const BoardMemberManagement: React.FC = () => {
  const { currentUser } = useAuth();
  const { notifications } = useDemoContext(); // eslint-disable-line @typescript-eslint/no-unused-vars
  const [boardMembers, setBoardMembers] = useState<User[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<BoardMemberFormData>({
    name: '',
    email: '',
    phone: '',
    position: 'member',
    termStart: '',
    termEnd: '',
    mailingAddress: '',
    canManageUsers: false,
    communityId: currentUser?.communityId || 'rancho-madrina'
  });

  // Check if current user can manage board members
  const canManageUsers = () => {
    if (!currentUser) return false;
    
    // HOA Manager always has access
    if (currentUser.role === 'management') return true;
    
    // Board President has access
    if (currentUser.role === 'board_member' && 
        currentUser.boardMemberData?.position === 'president') return true;
    
    // Board members with explicit permission
    if (currentUser.role === 'board_member' && 
        currentUser.boardMemberData?.canManageUsers) return true;
    
    return false;
  };

  // Load board members from localStorage and fallback to mock data
  useEffect(() => {
    const loadBoardMembers = async () => {
      try {
        // First try to load from localStorage
        const demoUsers = JSON.parse(localStorage.getItem('demo-users') || '[]');
        let boardUsers = demoUsers.filter((user: User) => user.role === 'board_member');
        
        // If no board members in localStorage, load from mock data
        if (boardUsers.length === 0) {
          const { getUsersByRole } = await import('../../data/mockData');
          boardUsers = getUsersByRole('board_member');
          
          // Save mock data to localStorage for future use
          const allUsers = [...demoUsers, ...boardUsers];
          localStorage.setItem('demo-users', JSON.stringify(allUsers));
        }
        
        setBoardMembers(boardUsers);
      } catch (error) {
        console.error('Error loading board members:', error);
        // Final fallback to default board members from mockData
        try {
          const { getUsersByRole } = await import('../../data/mockData');
          setBoardMembers(getUsersByRole('board_member'));
        } catch (fallbackError) {
          console.error('Error loading fallback board members:', fallbackError);
          setBoardMembers([]);
        }
      }
    };

    loadBoardMembers();
  }, []);

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      position: 'member',
      termStart: '',
      termEnd: '',
      mailingAddress: '',
      canManageUsers: false,
      communityId: currentUser?.communityId || 'rancho-madrina'
    });
    setEditingUser(null);
    // Don't close the form here - let the caller decide
  };

  const handleAddUser = () => {
    setShowAddForm(true);
    resetForm();
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      position: user.boardMemberData?.position || 'member',
      termStart: user.boardMemberData?.termStart || '',
      termEnd: user.boardMemberData?.termEnd || '',
      mailingAddress: user.homeownerData?.mailingAddress || user.contactInfo?.address || '',
      canManageUsers: user.boardMemberData?.canManageUsers || false,
      communityId: user.communityId || 'rancho-madrina'
    });
    setShowAddForm(true);
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this board member? This action cannot be undone.')) {
      return;
    }

    try {
      // Remove from localStorage
      const demoUsers = JSON.parse(localStorage.getItem('demo-users') || '[]');
      const updatedUsers = demoUsers.filter((user: User) => user.id !== userId);
      localStorage.setItem('demo-users', JSON.stringify(updatedUsers));

      // Update local state
      setBoardMembers(prev => prev.filter(user => user.id !== userId));
      
      alert('Board member deleted successfully!');
    } catch (error) {
      console.error('Error deleting board member:', error);
      alert('Error deleting board member. Please try again.');
    }
  };

  const handleSaveUser = async () => {
    if (!formData.name || !formData.email || !formData.phone) {
      alert('Please fill in all required fields (Name, Email, Phone).');
      return;
    }

    try {
      const userId = editingUser?.id || `board-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const newUser: User = {
        id: userId,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        role: 'board_member',
        communityId: formData.communityId,
        contactInfo: {
          email: formData.email,
          phone: formData.phone,
          address: formData.mailingAddress,
          emergencyContact: '',
          emergencyPhone: '',
          preferredNotification: 'both'
        },
        boardMemberData: {
          position: formData.position,
          termStart: formData.termStart,
          termEnd: formData.termEnd,
          canManageUsers: formData.canManageUsers
        }
      };

      // Update localStorage
      const demoUsers = JSON.parse(localStorage.getItem('demo-users') || '[]');
      
      if (editingUser) {
        // Update existing user
        const userIndex = demoUsers.findIndex((user: User) => user.id === editingUser.id);
        if (userIndex >= 0) {
          demoUsers[userIndex] = newUser;
        }
      } else {
        // Add new user
        demoUsers.push(newUser);
      }
      
      localStorage.setItem('demo-users', JSON.stringify(demoUsers));

      // Update local state
      if (editingUser) {
        setBoardMembers(prev => prev.map(user => user.id === editingUser.id ? newUser : user));
      } else {
        setBoardMembers(prev => [...prev, newUser]);
      }

      resetForm();
      setShowAddForm(false);
      alert(`Board member ${editingUser ? 'updated' : 'added'} successfully!`);
    } catch (error) {
      console.error('Error saving board member:', error);
      alert('Error saving board member. Please try again.');
    }
  };

  

  const getPositionLabel = (position: string) => {
    const labels: Record<string, string> = {
      president: 'President',
      vice_president: 'Vice President',
      treasurer: 'Treasurer',
      secretary: 'Secretary',
      member: 'Member'
    };
    return labels[position] || position;
  };

  const getPositionColor = (position: string) => {
    const colors: Record<string, string> = {
      president: 'bg-purple-100 text-purple-800',
      vice_president: 'bg-blue-100 text-blue-800',
      treasurer: 'bg-green-100 text-green-800',
      secretary: 'bg-yellow-100 text-yellow-800',
      member: 'bg-gray-100 text-gray-800'
    };
    return colors[position] || 'bg-gray-100 text-gray-800';
  };

  const getCommunityName = (communityId: string) => {
    const communities: Record<string, string> = {
      'rancho-madrina': 'Rancho Madrina',
      'oak-valley': 'Oak Valley'
    };
    return communities[communityId] || communityId;
  };

  if (!canManageUsers()) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">
            You don't have permission to manage board members. Only HOA Managers and Board Presidents 
            (or board members with explicit permission) can access this feature.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Users className="w-8 h-8 mr-3 text-blue-600" />
              Board Member Management
            </h1>
            <p className="text-gray-600 mt-2">
              Manage board members, their positions, and permissions
            </p>
          </div>
          <button
            onClick={handleAddUser}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Board Member
          </button>
        </div>
      </div>

      {/* Board Members List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Current Board Members ({boardMembers.length})
          </h2>
        </div>
        
        {boardMembers.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No board members found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Member
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Position
                  </th>
                  {currentUser?.role === 'management' && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Community
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Term
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {boardMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-1">
                          <div className="flex items-center">
                            <div className="text-sm font-medium text-gray-900">{member.name}</div>
                            {member.boardMemberData?.canManageUsers && (
                              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                <ShieldCheck className="w-3 h-3 mr-1" />
                                Admin
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center mt-1">
                            <Mail className="w-4 h-4 mr-1" />
                            {member.email}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center mt-1">
                            <Phone className="w-4 h-4 mr-1" />
                            {member.phone}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPositionColor(member.boardMemberData?.position || 'member')}`}>
                        {getPositionLabel(member.boardMemberData?.position || 'member')}
                      </span>
                    </td>
                    {currentUser?.role === 'management' && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <div className={`w-2 h-2 rounded-full mr-2 ${member.communityId === 'rancho-madrina' ? 'bg-blue-500' : 'bg-green-500'}`}></div>
                          {getCommunityName(member.communityId)}
                        </div>
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                        <div>
                          <div>{member.boardMemberData?.termStart ? new Date(member.boardMemberData.termStart).getFullYear() : 'N/A'}</div>
                          <div className="text-xs text-gray-500">
                            to {member.boardMemberData?.termEnd ? new Date(member.boardMemberData.termEnd).getFullYear() : 'N/A'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditUser(member)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit board member"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(member.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete board member"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingUser ? 'Edit Board Member' : 'Add New Board Member'}
                </h3>
                <button
                  onClick={() => {
                    resetForm();
                    setShowAddForm(false);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="px-6 py-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Position
                  </label>
                  <select
                    value={formData.position}
                    onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value as BoardMemberData['position'] }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="member">Member</option>
                    <option value="secretary">Secretary</option>
                    <option value="treasurer">Treasurer</option>
                    <option value="vice_president">Vice President</option>
                    <option value="president">President</option>
                  </select>
                </div>

                {currentUser?.role === 'management' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Community Assignment
                    </label>
                    <select
                      value={formData.communityId}
                      onChange={(e) => setFormData(prev => ({ ...prev, communityId: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="rancho-madrina">Rancho Madrina Community Association</option>
                      <option value="oak-valley">Oak Valley Community Association</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter email address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="(949) 555-0123"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Term Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.termStart}
                    onChange={(e) => setFormData(prev => ({ ...prev, termStart: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Term End Date
                  </label>
                  <input
                    type="date"
                    value={formData.termEnd}
                    onChange={(e) => setFormData(prev => ({ ...prev, termEnd: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mailing Address
                </label>
                <textarea
                  value={formData.mailingAddress}
                  onChange={(e) => setFormData(prev => ({ ...prev, mailingAddress: e.target.value }))}
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter mailing address"
                />
              </div>

              {currentUser?.role === 'management' && (
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="canManageUsers"
                    checked={formData.canManageUsers}
                    onChange={(e) => setFormData(prev => ({ ...prev, canManageUsers: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="canManageUsers" className="ml-2 block text-sm text-gray-900">
                    Grant user management permissions
                  </label>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  resetForm();
                  setShowAddForm(false);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveUser}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors flex items-center"
              >
                <Save className="w-4 h-4 mr-2" />
                {editingUser ? 'Update' : 'Add'} Board Member
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BoardMemberManagement;
