// Email templates for HOA Connect notifications

const emailTemplates = {
  // Request status updates
  request_status_update: {
    subject: 'HOA Request Update: {{request_title}}',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
        <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0; font-size: 24px;">HOA Connect</h1>
            <p style="color: #6b7280; margin: 5px 0 0 0;">Community Management Platform</p>
          </div>
          
          <!-- Main Content -->
          <h2 style="color: #1f2937; margin-bottom: 20px;">Request Status Update</h2>
          
          <p style="color: #374151; font-size: 16px; line-height: 1.5;">
            Hello {{homeowner_name}},
          </p>
          
          <p style="color: #374151; font-size: 16px; line-height: 1.5;">
            Your request "<strong>{{request_title}}</strong>" has been updated.
          </p>
          
          <!-- Status Update Box -->
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0; color: #374151;">
              <strong>Previous Status:</strong> <span style="text-transform: capitalize;">{{old_status}}</span>
            </p>
            <p style="margin: 10px 0 0 0; color: #374151;">
              <strong>New Status:</strong> <span style="text-transform: capitalize; color: #059669;">{{new_status}}</span>
            </p>
          </div>
          
          <p style="color: #374151; font-size: 16px; line-height: 1.5;">
            {{status_message}}
          </p>
          
          <!-- Action Button -->
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{login_url}}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block;">
              View Request Details
            </a>
          </div>
          
          <!-- Footer -->
          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px; text-align: center;">
            <p style="color: #6b7280; font-size: 14px; margin: 0;">
              This is an automated notification from HOA Connect.<br>
              Please do not reply to this email.
            </p>
          </div>
        </div>
      </div>
    `,
    text: `
      HOA Connect - Request Status Update
      
      Hello {{homeowner_name}},
      
      Your request "{{request_title}}" has been updated.
      
      Previous Status: {{old_status}}
      New Status: {{new_status}}
      
      {{status_message}}
      
      View your request details at: {{login_url}}
      
      This is an automated notification from HOA Connect.
    `
  },

  // Board voting notifications
  board_voting_request: {
    subject: 'Board Vote Required: {{request_title}}',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
        <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0; font-size: 24px;">HOA Connect</h1>
            <p style="color: #6b7280; margin: 5px 0 0 0;">Board Voting Portal</p>
          </div>
          
          <!-- Main Content -->
          <h2 style="color: #1f2937; margin-bottom: 20px;">🗳️ Board Vote Required</h2>
          
          <p style="color: #374151; font-size: 16px; line-height: 1.5;">
            Hello {{board_member_name}},
          </p>
          
          <p style="color: #374151; font-size: 16px; line-height: 1.5;">
            A new request requires your vote as a board member.
          </p>
          
          <!-- Request Details Box -->
          <div style="background-color: #fef3c7; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #f59e0b;">
            <p style="margin: 0; color: #92400e;">
              <strong>Request:</strong> {{request_title}}
            </p>
            <p style="margin: 10px 0 0 0; color: #92400e;">
              <strong>Homeowner:</strong> {{homeowner_name}}
            </p>
            {{#if due_date}}
            <p style="margin: 10px 0 0 0; color: #92400e;">
              <strong>Vote Due:</strong> {{due_date}}
            </p>
            {{/if}}
          </div>
          
          <p style="color: #374151; font-size: 16px; line-height: 1.5;">
            Please review the request details and cast your vote at your earliest convenience.
          </p>
          
          <!-- Action Button -->
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{voting_url}}" style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block;">
              Review & Vote Now
            </a>
          </div>
          
          <!-- Footer -->
          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px; text-align: center;">
            <p style="color: #6b7280; font-size: 14px; margin: 0;">
              This is an automated notification from HOA Connect.<br>
              Please do not reply to this email.
            </p>
          </div>
        </div>
      </div>
    `,
    text: `
      HOA Connect - Board Vote Required
      
      Hello {{board_member_name}},
      
      A new request requires your vote as a board member.
      
      Request: {{request_title}}
      Homeowner: {{homeowner_name}}
      {{#if due_date}}Vote Due: {{due_date}}{{/if}}
      
      Please review and vote at: {{voting_url}}
      
      This is an automated notification from HOA Connect.
    `
  },

  // Neighbor approval requests
  neighbor_approval_request: {
    subject: 'Neighbor Approval Needed: {{request_title}}',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
        <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0; font-size: 24px;">HOA Connect</h1>
            <p style="color: #6b7280; margin: 5px 0 0 0;">Community Management Platform</p>
          </div>
          
          <!-- Main Content -->
          <h2 style="color: #1f2937; margin-bottom: 20px;">🏠 Neighbor Approval Request</h2>
          
          <p style="color: #374151; font-size: 16px; line-height: 1.5;">
            Hello {{neighbor_name}},
          </p>
          
          <p style="color: #374151; font-size: 16px; line-height: 1.5;">
            Your neighbor has submitted a request that may affect your property and is seeking your approval.
          </p>
          
          <!-- Request Details Box -->
          <div style="background-color: #dbeafe; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #2563eb;">
            <p style="margin: 0; color: #1e40af;">
              <strong>Request:</strong> {{request_title}}
            </p>
            <p style="margin: 10px 0 0 0; color: #1e40af;">
              <strong>Homeowner:</strong> {{homeowner_name}}
            </p>
            <p style="margin: 10px 0 0 0; color: #1e40af;">
              <strong>Property:</strong> {{homeowner_address}}
            </p>
            <p style="margin: 10px 0 0 0; color: #1e40af;">
              <strong>Your Property:</strong> {{neighbor_address}}
            </p>
          </div>
          
          <p style="color: #374151; font-size: 16px; line-height: 1.5;">
            Please review the request details and provide your approval or feedback.
          </p>
          
          <!-- Action Button -->
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{approval_url}}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block;">
              Review & Respond
            </a>
          </div>
          
          <!-- Footer -->
          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px; text-align: center;">
            <p style="color: #6b7280; font-size: 14px; margin: 0;">
              This is an automated notification from HOA Connect.<br>
              Please do not reply to this email.
            </p>
          </div>
        </div>
      </div>
    `,
    text: `
      HOA Connect - Neighbor Approval Request
      
      Hello {{neighbor_name}},
      
      Your neighbor has submitted a request that may affect your property and is seeking your approval.
      
      Request: {{request_title}}
      Homeowner: {{homeowner_name}}
      Property: {{homeowner_address}}
      Your Property: {{neighbor_address}}
      
      Please review and respond at: {{approval_url}}
      
      This is an automated notification from HOA Connect.
    `
  },

  // Form distribution
  form_distribution: {
    subject: 'Important Form: {{form_title}}',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
        <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0; font-size: 24px;">HOA Connect</h1>
            <p style="color: #6b7280; margin: 5px 0 0 0;">Community Management Platform</p>
          </div>
          
          <!-- Main Content -->
          <h2 style="color: #1f2937; margin-bottom: 20px;">📋 Important Form Distribution</h2>
          
          <p style="color: #374151; font-size: 16px; line-height: 1.5;">
            Hello {{recipient_name}},
          </p>
          
          <p style="color: #374151; font-size: 16px; line-height: 1.5;">
            You have received an important form that requires your completion.
          </p>
          
          <!-- Form Details Box -->
          <div style="background-color: #f0fdf4; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #059669;">
            <p style="margin: 0; color: #065f46;">
              <strong>Form:</strong> {{form_title}}
            </p>
            {{#if due_date}}
            <p style="margin: 10px 0 0 0; color: #065f46;">
              <strong>Due Date:</strong> {{due_date}}
            </p>
            {{/if}}
          </div>
          
          <p style="color: #374151; font-size: 16px; line-height: 1.5;">
            Please complete this form at your earliest convenience. Digital signatures are accepted.
          </p>
          
          <!-- Action Button -->
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{form_url}}" style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block;">
              Complete Form Now
            </a>
          </div>
          
          <!-- Footer -->
          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px; text-align: center;">
            <p style="color: #6b7280; font-size: 14px; margin: 0;">
              This is an automated notification from HOA Connect.<br>
              Please do not reply to this email.
            </p>
          </div>
        </div>
      </div>
    `,
    text: `
      HOA Connect - Important Form Distribution
      
      Hello {{recipient_name}},
      
      You have received an important form that requires your completion.
      
      Form: {{form_title}}
      {{#if due_date}}Due Date: {{due_date}}{{/if}}
      
      Please complete the form at: {{form_url}}
      
      This is an automated notification from HOA Connect.
    `
  },

  // Form reminders
  form_reminder: {
    subject: 'Reminder: {{form_title}} - Action Required',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
        <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0; font-size: 24px;">HOA Connect</h1>
            <p style="color: #6b7280; margin: 5px 0 0 0;">Community Management Platform</p>
          </div>
          
          <!-- Main Content -->
          <h2 style="color: #dc2626; margin-bottom: 20px;">⏰ Form Completion Reminder</h2>
          
          <p style="color: #374151; font-size: 16px; line-height: 1.5;">
            Hello {{recipient_name}},
          </p>
          
          <p style="color: #374151; font-size: 16px; line-height: 1.5;">
            This is a friendly reminder that you have an incomplete form that requires your attention.
          </p>
          
          <!-- Form Details Box -->
          <div style="background-color: #fef2f2; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #dc2626;">
            <p style="margin: 0; color: #991b1b;">
              <strong>Form:</strong> {{form_title}}
            </p>
            {{#if due_date}}
            <p style="margin: 10px 0 0 0; color: #991b1b;">
              <strong>Due Date:</strong> {{due_date}}
            </p>
            {{/if}}
          </div>
          
          <p style="color: #374151; font-size: 16px; line-height: 1.5;">
            Please complete this form as soon as possible to avoid any delays or complications.
          </p>
          
          <!-- Action Button -->
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{form_url}}" style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block;">
              Complete Form Now
            </a>
          </div>
          
          <!-- Footer -->
          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px; text-align: center;">
            <p style="color: #6b7280; font-size: 14px; margin: 0;">
              This is an automated reminder from HOA Connect.<br>
              Please do not reply to this email.
            </p>
          </div>
        </div>
      </div>
    `,
    text: `
      HOA Connect - Form Completion Reminder
      
      Hello {{recipient_name}},
      
      This is a friendly reminder that you have an incomplete form that requires your attention.
      
      Form: {{form_title}}
      {{#if due_date}}Due Date: {{due_date}}{{/if}}
      
      Please complete the form at: {{form_url}}
      
      This is an automated reminder from HOA Connect.
    `
  },

  // New request submitted to management
  new_request_submitted: {
    subject: 'New HOA Request Submitted: {{request_title}}',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
        <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0; font-size: 24px;">HOA Connect</h1>
            <p style="color: #6b7280; margin: 5px 0 0 0;">Management Dashboard</p>
          </div>
          
          <!-- Main Content -->
          <h2 style="color: #1f2937; margin-bottom: 20px;">📝 New Request Submitted</h2>
          
          <p style="color: #374151; font-size: 16px; line-height: 1.5;">
            Hello {{management_name}},
          </p>
          
          <p style="color: #374151; font-size: 16px; line-height: 1.5;">
            A new request has been submitted and requires your review.
          </p>
          
          <!-- Request Details Box -->
          <div style="background-color: #fef3c7; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #f59e0b;">
            <p style="margin: 0; color: #92400e;">
              <strong>Request:</strong> {{request_title}}
            </p>
            <p style="margin: 10px 0 0 0; color: #92400e;">
              <strong>Type:</strong> <span style="text-transform: capitalize;">{{request_type}}</span>
            </p>
            <p style="margin: 10px 0 0 0; color: #92400e;">
              <strong>Homeowner:</strong> {{homeowner_name}}
            </p>
            <p style="margin: 10px 0 0 0; color: #92400e;">
              <strong>Property:</strong> {{property_address}}
            </p>
            <p style="margin: 10px 0 0 0; color: #92400e;">
              <strong>Community:</strong> {{community_name}}
            </p>
          </div>
          
          <p style="color: #374151; font-size: 16px; line-height: 1.5;">
            Please review the request details and begin the CC&R compliance review process.
          </p>
          
          <!-- Action Button -->
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{review_url}}" style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block;">
              Review Request Now
            </a>
          </div>
          
          <!-- Footer -->
          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px; text-align: center;">
            <p style="color: #6b7280; font-size: 14px; margin: 0;">
              This is an automated notification from HOA Connect.<br>
              Please do not reply to this email.
            </p>
          </div>
        </div>
      </div>
    `,
    text: `
      HOA Connect - New Request Submitted
      
      Hello {{management_name}},
      
      A new request has been submitted and requires your review.
      
      Request: {{request_title}}
      Type: {{request_type}}
      Homeowner: {{homeowner_name}}
      Property: {{property_address}}
      Community: {{community_name}}
      
      Please review the request at: {{review_url}}
      
      This is an automated notification from HOA Connect.
    `
  },

  // Test notification
  test_notification: {
    subject: 'HOA Connect - Test Notification',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
        <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0; font-size: 24px;">HOA Connect</h1>
            <p style="color: #6b7280; margin: 5px 0 0 0;">Community Management Platform</p>
          </div>
          
          <!-- Main Content -->
          <h2 style="color: #1f2937; margin-bottom: 20px;">✅ Test Notification</h2>
          
          <p style="color: #374151; font-size: 16px; line-height: 1.5;">
            {{test_message}}
          </p>
          
          <p style="color: #6b7280; font-size: 14px; line-height: 1.5;">
            Sent at: {{timestamp}}
          </p>
          
          <!-- Footer -->
          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px; text-align: center;">
            <p style="color: #6b7280; font-size: 14px; margin: 0;">
              This is a test notification from HOA Connect.<br>
              Please do not reply to this email.
            </p>
          </div>
        </div>
      </div>
    `,
    text: `
      HOA Connect - Test Notification
      
      {{test_message}}
      
      Sent at: {{timestamp}}
      
      This is a test notification from HOA Connect.
    `
  }
};

module.exports = emailTemplates;
