# HOA Connect - Multi-Level Access Management System

## 🎯 Overview
This document outlines the comprehensive access management system for HOA Connect, handling multiple HOA Management Companies, their teams, board members, and homeowners with granular permissions and role-based access control.

## 🏢 User Hierarchy & Access Levels

### **Level 1: Platform Administrators (HOA Connect)**
- **Super Admin**: Full platform access, tenant management
- **Support Admin**: Customer support, limited tenant access
- **Billing Admin**: Billing management, usage analytics

### **Level 2: HOA Management Companies (Tenants)**
- **Company Owner**: Full company access, billing, user management
- **Company Admin**: User management, community setup, reporting
- **Property Manager**: Day-to-day operations, request management
- **Assistant Manager**: Limited operations, read-only access

### **Level 3: HOA Boards (Per Community)**
- **Board President**: Full board access, voting, approvals
- **Board Vice President**: Most board functions, backup authority
- **Board Secretary**: Meeting management, document access
- **Board Treasurer**: Financial oversight, budget access
- **Board Member**: Voting rights, limited administrative access

### **Level 4: Homeowners (Per Community)**
- **Homeowner**: Submit requests, view personal data, community info
- **Tenant/Renter**: Limited access based on homeowner permissions

## 🔐 Role-Based Access Control (RBAC) Architecture

### **Permission Categories**

```javascript
const PERMISSIONS = {
  // Platform Management
  PLATFORM: {
    MANAGE_TENANTS: 'platform:manage_tenants',
    VIEW_ALL_ANALYTICS: 'platform:view_all_analytics',
    MANAGE_BILLING: 'platform:manage_billing',
    SYSTEM_SETTINGS: 'platform:system_settings'
  },
  
  // Company Management
  COMPANY: {
    MANAGE_USERS: 'company:manage_users',
    MANAGE_COMMUNITIES: 'company:manage_communities',
    VIEW_ANALYTICS: 'company:view_analytics',
    MANAGE_BILLING: 'company:manage_billing',
    COMPANY_SETTINGS: 'company:settings'
  },
  
  // Community Management
  COMMUNITY: {
    MANAGE_REQUESTS: 'community:manage_requests',
    MANAGE_FORMS: 'community:manage_forms',
    SEND_COMMUNICATIONS: 'community:send_communications',
    VIEW_HOMEOWNERS: 'community:view_homeowners',
    MANAGE_DOCUMENTS: 'community:manage_documents'
  },
  
  // Board Functions
  BOARD: {
    VOTE_ON_REQUESTS: 'board:vote_requests',
    MANAGE_MEETINGS: 'board:manage_meetings',
    VIEW_FINANCIALS: 'board:view_financials',
    APPROVE_BUDGETS: 'board:approve_budgets',
    MANAGE_POLICIES: 'board:manage_policies'
  },
  
  // Homeowner Functions
  HOMEOWNER: {
    SUBMIT_REQUESTS: 'homeowner:submit_requests',
    VIEW_OWN_DATA: 'homeowner:view_own_data',
    PAY_FEES: 'homeowner:pay_fees',
    VIEW_DOCUMENTS: 'homeowner:view_documents',
    COMMUNICATION_PREFS: 'homeowner:communication_prefs'
  }
};
```

### **Role Definitions**

