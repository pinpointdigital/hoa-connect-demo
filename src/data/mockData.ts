import { 
  User, Community, Form, Notification 
} from '../types';

// Demo Community Data - Rancho Madrina Community Association
export const DEMO_COMMUNITY: Community = {
  id: 'rancho-madrina',
  name: 'Rancho Madrina Community Association',
  address: '26840 Aliso Viejo Parkway, Suite 100, Aliso Viejo, CA 92656',
  managementCompany: 'Seabreeze Management Company',
  totalHomeowners: 847,
  establishedDate: '1995-03-15',
  ccrs: [
    {
      id: 'ccr-4-2',
      section: '4.2',
      title: 'Exterior Color Guidelines',
      content: 'All exterior paint colors must be earth tones and approved by the Architectural Review Committee. Approved colors include: beige, tan, sage green, desert sand, warm gray, and terra cotta. Bright or neon colors are prohibited.',
      category: 'architectural'
    },
    {
      id: 'ccr-4-1',
      section: '4.1',
      title: 'Architectural Modifications',
      content: 'Any exterior modifications including but not limited to paint, landscaping, structures, or additions require prior written approval from the HOA Board of Directors.',
      category: 'architectural'
    },
    {
      id: 'ccr-3-1',
      section: '3.1',
      title: 'Neighbor Notification',
      content: 'Homeowners must notify and obtain approval from immediately adjacent neighbors for any modifications that may affect their property views or enjoyment.',
      category: 'architectural'
    }
  ],
  boardMembers: ['robert-ferguson', 'dean-martin', 'frank-sinatra', 'david-kim', 'patricia-williams'],
  managementStaff: ['allan-chua']
};

// Second Demo Community - Oak Valley Community Association
export const OAK_VALLEY_COMMUNITY: Community = {
  id: 'oak-valley',
  name: 'Oak Valley Community Association',
  address: '15200 Oak Valley Drive, Suite 200, Irvine, CA 92618',
  managementCompany: 'Seabreeze Management Company',
  totalHomeowners: 623,
  establishedDate: '2001-08-20',
  ccrs: [
    {
      id: 'ov-ccr-4-2',
      section: '4.2',
      title: 'Exterior Color Guidelines',
      content: 'All exterior paint colors must be neutral tones and approved by the Architectural Review Committee. Approved colors include: cream, ivory, light gray, soft beige, and muted blue-gray. Bold or bright colors are prohibited.',
      category: 'architectural'
    },
    {
      id: 'ov-ccr-4-1',
      section: '4.1',
      title: 'Architectural Modifications',
      content: 'Any exterior modifications including but not limited to paint, landscaping, structures, or additions require prior written approval from the HOA Board of Directors.',
      category: 'architectural'
    },
    {
      id: 'ov-ccr-3-1',
      section: '3.1',
      title: 'Neighbor Notification',
      content: 'Homeowners must notify and obtain approval from immediately adjacent neighbors for any modifications that may affect their property views or enjoyment.',
      category: 'architectural'
    }
  ],
  boardMembers: ['robert-ferguson', 'dean-martin', 'frank-sinatra', 'david-kim', 'patricia-williams'],
  managementStaff: ['allan-chua']
};

// Export both communities
export const DEMO_COMMUNITIES = [DEMO_COMMUNITY, OAK_VALLEY_COMMUNITY];

