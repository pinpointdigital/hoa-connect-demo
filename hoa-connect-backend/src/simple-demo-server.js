const express = require('express');
const cors = require('cors');
const http = require('http');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3001;

// CORS configuration
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'HOA Connect Backend Demo (Simple)',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    message: 'Simple demo server for testing notifications'
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'HOA Connect Backend Demo (Simple)'
  });
});

// Test email endpoint for demo switcher
app.post('/api/test-email', async (req, res) => {
  try {
    const { userId, userEmail, userName, customMessage, customSubject } = req.body;
    
    const subject = customSubject || `HOA Connect Email Test [${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}]`;
    const message = customMessage || 'This is a test email from HOA Connect.';
    
    console.log('📧 Test Email Request:', { 
      userId, 
      userEmail, 
      userName, 
      subject,
      message: message.substring(0, 50) + (message.length > 50 ? '...' : '')
    });

    if (!userEmail) {
      return res.status(400).json({
        success: false,
        error: 'User email is required'
      });
    }

    // Simulate successful email sending
    const messageId = `demo-email-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`✅ Demo Email "sent" to ${userEmail} for user ${userName}`);
    console.log(`   Subject: ${subject}`);
    console.log(`   Message: ${message}`);
    
    res.json({
      success: true,
      message: 'Test email sent successfully (demo mode)',
      recipient: userEmail,
      subject: subject,
      emailMessage: message,
      messageId: messageId,
      timestamp: new Date().toISOString(),
      note: 'This is a demo - no actual email was sent'
    });

  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      details: 'Demo server error'
    });
  }
});

// Test SMS endpoint for demo switcher
app.post('/api/test-sms', async (req, res) => {
  try {
    const { userId, userPhone, userName, customMessage } = req.body;
    
    const message = customMessage || 'This is a test SMS from HOA Connect.';
    
    console.log('📱 Test SMS Request:', { 
      userId, 
      userPhone, 
      userName,
      message: message.substring(0, 50) + (message.length > 50 ? '...' : '')
    });

    if (!userPhone) {
      return res.status(400).json({
        success: false,
        error: 'User phone number is required'
      });
    }

    // Simulate successful SMS sending
    const messageId = `demo-sms-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`✅ Demo SMS "sent" to ${userPhone} for user ${userName}`);
    console.log(`   Message: ${message}`);
    
    res.json({
      success: true,
      message: 'Test SMS sent successfully (demo mode)',
      recipient: userPhone,
      smsMessage: message,
      messageId: messageId,
      timestamp: new Date().toISOString(),
      note: 'This is a demo - no actual SMS was sent'
    });

  } catch (error) {
    console.error('Test SMS error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      details: 'Demo server error'
    });
  }
});

// Workflow notification endpoints for request review process
app.post('/api/notifications/request-submitted', async (req, res) => {
  try {
    const { requestId, homeownerId, homeownerEmail, requestTitle } = req.body;
    
    console.log('📧 Request Submitted Notification:', { requestId, homeownerId, requestTitle });

    const messageId = `demo-request-submitted-${Date.now()}`;
    console.log(`✅ Demo notification "sent" to ${homeownerEmail} for request: ${requestTitle}`);

    res.json({ 
      success: true, 
      messageId,
      message: 'Request submitted notification sent (demo mode)',
      note: 'This is a demo - no actual email was sent'
    });

  } catch (error) {
    console.error('Request submitted notification error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/notifications/management-review', async (req, res) => {
  try {
    const { requestId, managementEmail, homeownerName, requestTitle } = req.body;
    
    console.log('📧 Management Review Notification:', { requestId, managementEmail, requestTitle });

    const messageId = `demo-management-review-${Date.now()}`;
    console.log(`✅ Demo notification "sent" to ${managementEmail} for request: ${requestTitle}`);

    res.json({ 
      success: true, 
      messageId,
      message: 'Management review notification sent (demo mode)',
      note: 'This is a demo - no actual email was sent'
    });

  } catch (error) {
    console.error('Management review notification error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/notifications/neighbor-approval', async (req, res) => {
  try {
    const { requestId, neighborEmails, homeownerName, requestTitle } = req.body;
    
    console.log('📧 Neighbor Approval Notifications:', { requestId, neighborCount: neighborEmails.length, requestTitle });

    const results = neighborEmails.map(email => ({
      email,
      success: true,
      messageId: `demo-neighbor-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
    }));

    console.log(`✅ Demo notifications "sent" to ${neighborEmails.length} neighbors for request: ${requestTitle}`);

    res.json({ 
      success: true, 
      results,
      message: `${neighborEmails.length}/${neighborEmails.length} neighbor notifications sent (demo mode)`,
      note: 'This is a demo - no actual emails were sent'
    });

  } catch (error) {
    console.error('Neighbor approval notification error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/notifications/board-voting', async (req, res) => {
  try {
    const { requestId, boardMemberEmails, homeownerName, requestTitle } = req.body;
    
    console.log('📧 Board Voting Notifications:', { requestId, boardMemberCount: boardMemberEmails.length, requestTitle });

    const results = boardMemberEmails.map(email => ({
      email,
      success: true,
      messageId: `demo-board-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
    }));

    console.log(`✅ Demo notifications "sent" to ${boardMemberEmails.length} board members for request: ${requestTitle}`);

    res.json({ 
      success: true, 
      results,
      message: `${boardMemberEmails.length}/${boardMemberEmails.length} board member notifications sent (demo mode)`,
      note: 'This is a demo - no actual emails were sent'
    });

  } catch (error) {
    console.error('Board voting notification error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/notifications/final-decision', async (req, res) => {
  try {
    const { requestId, homeownerEmail, homeownerName, requestTitle, decision } = req.body;
    
    console.log('📧 Final Decision Notification:', { requestId, homeownerEmail, decision });

    const messageId = `demo-final-decision-${Date.now()}`;
    console.log(`✅ Demo notification "sent" to ${homeownerEmail} for request: ${requestTitle} (${decision})`);

    res.json({ 
      success: true, 
      messageId,
      message: `Final decision notification sent (demo mode): ${decision}`,
      note: 'This is a demo - no actual email was sent'
    });

  } catch (error) {
    console.error('Final decision notification error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// General notification endpoint
app.post('/api/notifications/send', async (req, res) => {
  try {
    const notification = req.body;
    
    console.log('📧 General Notification:', notification);

    const messageId = `demo-general-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.log(`✅ Demo notification "sent" to ${notification.recipient}`);

    res.json({
      success: true,
      messageId,
      timestamp: new Date().toISOString(),
      message: 'Notification sent successfully (demo mode)',
      note: 'This is a demo - no actual notification was sent'
    });

  } catch (error) {
    console.error('General notification error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.originalUrl
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: error.message
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 HOA Connect Simple Demo Backend running on port ${PORT}`);
  console.log(`📧 Demo notification endpoints ready`);
  console.log(`🔗 Frontend URL: http://localhost:3000`);
  console.log(`💚 Health check: http://localhost:${PORT}/health`);
  console.log(`🎭 Demo mode: All notifications are simulated`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM. Starting graceful shutdown...');
  server.close(() => {
    console.log('Server closed successfully');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('Received SIGINT. Starting graceful shutdown...');
  server.close(() => {
    console.log('Server closed successfully');
    process.exit(0);
  });
});

module.exports = app;