```javascript
const ROLES = {
  // Platform Level
  SUPER_ADMIN: {
    name: 'Super Administrator',
    level: 'platform',
    permissions: [
      PERMISSIONS.PLATFORM.MANAGE_TENANTS,
      PERMISSIONS.PLATFORM.VIEW_ALL_ANALYTICS,
      PERMISSIONS.PLATFORM.MANAGE_BILLING,
      PERMISSIONS.PLATFORM.SYSTEM_SETTINGS
    ]
  },
  
  // Company Level
  COMPANY_OWNER: {
    name: 'Company Owner',
    level: 'company',
    permissions: [
      PERMISSIONS.COMPANY.MANAGE_USERS,
      PERMISSIONS.COMPANY.MANAGE_COMMUNITIES,
      PERMISSIONS.COMPANY.VIEW_ANALYTICS,
      PERMISSIONS.COMPANY.MANAGE_BILLING,
      PERMISSIONS.COMPANY.COMPANY_SETTINGS,
      // Inherit all community permissions
      ...Object.values(PERMISSIONS.COMMUNITY),
      // Limited board permissions for oversight
      PERMISSIONS.BOARD.VIEW_FINANCIALS
    ]
  },
  
  PROPERTY_MANAGER: {
    name: 'Property Manager',
    level: 'company',
    permissions: [
      PERMISSIONS.COMMUNITY.MANAGE_REQUESTS,
      PERMISSIONS.COMMUNITY.MANAGE_FORMS,
      PERMISSIONS.COMMUNITY.SEND_COMMUNICATIONS,
      PERMISSIONS.COMMUNITY.VIEW_HOMEOWNERS,
      PERMISSIONS.COMMUNITY.MANAGE_DOCUMENTS
    ]
  },
  
  // Board Level
  BOARD_PRESIDENT: {
    name: 'Board President',
    level: 'board',
    permissions: [
      PERMISSIONS.BOARD.VOTE_ON_REQUESTS,
      PERMISSIONS.BOARD.MANAGE_MEETINGS,
      PERMISSIONS.BOARD.VIEW_FINANCIALS,
      PERMISSIONS.BOARD.APPROVE_BUDGETS,
      PERMISSIONS.BOARD.MANAGE_POLICIES,
      // Limited community access
      PERMISSIONS.COMMUNITY.VIEW_HOMEOWNERS,
      PERMISSIONS.COMMUNITY.MANAGE_DOCUMENTS
    ]
  },
  
  BOARD_MEMBER: {
    name: 'Board Member',
    level: 'board',
    permissions: [
      PERMISSIONS.BOARD.VOTE_ON_REQUESTS,
      PERMISSIONS.BOARD.VIEW_FINANCIALS,
      PERMISSIONS.COMMUNITY.VIEW_HOMEOWNERS
    ]
  },
  
  // Homeowner Level
  HOMEOWNER: {
    name: 'Homeowner',
    level: 'homeowner',
    permissions: [
      PERMISSIONS.HOMEOWNER.SUBMIT_REQUESTS,
      PERMISSIONS.HOMEOWNER.VIEW_OWN_DATA,
      PERMISSIONS.HOMEOWNER.PAY_FEES,
      PERMISSIONS.HOMEOWNER.VIEW_DOCUMENTS,
      PERMISSIONS.HOMEOWNER.COMMUNICATION_PREFS
    ]
  }
};
```

## 🗄️ Database Schema for Access Management

### **Core Tables**

```sql
-- Tenants (HOA Management Companies)
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  domain VARCHAR(255),
  status VARCHAR(20) DEFAULT 'active',
  subscription_plan VARCHAR(50),
  max_communities INTEGER DEFAULT 10,
  max_homeowners INTEGER DEFAULT 5000,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Communities (HOAs managed by companies)
CREATE TABLE communities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  name VARCHAR(255) NOT NULL,
  address TEXT,
  total_units INTEGER,
  hoa_fee_amount DECIMAL(10,2),
  hoa_fee_frequency VARCHAR(20) DEFAULT 'monthly',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Users (All user types)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  community_id UUID REFERENCES communities(id),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(20),
  status VARCHAR(20) DEFAULT 'active',
  email_verified BOOLEAN DEFAULT false,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- User Roles (Many-to-many with context)
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  role VARCHAR(50) NOT NULL,
  context_type VARCHAR(20), -- 'platform', 'tenant', 'community'
  context_id UUID, -- References tenant_id or community_id
  granted_by UUID REFERENCES users(id),
  granted_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true
);

-- Permissions (Granular permission tracking)
CREATE TABLE user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  permission VARCHAR(100) NOT NULL,
  context_type VARCHAR(20),
  context_id UUID,
  granted_by UUID REFERENCES users(id),
  granted_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true
);

-- Homeowner Properties
CREATE TABLE homeowner_properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  community_id UUID REFERENCES communities(id),
  property_address TEXT NOT NULL,
  unit_number VARCHAR(20),
  lot_number VARCHAR(20),
  property_type VARCHAR(50),
  ownership_type VARCHAR(20) DEFAULT 'owner', -- 'owner', 'tenant'
  move_in_date DATE,
  is_primary_residence BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Access Logs (Audit trail)
CREATE TABLE access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  resource VARCHAR(100),
  resource_id UUID,
  ip_address INET,
  user_agent TEXT,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 🔑 Authentication & Authorization Flow

### **Multi-Factor Authentication**

```javascript
// JWT Token Structure
const tokenPayload = {
  userId: 'uuid',
  tenantId: 'uuid',
  communityIds: ['uuid1', 'uuid2'], // Communities user has access to
  roles: [
    {
      role: 'PROPERTY_MANAGER',
      context: 'tenant',
      contextId: 'tenant-uuid'
    },
    {
      role: 'BOARD_MEMBER',
      context: 'community',
      contextId: 'community-uuid'
    }
  ],
  permissions: ['community:manage_requests', 'board:vote_requests'],
  sessionId: 'uuid',
  exp: 1234567890
};
```

### **Permission Checking Middleware**

```javascript
const checkPermission = (requiredPermission, contextType = null) => {
  return async (req, res, next) => {
    try {
      const user = req.user;
      const contextId = req.params.tenantId || req.params.communityId;
      
      // Check if user has the required permission
      const hasPermission = await PermissionService.checkUserPermission(
        user.id,
        requiredPermission,
        contextType,
        contextId
      );
      
      if (!hasPermission) {
        return res.status(403).json({
          error: 'Insufficient permissions',
          required: requiredPermission,
          context: contextType
        });
      }
      
      next();
    } catch (error) {
      res.status(500).json({ error: 'Permission check failed' });
    }
  };
};