// Demo Users
export const DEMO_USERS: User[] = [
  // Homeowner - Jason Abustan
  {
    id: 'jason-abustan',
    email: 'jason.abustan@email.com',
    name: 'Jason Abustan',
    role: 'homeowner',
    phone: '(949) 555-0123',
    communityId: 'rancho-madrina',
    contactInfo: {
      email: 'hello@pinpointdigital.us',
      phone: '+16199274774',
      address: '123 Oak Street, Rancho Madrina Community',
      emergencyContact: 'Maria Abustan',
      emergencyPhone: '(949) 555-0124',
      preferredNotification: 'both'
    },
    homeownerData: {
      address: '123 Oak Street, Rancho Madrina Community',
      mailingAddress: '123 Oak Street, Rancho Madrina Community',
      moveInDate: '2019-03-15',
      propertyType: 'Single Family Home',
      emergencyContact: {
        name: 'Maria Abustan',
        phone: '(949) 555-0124',
        email: 'maria.abustan@email.com',
        relationship: 'Spouse'
      }
    }
  },
  // Management Company - Allan Chua
  {
    id: 'allan-chua',
    email: 'allan.chua@seabreezemgmt.com',
    name: 'Allan Chua',
    role: 'management',
    phone: '(800) 232-7517',
    communityId: 'rancho-madrina',
    contactInfo: {
      email: 'hello@pinpointdigital.us',
      phone: '+16198817203',
      address: '26840 Aliso Viejo Parkway, Suite 100, Aliso Viejo, CA 92656',
      emergencyContact: 'Seabreeze Management',
      emergencyPhone: '(800) 232-7518',
      preferredNotification: 'both'
    },
    managementData: {
      companyName: 'Seabreeze Management Company',
      title: 'Community Manager',
      permissions: ['review_requests', 'manage_forms', 'send_notifications', 'manage_vendors'],
      managedCommunities: ['rancho-madrina', 'oak-valley']
    }
  },
  // Board Members
  {
    id: 'robert-ferguson',
    email: 'robert.ferguson@email.com',
    name: 'Robert Ferguson',
    role: 'board_member',
    phone: '(949) 555-0200',
    communityId: 'rancho-madrina',
    contactInfo: {
      email: 'hello@pinpointdigital.us',
      phone: '+16199274774',
      address: '456 Pine Street, Rancho Madrina Community',
      emergencyContact: 'Susan Ferguson',
      emergencyPhone: '(949) 555-0203',
      preferredNotification: 'both'
    },
    boardMemberData: {
      position: 'president',
      termStart: '2023-01-01',
      termEnd: '2024-12-31'
    }
  },
  {
    id: 'dean-martin',
    email: 'dean.martin@email.com',
    name: 'Dean Martin',
    role: 'board_member',
    phone: '(949) 555-0201',
    communityId: 'rancho-madrina',
    contactInfo: {
      email: 'hello@pinpointdigital.us',
      phone: '+16199274774',
      address: '789 Maple Street, Rancho Madrina Community',
      emergencyContact: 'Betty Martin',
      emergencyPhone: '(949) 555-0204',
      preferredNotification: 'both'
    },
    boardMemberData: {
      position: 'vice_president',
      termStart: '2023-01-01',
      termEnd: '2024-12-31'
    }
  },
  {
    id: 'frank-sinatra',
    email: 'frank.sinatra@email.com',
    name: 'Frank Sinatra',
    role: 'board_member',
    phone: '(949) 555-0202',
    communityId: 'rancho-madrina',
    contactInfo: {
      email: 'hello@pinpointdigital.us',
      phone: '+16199274774',
      address: '321 Cedar Street, Rancho Madrina Community',
      emergencyContact: 'Nancy Sinatra',
      emergencyPhone: '(949) 555-0205',
      preferredNotification: 'both'
    },
    boardMemberData: {
      position: 'treasurer',
      termStart: '2023-01-01',
      termEnd: '2024-12-31'
    }
  },
  {
    id: 'david-kim',
    email: 'david.kim@email.com',
    name: 'David Kim',
    role: 'board_member',
    phone: '(949) 555-0203',
    communityId: 'rancho-madrina',
    contactInfo: {
      email: 'hello@pinpointdigital.us',
      phone: '+16199274774',
      address: '567 Elm Street, Rancho Madrina Community',
      emergencyContact: 'Lisa Kim',
      emergencyPhone: '(949) 555-0206',
      preferredNotification: 'both'
    },
    boardMemberData: {
      position: 'secretary',
      termStart: '2023-01-01',
      termEnd: '2024-12-31'
    }
  },
  {
    id: 'patricia-williams',
    email: 'patricia.williams@email.com',
    name: 'Patricia Williams',
    role: 'board_member',
    phone: '(949) 555-0204',
    communityId: 'rancho-madrina',
    contactInfo: {
      email: 'hello@pinpointdigital.us',
      phone: '+16199274774',
      address: '890 Birch Street, Rancho Madrina Community',
      emergencyContact: 'John Williams',
      emergencyPhone: '(949) 555-0207',
      preferredNotification: 'both'
    },
    boardMemberData: {
      position: 'member',
      termStart: '2023-01-01',
      termEnd: '2024-12-31'
    }
  },
  // Neighbors
  {
    id: 'robert-thompson',
    email: 'robert.thompson@email.com',
    name: 'Robert Thompson',
    role: 'homeowner',
    phone: '(949) 555-0125',
    communityId: 'rancho-madrina',
    homeownerData: {
      address: '121 Oak Street, Rancho Madrina Community',
      moveInDate: '2018-06-01',
      propertyType: 'Single Family Home'
    }
  },
  {
    id: 'james-davis',
    email: 'james.davis@email.com',
    name: 'James Davis',
    role: 'homeowner',
    phone: '(949) 555-0126',
    communityId: 'rancho-madrina',
    homeownerData: {
      address: '125 Oak Street, Rancho Madrina Community',
      moveInDate: '2020-01-15',
      propertyType: 'Single Family Home'
    }
  },
  {
    id: 'carlos-gonzalez',
    email: 'carlos.gonzalez@email.com',
    name: 'Carlos Gonzalez',
    role: 'homeowner',
    phone: '(949) 555-0127',
    communityId: 'rancho-madrina',
    homeownerData: {
      address: '124 Maple Street, Rancho Madrina Community',
      moveInDate: '2021-08-10',
      propertyType: 'Single Family Home'
    }
  }
];

