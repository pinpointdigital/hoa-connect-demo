const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const http = require('http');
const socketIo = require('socket.io');

// Set demo mode environment variables
process.env.DEMO_MODE = 'true';
process.env.SKIP_COMPLIANCE_CHECKS = 'true';

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false // Disable for demo
}));

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use(morgan('combined'));

// Root endpoint (HTML for browsers, JSON for API clients)
app.get('/', (req, res) => {
  const payload = {
    service: 'HOA Connect Backend Demo',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      notifications: {
        send: 'POST /api/notifications/send',
        bulk: 'POST /api/notifications/send-bulk',
        stats: 'GET /api/notifications/stats'
      }
    },
    frontend_url: process.env.FRONTEND_URL || 'http://localhost:3000'
  };

  if (req.accepts('html')) {
    const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>HOA Connect – Backend Status</title>
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; background:#f8fafc; color:#0f172a; }
      .container { max-width: 820px; margin: 48px auto; padding: 24px; background: #fff; border:1px solid #e5e7eb; border-radius: 12px; box-shadow: 0 1px 2px rgba(0,0,0,0.04); }
      h1 { margin: 0 0 4px; font-size: 22px; }
      .sub { color:#64748b; margin:0 0 20px; }
      .grid { display:grid; grid-template-columns: 1fr 1fr; gap: 16px; }
      .card { border:1px solid #e5e7eb; border-radius: 10px; padding:16px; background:#fafafa; }
      .label { color:#6b7280; font-size:12px; text-transform:uppercase; letter-spacing: .04em; }
      .value { font-size:14px; margin-top:6px; }
      pre { background:#0b1020; color:#cbd5e1; padding:16px; border-radius:10px; overflow:auto; font-size:12px; }
      a.btn { display:inline-block; margin-top:12px; padding:10px 14px; background:#2563eb; color:#fff; text-decoration:none; border-radius:8px; }
      .ok { color:#16a34a; font-weight:600; }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>HOA Connect – Backend Status</h1>
      <p class="sub">This server provides API endpoints for the HOA Connect frontend. If you want the app UI, open <a href="${payload.frontend_url}">${payload.frontend_url}</a>.</p>

      <div class="grid">
        <div class="card">
          <div class="label">Service</div>
          <div class="value">${payload.service}</div>
        </div>
        <div class="card">
          <div class="label">Status</div>
          <div class="value ok">${payload.status}</div>
        </div>
        <div class="card">
          <div class="label">Version</div>
          <div class="value">${payload.version}</div>
        </div>
        <div class="card">
          <div class="label">Timestamp</div>
          <div class="value">${payload.timestamp}</div>
        </div>
      </div>

      <h3 style="margin-top:24px;">Endpoints</h3>
      <div class="card">
        <div class="value">
          <div>Health: <code>${payload.endpoints.health}</code></div>
          <div>Notifications (send): <code>${payload.endpoints.notifications.send}</code></div>
          <div>Notifications (bulk): <code>${payload.endpoints.notifications.bulk}</code></div>
          <div>Notifications (stats): <code>${payload.endpoints.notifications.stats}</code></div>
        </div>
      </div>

      <h3 style="margin-top:24px;">Raw JSON</h3>
      <pre>${JSON.stringify(payload, null, 2)}</pre>

      <a class="btn" href="${payload.frontend_url}">Open Frontend</a>
    </div>
  </body>
  </html>`;
    res.type('html').send(html);
    return;
  }

  res.json(payload);
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'HOA Connect Backend Demo'
  });
});

// Demo notification endpoint
app.post('/api/notifications/send', async (req, res) => {
  try {
    const notification = req.body;
    
    // Validate required fields
    if (!notification.type || !notification.recipient || !notification.template) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: type, recipient, template'
      });
    }

    // Validate notification type
    if (!['email', 'sms'].includes(notification.type)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid notification type. Must be "email" or "sms"'
      });
    }
    
    console.log('📧 Real Notification Received:', {
      type: notification.type,
      recipient: notification.recipient,
      template: notification.template,
      timestamp: new Date().toISOString()
    });

    // Import notification service (singleton instance)
    const notificationService = require('./services/NotificationService');
    
    // Initialize if not already done
    if (!notificationService.isInitialized) {
      await notificationService.initialize();
    }

    // Send real notification
    const result = await notificationService.sendNotification(notification);

    if (result.success) {
      res.json({
        success: true,
        messageId: result.messageId,
        timestamp: new Date().toISOString(),
        message: 'Notification sent successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'Failed to send notification'
      });
    }

  } catch (error) {
    console.error('Demo notification error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Demo bulk notifications endpoint
app.post('/api/notifications/send-bulk', async (req, res) => {
  try {
    const { notifications } = req.body;
    
    console.log(`📧 Real Bulk Notifications Received: ${notifications.length} notifications`);

    // Import notification service (singleton instance)
    const notificationService = require('./services/NotificationService');
    
    // Initialize if not already done
    if (!notificationService.isInitialized) {
      await notificationService.initialize();
    }

    // Send real bulk notifications
    const results = [];
    for (const notification of notifications) {
      const result = await notificationService.sendNotification(notification);
      results.push(result);
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;

    res.json({
      success: failureCount === 0,
      results,
      message: `${successCount} notifications sent successfully${failureCount > 0 ? `, ${failureCount} failed` : ''}`
    });

  } catch (error) {
    console.error('Demo bulk notification error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Demo notification stats endpoint
app.get('/api/notifications/stats', (req, res) => {
  res.json({
    total_sent: 42,
    total_delivered: 40,
    total_failed: 2,
    delivery_rate: 95.2,
    last_updated: new Date().toISOString()
  });
});

// Test email endpoint for demo switcher
app.post('/api/test-email', async (req, res) => {
  try {
    const { userId, userEmail, userName } = req.body;
    
    console.log('📧 Test Email Request:', { userId, userEmail, userName });

    if (!userEmail) {
      return res.status(400).json({
        success: false,
        error: 'User email is required'
      });
    }

    // Import notification service
    const notificationService = require('./services/NotificationService');
    
    // Initialize if not already done
    if (!notificationService.isInitialized) {
      await notificationService.initialize();
    }

    // Create test notification
    const testNotification = {
      id: `test-email-${Date.now()}`,
      type: 'email',
      recipient: userEmail,
      template: 'test_notification',
      userId: userId,
      data: {
        userName: userName || 'Demo User',
        testMessage: 'This is a test email notification from HOA Connect.',
        timestamp: new Date().toISOString(),
        platform: 'HOA Connect Demo'
      },
      metadata: {
        source: 'demo_switcher',
        testType: 'email'
      }
    };

    // Send the notification
    const result = await notificationService.sendNotification(testNotification);

    if (result.success) {
      res.json({
        success: true,
        message: 'Test email sent successfully',
        recipient: userEmail,
        messageId: result.providerId,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'Failed to send test email',
        recipient: userEmail
      });
    }

  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      details: 'Check server logs for more information'
    });
  }
});

// Test SMS endpoint for demo switcher
app.post('/api/test-sms', async (req, res) => {
  try {
    const { userId, userPhone, userName } = req.body;
    
    console.log('📱 Test SMS Request:', { userId, userPhone, userName });

    if (!userPhone) {
      return res.status(400).json({
        success: false,
        error: 'User phone number is required'
      });
    }

    // Import notification service
    const notificationService = require('./services/NotificationService');
    
    // Initialize if not already done
    if (!notificationService.isInitialized) {
      await notificationService.initialize();
    }

    // Create test notification
    const testNotification = {
      id: `test-sms-${Date.now()}`,
      type: 'sms',
      recipient: userPhone,
      template: 'test_notification_sms',
      userId: userId,
      data: {
        userName: userName || 'Demo User',
        testMessage: 'This is a test SMS from HOA Connect.',
        timestamp: new Date().toISOString()
      },
      metadata: {
        source: 'demo_switcher',
        testType: 'sms'
      }
    };

    // Send the notification
    const result = await notificationService.sendNotification(testNotification);

    if (result.success) {
      res.json({
        success: true,
        message: 'Test SMS sent successfully',
        recipient: userPhone,
        messageId: result.providerId,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'Failed to send test SMS',
        recipient: userPhone
      });
    }

  } catch (error) {
    console.error('Test SMS error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      details: 'Check server logs for more information'
    });
  }
});

// Workflow notification endpoints for request review process
app.post('/api/notifications/request-submitted', async (req, res) => {
  try {
    const { requestId, homeownerId, homeownerEmail, requestTitle } = req.body;
    
    console.log('📧 Request Submitted Notification:', { requestId, homeownerId, requestTitle });

    const notificationService = require('./services/NotificationService');
    
    if (!notificationService.isInitialized) {
      await notificationService.initialize();
    }

    const notification = {
      id: `request-submitted-${requestId}`,
      type: 'email',
      recipient: homeownerEmail,
      template: 'new_request_submitted',
      userId: homeownerId,
      data: {
        requestTitle,
        requestId,
        timestamp: new Date().toISOString()
      },
      metadata: {
        source: 'workflow',
        requestId,
        step: 'submitted'
      }
    };

    const result = await notificationService.sendNotification(notification);
    res.json({ success: result.success, messageId: result.providerId });

  } catch (error) {
    console.error('Request submitted notification error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/notifications/management-review', async (req, res) => {
  try {
    const { requestId, managementEmail, homeownerName, requestTitle } = req.body;
    
    console.log('📧 Management Review Notification:', { requestId, managementEmail, requestTitle });

    const notificationService = require('./services/NotificationService');
    
    if (!notificationService.isInitialized) {
      await notificationService.initialize();
    }

    const notification = {
      id: `management-review-${requestId}`,
      type: 'email',
      recipient: managementEmail,
      template: 'request_status_update',
      data: {
        homeownerName,
        requestTitle,
        requestId,
        status: 'Pending Management Review',
        timestamp: new Date().toISOString()
      },
      metadata: {
        source: 'workflow',
        requestId,
        step: 'management_review'
      }
    };

    const result = await notificationService.sendNotification(notification);
    res.json({ success: result.success, messageId: result.providerId });

  } catch (error) {
    console.error('Management review notification error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/notifications/neighbor-approval', async (req, res) => {
  try {
    const { requestId, neighborEmails, homeownerName, requestTitle } = req.body;
    
    console.log('📧 Neighbor Approval Notifications:', { requestId, neighborCount: neighborEmails.length, requestTitle });

    const notificationService = require('./services/NotificationService');
    
    if (!notificationService.isInitialized) {
      await notificationService.initialize();
    }

    const results = [];
    for (const neighborEmail of neighborEmails) {
      const notification = {
        id: `neighbor-approval-${requestId}-${Date.now()}`,
        type: 'email',
        recipient: neighborEmail,
        template: 'neighbor_approval_request',
        data: {
          homeownerName,
          requestTitle,
          requestId,
          timestamp: new Date().toISOString()
        },
        metadata: {
          source: 'workflow',
          requestId,
          step: 'neighbor_approval'
        }
      };

      const result = await notificationService.sendNotification(notification);
      results.push({ email: neighborEmail, success: result.success, messageId: result.providerId });
    }

    const successCount = results.filter(r => r.success).length;
    res.json({ 
      success: successCount > 0, 
      results,
      message: `${successCount}/${results.length} neighbor notifications sent`
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

    const notificationService = require('./services/NotificationService');
    
    if (!notificationService.isInitialized) {
      await notificationService.initialize();
    }

    const results = [];
    for (const boardEmail of boardMemberEmails) {
      const notification = {
        id: `board-voting-${requestId}-${Date.now()}`,
        type: 'email',
        recipient: boardEmail,
        template: 'board_voting_request',
        data: {
          homeownerName,
          requestTitle,
          requestId,
          timestamp: new Date().toISOString()
        },
        metadata: {
          source: 'workflow',
          requestId,
          step: 'board_voting'
        }
      };

      const result = await notificationService.sendNotification(notification);
      results.push({ email: boardEmail, success: result.success, messageId: result.providerId });
    }

    const successCount = results.filter(r => r.success).length;
    res.json({ 
      success: successCount > 0, 
      results,
      message: `${successCount}/${results.length} board member notifications sent`
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

    const notificationService = require('./services/NotificationService');
    
    if (!notificationService.isInitialized) {
      await notificationService.initialize();
    }

    const notification = {
      id: `final-decision-${requestId}`,
      type: 'email',
      recipient: homeownerEmail,
      template: 'request_status_update',
      data: {
        homeownerName,
        requestTitle,
        requestId,
        status: decision === 'approved' ? 'Approved' : 'Rejected',
        decision,
        timestamp: new Date().toISOString()
      },
      metadata: {
        source: 'workflow',
        requestId,
        step: 'final_decision'
      }
    };

    const result = await notificationService.sendNotification(notification);
    res.json({ success: result.success, messageId: result.providerId });

  } catch (error) {
    console.error('Final decision notification error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
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

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.originalUrl
  });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Handle demo events
  socket.on('demo:reset', () => {
    console.log('Demo reset requested');
    io.emit('demo:reset-complete');
  });

  // Handle notification events
  socket.on('notification:send', (data) => {
    console.log('Notification sent:', data);
    io.emit('notification:received', data);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 HOA Connect Backend Demo running on port ${PORT}`);
  console.log(`📧 Notification endpoints ready`);
  console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  console.log(`💚 Health check: http://localhost:${PORT}/health`);
  console.log(`🔌 Socket.IO ready for connections`);
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
