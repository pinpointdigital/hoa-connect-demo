// SMS templates for HOA Connect notifications

const smsTemplates = {
  // Request status updates
  request_status_sms: {
    text: `HOA Connect: Hi {{homeowner_name}}, your request "{{request_title}}" status: {{new_status}}. {{status_message}} Check details at hoaconnect.com. Reply STOP to opt out.`
  },

  // Board voting notifications
  board_voting_sms: {
    text: `HOA Connect: Hi {{board_member_name}}, board vote needed for "{{request_title}}"{{#if due_date}} by {{due_date}}{{/if}}. Vote at hoaconnect.com. Reply STOP to opt out.`
  },

  // Neighbor approval requests
  neighbor_approval_sms: {
    text: `HOA Connect: Hi {{neighbor_name}}, your neighbor {{homeowner_name}} needs approval for "{{request_title}}". Respond at hoaconnect.com. Reply STOP to opt out.`
  },

  // Form distribution
  form_distribution_sms: {
    text: `HOA Connect: Hi {{recipient_name}}, important form "{{form_title}}"{{#if due_date}} due {{due_date}}{{/if}}. Complete at hoaconnect.com. Reply STOP to opt out.`
  },

  // Form reminders
  form_reminder_sms: {
    text: `HOA Connect: Reminder {{recipient_name}}, form "{{form_title}}"{{#if due_date}} due {{due_date}}{{/if}} still pending. Complete at hoaconnect.com. Reply STOP to opt out.`
  },

  // New request submitted to management
  new_request_sms: {
    text: `HOA Connect: Hi {{management_name}}, new request "{{request_title}}" from {{homeowner_name}} needs review. Check hoaconnect.com. Reply STOP to opt out.`
  },

  // Test notification
  test_notification_sms: {
    text: `HOA Connect: Test message sent at {{timestamp}}. Your SMS notifications are working correctly. Reply STOP to opt out.`
  }
};

module.exports = smsTemplates;