// No preset demo requests - start with clean slate for live demo

// Owner Notice Disclosure Form
export const OWNER_NOTICE_DISCLOSURE_FORM: Form = {
  id: 'form-owner-notice-2025',
  name: 'Owner Notice Disclosure',
  description: 'Annual disclosure form required by California Civil Code Section 5552',
  type: 'owner_notice_disclosure',
  fields: [
    {
      id: 'owner_name',
      name: 'owner_name',
      label: 'Owner Name',
      type: 'text',
      required: true
    },
    {
      id: 'owner_phone_home',
      name: 'owner_phone_home',
      label: 'Home Phone',
      type: 'phone',
      required: false
    },
    {
      id: 'owner_phone_cell',
      name: 'owner_phone_cell',
      label: 'Cell Phone',
      type: 'phone',
      required: false
    },
    {
      id: 'owner_email',
      name: 'owner_email',
      label: 'Email Address',
      type: 'email',
      required: true
    },
    {
      id: 'property_address',
      name: 'property_address',
      label: 'Property Address',
      type: 'text',
      required: true
    },
    {
      id: 'mailing_address',
      name: 'mailing_address',
      label: 'Mailing Address',
      type: 'text',
      required: true
    },
    {
      id: 'valid_email',
      name: 'valid_email',
      label: 'Valid Email for Electronic Delivery',
      type: 'email',
      required: true
    },
    {
      id: 'secondary_mailing',
      name: 'secondary_mailing',
      label: 'Secondary Mailing Address (Optional)',
      type: 'text',
      required: false
    },
    {
      id: 'secondary_email',
      name: 'secondary_email',
      label: 'Secondary Email (Optional)',
      type: 'email',
      required: false
    },
    {
      id: 'delivery_preference',
      name: 'delivery_preference',
      label: 'Delivery Preference',
      type: 'select',
      required: true,
      options: ['Email address', 'Mailing address', 'Both email and mailing address']
    },
    {
      id: 'tenant_name',
      name: 'tenant_name',
      label: 'Tenant Name (if applicable)',
      type: 'text',
      required: false
    },
    {
      id: 'tenant_phone',
      name: 'tenant_phone',
      label: 'Tenant Phone (if applicable)',
      type: 'phone',
      required: false
    },
    {
      id: 'tenant_email',
      name: 'tenant_email',
      label: 'Tenant Email (if applicable)',
      type: 'email',
      required: false
    }
  ],
  dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days from now
  requiredSignature: false,
  communityId: 'rancho-madrina'

};

// Demo Notifications
export const DEMO_NOTIFICATIONS: Notification[] = [
  {
    id: 'notif-request-submitted',
    userId: 'jason-abustan',
    type: 'request_submitted',
    title: 'Request Submitted Successfully',
    message: 'Your patio painting request has been submitted and is under management review.',
    status: 'unread',
    priority: 'medium',
    createdAt: new Date().toISOString(),
    actionUrl: '/homeowner/requests/req-demo-001'
  },

  {
    id: 'notif-form-due',
    userId: 'jason-abustan',
    type: 'form_due',
    title: 'Annual Form Required',
    message: 'Owner Notice Disclosure form is due in 10 days.',
    status: 'unread',
    priority: 'high',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    actionUrl: '/homeowner/forms/form-owner-notice-2025'
  }
];

// Helper functions
export const getUserById = (id: string): User | undefined => {
  return DEMO_USERS.find(user => user.id === id);
};

export const getUsersByRole = (role: User['role']): User[] => {
  return DEMO_USERS.filter(user => user.role === role);
};

export const getBoardMembers = (): User[] => {
  return DEMO_USERS.filter(user => user.role === 'board_member');
};

export const getManagementStaff = (): User[] => {
  return DEMO_USERS.filter(user => user.role === 'management');
};

export const getHomeowners = (): User[] => {
  return DEMO_USERS.filter(user => user.role === 'homeowner');
};

export const getCCRSection = (sectionId: string) => {
  return DEMO_COMMUNITY.ccrs.find(ccr => ccr.id === sectionId);
};