// Usage examples
app.get('/api/communities/:communityId/requests', 
  authenticate,
  checkPermission('community:manage_requests', 'community'),
  getRequests
);

app.post('/api/board/:communityId/vote',
  authenticate,
  checkPermission('board:vote_requests', 'community'),
  castVote
);
```

## 👥 User Onboarding & Management

### **Company Onboarding Flow**

```javascript
const onboardCompany = async (companyData) => {
  const transaction = await db.beginTransaction();
  
  try {
    // 1. Create tenant
    const tenant = await createTenant({
      name: companyData.companyName,
      slug: generateSlug(companyData.companyName),
      domain: companyData.domain,
      subscription_plan: companyData.plan
    });
    
    // 2. Create company owner
    const owner = await createUser({
      tenant_id: tenant.id,
      email: companyData.ownerEmail,
      first_name: companyData.ownerFirstName,
      last_name: companyData.ownerLastName,
      password_hash: await hashPassword(companyData.password)
    });
    
    // 3. Assign company owner role
    await assignRole(owner.id, 'COMPANY_OWNER', 'tenant', tenant.id);
    
    // 4. Create initial community (if provided)
    if (companyData.initialCommunity) {
      const community = await createCommunity({
        tenant_id: tenant.id,
        name: companyData.initialCommunity.name,
        address: companyData.initialCommunity.address,
        total_units: companyData.initialCommunity.totalUnits
      });
    }
    
    // 5. Send welcome email
    await sendWelcomeEmail(owner.email, {
      companyName: tenant.name,
      loginUrl: `https://${tenant.slug}.hoaconnect.com`,
      setupUrl: `https://${tenant.slug}.hoaconnect.com/setup`
    });
    
    await transaction.commit();
    return { tenant, owner };
    
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};
```

### **Team Member Invitation System**

```javascript
const inviteTeamMember = async (inviterUserId, invitationData) => {
  try {
    // 1. Validate inviter has permission
    const canInvite = await checkPermission(
      inviterUserId, 
      'company:manage_users'
    );
    
    if (!canInvite) {
      throw new Error('Insufficient permissions to invite users');
    }
    
    // 2. Create invitation
    const invitation = await createInvitation({
      tenant_id: invitationData.tenantId,
      community_id: invitationData.communityId,
      email: invitationData.email,
      role: invitationData.role,
      invited_by: inviterUserId,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });
    
    // 3. Send invitation email
    await sendInvitationEmail(invitationData.email, {
      inviterName: inviterUserId.name,
      companyName: invitationData.companyName,
      role: invitationData.role,
      acceptUrl: `https://hoaconnect.com/accept-invitation/${invitation.token}`
    });
    
    return invitation;
    
  } catch (error) {
    logger.error('Failed to invite team member:', error);
    throw error;
  }
};
```

## 🏠 Homeowner Self-Registration

### **Community Access Codes**

```javascript
// Generate unique access codes for communities
const generateCommunityAccessCode = async (communityId) => {
  const code = generateRandomCode(8); // e.g., "HC-2024-ABCD"
  
  await db.query(`
    INSERT INTO community_access_codes (
      community_id, code, created_by, expires_at, max_uses
    ) VALUES ($1, $2, $3, $4, $5)
  `, [communityId, code, userId, expiresAt, maxUses]);
  
  return code;
};

// Homeowner registration with access code
const registerHomeowner = async (registrationData) => {
  try {
    // 1. Validate access code
    const accessCode = await validateAccessCode(
      registrationData.accessCode,
      registrationData.propertyAddress
    );
    
    if (!accessCode) {
      throw new Error('Invalid or expired access code');
    }
    
    // 2. Create user account
    const user = await createUser({
      tenant_id: accessCode.tenant_id,
      community_id: accessCode.community_id,
      email: registrationData.email,
      first_name: registrationData.firstName,
      last_name: registrationData.lastName,
      phone: registrationData.phone,
      password_hash: await hashPassword(registrationData.password)
    });
    
    // 3. Create property record
    await createHomeownerProperty({
      user_id: user.id,
      community_id: accessCode.community_id,
      property_address: registrationData.propertyAddress,
      unit_number: registrationData.unitNumber,
      ownership_type: registrationData.ownershipType
    });
    
    // 4. Assign homeowner role
    await assignRole(user.id, 'HOMEOWNER', 'community', accessCode.community_id);
    
    // 5. Send verification email
    await sendEmailVerification(user.email);
    
    return user;
    
  } catch (error) {
    logger.error('Homeowner registration failed:', error);
    throw error;
  }
};
```

## 🔄 Role Transitions & Permissions

### **Dynamic Role Assignment**

```javascript
// Board member appointment
const appointBoardMember = async (appointerId, homeownerId, communityId, boardRole) => {
  try {
    // 1. Verify appointer has authority
    const canAppoint = await checkPermission(
      appointerId,
      'board:manage_members',
      'community',
      communityId
    );
    
    if (!canAppoint) {
      throw new Error('Insufficient permissions to appoint board members');
    }
    
    // 2. Check if homeowner is eligible
    const homeowner = await getHomeownerByCommunity(homeownerId, communityId);
    if (!homeowner) {
      throw new Error('User is not a homeowner in this community');
    }
    
    // 3. Assign board role (with expiration)
    await assignRole(homeownerId, boardRole, 'community', communityId, {
      expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      granted_by: appointerId
    });
    
    // 4. Log the appointment
    await logActivity({
      user_id: appointerId,
      action: 'BOARD_MEMBER_APPOINTED',
      target_user_id: homeownerId,
      community_id: communityId,
      details: { role: boardRole }
    });
    
    // 5. Notify the new board member
    await sendBoardAppointmentNotification(homeownerId, {
      role: boardRole,
      communityName: homeowner.community.name,
      appointedBy: appointerId.name
    });
    
    return true;
    
  } catch (error) {
    logger.error('Board member appointment failed:', error);
    throw error;
  }
};
```

## 📊 Access Analytics & Reporting

### **User Activity Monitoring**

```javascript
const getUserActivityReport = async (tenantId, filters = {}) => {
  try {
    const query = `
      SELECT 
        u.first_name || ' ' || u.last_name as user_name,
        u.email,
        ur.role,
        COUNT(al.id) as total_actions,
        MAX(al.created_at) as last_activity,
        COUNT(CASE WHEN al.created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as actions_last_30_days
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_active = true
      LEFT JOIN access_logs al ON u.id = al.user_id
      WHERE u.tenant_id = $1
      AND ($2::timestamp IS NULL OR al.created_at >= $2)
      AND ($3::timestamp IS NULL OR al.created_at <= $3)
      GROUP BY u.id, u.first_name, u.last_name, u.email, ur.role
      ORDER BY last_activity DESC
    `;
    
    const result = await db.query(query, [
      tenantId,
      filters.startDate,
      filters.endDate
    ]);
    
    return result.rows;
    
  } catch (error) {
    logger.error('Failed to generate user activity report:', error);
    throw error;
  }
};
```

## 🔒 Security Features

### **Session Management**

```javascript
const SessionManager = {
  // Create secure session
  async createSession(userId, deviceInfo) {
    const sessionId = generateSecureToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    await db.query(`
      INSERT INTO user_sessions (
        id, user_id, device_info, ip_address, expires_at
      ) VALUES ($1, $2, $3, $4, $5)
    `, [sessionId, userId, deviceInfo, req.ip, expiresAt]);
    
    return sessionId;
  },
  
  // Validate session
  async validateSession(sessionId) {
    const session = await db.query(`
      SELECT s.*, u.status as user_status
      FROM user_sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.id = $1 AND s.expires_at > NOW() AND s.is_active = true
    `, [sessionId]);
    
    if (session.rows.length === 0) {
      return null;
    }
    
    // Update last activity
    await db.query(`
      UPDATE user_sessions 
      SET last_activity = NOW() 
      WHERE id = $1
    `, [sessionId]);
    
    return session.rows[0];
  },
  
  // Revoke session
  async revokeSession(sessionId) {
    await db.query(`
      UPDATE user_sessions 
      SET is_active = false, revoked_at = NOW()
      WHERE id = $1
    `, [sessionId]);
  }
};
```

### **IP Whitelisting & Geo-Restrictions**

```javascript
const checkIPAccess = async (userId, ipAddress) => {
  // Check if user has IP restrictions
  const restrictions = await db.query(`
    SELECT allowed_ips, blocked_countries
    FROM user_security_settings
    WHERE user_id = $1
  `, [userId]);
  
  if (restrictions.rows.length === 0) {
    return true; // No restrictions
  }
  
  const settings = restrictions.rows[0];
  
  // Check IP whitelist
  if (settings.allowed_ips && settings.allowed_ips.length > 0) {
    const isAllowed = settings.allowed_ips.some(allowedIP => 
      ipAddress.startsWith(allowedIP)
    );
    
    if (!isAllowed) {
      return false;
    }
  }
  
  // Check geo-restrictions
  if (settings.blocked_countries && settings.blocked_countries.length > 0) {
    const country = await getCountryFromIP(ipAddress);
    
    if (settings.blocked_countries.includes(country)) {
      return false;
    }
  }
  
  return true;
};
```

## 📱 Mobile App Considerations

### **Device Registration**

```javascript
const registerDevice = async (userId, deviceData) => {
  try {
    const deviceId = generateDeviceId();
    
    await db.query(`
      INSERT INTO user_devices (
        id, user_id, device_type, device_name, 
        push_token, fingerprint, registered_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
    `, [
      deviceId,
      userId,
      deviceData.type, // 'ios', 'android', 'web'
      deviceData.name,
      deviceData.pushToken,
      deviceData.fingerprint
    ]);
    
    return deviceId;
    
  } catch (error) {
    logger.error('Device registration failed:', error);
    throw error;
  }
};
```

## 🎯 Implementation Checklist

### **Phase 1: Core Access Management (Weeks 1-4)**
- [ ] Database schema implementation
- [ ] Role and permission system
- [ ] JWT authentication with multi-context support
- [ ] Basic user management APIs
- [ ] Company onboarding flow

### **Phase 2: Advanced Features (Weeks 5-8)**
- [ ] Team member invitation system
- [ ] Homeowner self-registration
- [ ] Board member appointment workflow
- [ ] Session management and security
- [ ] Access logging and audit trail

### **Phase 3: Security & Compliance (Weeks 9-12)**
- [ ] Multi-factor authentication
- [ ] IP whitelisting and geo-restrictions
- [ ] Device management
- [ ] Security monitoring and alerts
- [ ] Compliance reporting

### **Phase 4: Mobile & Advanced (Weeks 13-16)**
- [ ] Mobile app authentication
- [ ] Biometric authentication support
- [ ] Advanced role transitions
- [ ] Analytics and reporting dashboard
- [ ] API rate limiting per role

---

**This access management system provides:**
- ✅ **Scalable multi-tenant architecture**
- ✅ **Granular role-based permissions**
- ✅ **Secure authentication & authorization**
- ✅ **Comprehensive audit trail**
- ✅ **Flexible user onboarding**
- ✅ **Enterprise-grade security**

**Ready for integration with the billing system!** 💳



